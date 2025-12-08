import { useState } from 'react';
import { Blaze, Core } from "@blaze-cardano/sdk";

// HELPER FUNCTION: FORMAT CONTENT
// PURPOSE: CARDANO METADATA STRINGS CANNOT EXCEED 64 BYTES.
// THIS FUNCTION CHECKS THE LENGTH. IF IT IS SHORT, IT RETURNS A SIMPLE TEXT.
// IF IT IS LONG, IT SPLITS THE TEXT INTO CHUNKS AND RETURNS A LIST.
const formatContent = (content) => {
  // CASE 1: SHORT STRING (FITS IN ONE CHUNK)
  if (content.length <= 64) {
    return Core.Metadatum.newText(content);
  }
  
  // CASE 2: LONG STRING (NEEDS SPLITTING)
  // REGEX SPLITS THE STRING EVERY 64 CHARACTERS
  const chunks = content.match(/.{1,64}/g) || [];
  const list = new Core.MetadatumList();
  
  chunks.forEach(chunk => {
    list.add(Core.Metadatum.newText(chunk));
  });
  
  return Core.Metadatum.newList(list);
};

export function useBlockchainTransaction() {
  const [isLoading, setIsLoading] = useState(false);

  const saveNoteToBlockchain = async ({
    provider,
    createWebWallet,
    walletAddress,
    title = "",
    content = "",
    action = "create", // "create", "update", or "delete"
    noteId = null, // optional: for tracking specific notes
    onSuccess,
    onError
  }) => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent) {
      throw new Error("Title or content is required");
    }

    try {
      setIsLoading(true);

      const wallet = createWebWallet();
      const blaze = await Blaze.from(provider, wallet);

      // START BUILDING THE TRANSACTION: DEFINE PAYMENTS FIRST
      let tx = blaze
        .newTransaction()
        .payLovelace(
          Core.Address.fromBech32(walletAddress),
          1_000_000n
        );

      // --- METADATA CONSTRUCTION STARTS HERE ---
      
      // STEP 1: INITIALIZE THE TOP-LEVEL CONTAINER (STANDARD JAVASCRIPT MAP)
      // THIS MAP HOLDS ALL METADATA FOR THE TRANSACTION
      // KEY = BIGINT (LABEL), VALUE = METADATUM (DATA)
      const metadata = new Map();
      
      // CHOOSE A UNIQUE LABEL FOR YOUR APP TO IDENTIFY ITS DATA ON-CHAIN
      // USE A RANDOM LARGE NUMBER TO AVOID COLLISIONS WITH OTHER DAPPS
      const label = 42819n; // MUST BE A BIGINT (NOTE THE 'n' SUFFIX)
      
      // STEP 2: CREATE THE INNER DATA STRUCTURE (MetadatumMap)
      // THIS ACTS LIKE A JSON OBJECT TO STORE YOUR SPECIFIC FIELDS
      const metadatumMap = new Core.MetadatumMap();
      
      // STEP 3: INSERT KEY-VALUE PAIRS INTO THE INNER MAP
      // IMPORTANT: BOTH KEYS AND VALUES MUST BE CONVERTED TO 'METADATUM' TYPES
      
      // INSERT 'ACTION' (CREATE, UPDATE, DELETE)
      metadatumMap.insert(
        Core.Metadatum.newText("action"),
        Core.Metadatum.newText(action)
      );
      
      // INSERT 'TITLE' WITH CHUNKING SUPPORT
      metadatumMap.insert(
        Core.Metadatum.newText("title"),
        formatContent(trimmedTitle)
      );
      
      // INSERT 'CONTENT' WITH CHUNKING SUPPORT
      metadatumMap.insert(
        Core.Metadatum.newText("content"),
        formatContent(trimmedContent)
      );
      
      // INSERT 'TIMESTAMP' FOR SORTING LATER
      metadatumMap.insert(
        Core.Metadatum.newText("created_at"),
        Core.Metadatum.newText(new Date().toISOString())
      );
      
      // INSERT DESCRIPTION FOR DELETE ACTIONS
      if (action === "delete") {
        const deleteMessage = `Deleted ${trimmedTitle}`;
        metadatumMap.insert(
          Core.Metadatum.newText("description"),
          formatContent(deleteMessage)
        );
      }
      
      // OPTIONAL: INSERT 'NOTE_ID' IF PROVIDED (USEFUL FOR UPDATE/DELETE)
      if (noteId) {
        metadatumMap.insert(
          Core.Metadatum.newText("note_id"),
          Core.Metadatum.newText(String(noteId))
        );
      }
      
      // STEP 4: WRAP THE INNER 'METADATUMMAP' INTO A GENERIC 'METADATUM' OBJECT
      const metadatum = Core.Metadatum.newMap(metadatumMap);
      
      // STEP 5: ASSIGN THE DATA TO YOUR SPECIFIC LABEL IN THE TOP-LEVEL MAP
      metadata.set(label, metadatum);
      
      // STEP 6: CONVERT THE JAVASCRIPT MAP TO THE FINAL 'METADATA' TYPE REQUIRED BY BLAZE
      const finalMetadata = new Core.Metadata(metadata);
      
      // STEP 7: ATTACH THE METADATA TO THE TRANSACTION
      tx.setMetadata(finalMetadata);
      
      // --- FINALIZATION ---
      
      // BUILD, SIGN, AND SUBMIT THE TRANSACTION
      const completedTx = await tx.complete();
      const signedTx = await blaze.signTransaction(completedTx);
      const txHash = await blaze.provider.postTransactionToChain(signedTx);

      const newNote = { 
        title: trimmedTitle, 
        content: trimmedContent, 
        txHash, 
        timestamp: new Date().toISOString(),
        action // include the action type in the returned note
      };

      if (onSuccess) {
        await onSuccess(newNote);
      }

      return newNote;
    } catch (err) {
      console.error("Failed to save note to blockchain:", err);
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    saveNoteToBlockchain
  };
}