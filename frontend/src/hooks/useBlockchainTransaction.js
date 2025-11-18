import { useState } from 'react';
import { Blaze, Core } from "@blaze-cardano/sdk";

export function useBlockchainTransaction() {
  const [isLoading, setIsLoading] = useState(false);

  const saveNoteToBlockchain = async ({
    provider,
    createWebWallet,
    walletAddress,
    title,
    content,
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

      const metadata = {
        1: { 
          title: trimmedTitle, 
          content: trimmedContent, 
          timestamp: new Date().toISOString() 
        },
      };

      const tx = await blaze
        .newTransaction()
        .payLovelace(Core.Address.fromBech32(walletAddress), 1_000_000n)
        .complete({
          metadata,
          changeAddress: walletAddress,
          utxoSelection: "auto",
        });

      const signedTx = await blaze.signTransaction(tx);
      const txHash = await blaze.provider.postTransactionToChain(signedTx);

      const newNote = { 
        title: trimmedTitle, 
        content: trimmedContent, 
        txHash, 
        timestamp: new Date().toISOString() 
      };

      if (onSuccess) {
        await onSuccess(newNote);
      }

      return newNote;
    } catch (err) {
      console.error("Failed to add note:", err);
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