import { useBlockchainTransaction } from './useBlockchainTransaction';
import { useTransactionCooldown } from './useTransactionCooldown';

/**
 * Hook that orchestrates the complete note submission flow:
 * 1. Cooldown check
 * 2. Wallet validation
 * 3. Blockchain transaction
 * 4. Database save
 * 5. UI updates
 */
export function useNoteSubmission({
  walletApi,
  provider,
  createWebWallet,
  walletAddress,
  saveNoteToDatabase,
  addNote,
  updateNote,
  showToast
}) {
  const { isLoading, saveNoteToBlockchain } = useBlockchainTransaction();
  const { 
    isInCooldown, 
    cooldownTimeLeft, 
    startCooldown, 
    checkCooldown 
  } = useTransactionCooldown();

  const submitNote = async ({ title, content, editingNote }) => {
    // Check cooldown
    try {
      checkCooldown();
    } catch (error) {
      showToast(error.message, "error");
      return { success: false };
    }

    // Validate wallet
    if (!walletApi) {
      showToast("Please connect your wallet first", "error");
      return { success: false };
    }

    // Validate content
    if (!title.trim() && !content.trim()) {
      showToast("Title or content is required", "error");
      return { success: false };
    }

    try {
      // Save to blockchain
      const newNote = await saveNoteToBlockchain({
        provider,
        createWebWallet,
        walletAddress,
        title,
        content,
        onError: (err) => {
          showToast("Failed to add note: " + err.message, "error");
        }
      });

      // Save to database
      const noteId = await saveNoteToDatabase(newNote, editingNote);
      if (noteId) {
        newNote.id = noteId;
      }

      // Update UI
      if (editingNote) {
        updateNote(editingNote.id, newNote);
        showToast("Note updated on blockchain successfully!", "success");
      } else {
        addNote(newNote);
        showToast("Note added to blockchain successfully!", "success");
      }

      // Start cooldown
      startCooldown();

      return { success: true };
    } catch (err) {
      // Error already handled in callback
      return { success: false };
    }
  };

  return {
    submitNote,
    isLoading,
    isInCooldown,
    cooldownTimeLeft
  };
}