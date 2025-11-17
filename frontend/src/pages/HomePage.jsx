import { useState } from "react";
import "../styles/home.css";

// Hooks
import { useWallet } from "../hooks/useWallet";
import { useNotes } from "../hooks/useNotes";
import { useToast } from "../hooks/useToast";
import { useNoteEditor } from "../hooks/useNoteEditor";
import { useNoteSubmission } from "../hooks/useNoteSubmission";
import { useClipboardCopy } from "../hooks/useClipboardCopy";

// Context
import { useBlockchain } from "../context/BlockchainProvider";

// Utils
import { filterNotes } from "../utils/noteHelpers";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Context & Utils
  const { provider } = useBlockchain();
  const { toast, showToast } = useToast();
  const { isCopied, copy } = useClipboardCopy();

  // Wallet
  const {
    wallets,
    walletApi,
    selectedWallet,
    walletAddress,
    isConnecting,
    handleWalletChange,
    handleConnectWallet,
    createWebWallet,
    isConnected
  } = useWallet();

  // Notes
  const { notes, saveNoteToDatabase, addNote, updateNote } = useNotes();

  // Note Editor
  const {
    draft,
    editingNote,
    hasChanges,
    showModal,
    showConfirmModal,
    setShowModal,
    openNote,
    closeModal,
    handleDraftChange,
    handleSubmit,
    resetDraft,
    closeConfirmModal
  } = useNoteEditor();

  // Note Submission (orchestrates blockchain + database + cooldown)
  const { submitNote, isLoading, isInCooldown, cooldownTimeLeft } = useNoteSubmission({
    walletApi,
    provider,
    createWebWallet,
    walletAddress,
    saveNoteToDatabase,
    addNote,
    updateNote,
    showToast
  });

  // Simple UI handlers
  const copyAddress = () => copy(walletAddress);

  const connectWallet = async () => {
    await handleConnectWallet(
      (walletName) => showToast(`Successfully connected to ${walletName}`, "success"),
      (err) => showToast(err.message || `Failed to connect`, "error")
    );
  };

  const onSubmitNote = async () => {
    closeConfirmModal();
    
    const result = await submitNote({
      title: draft.title,
      content: draft.content,
      editingNote
    });

    if (result.success) {
      resetDraft();
      closeModal();
    }
  };

  const filteredNotes = filterNotes(notes, searchQuery);

  return (
    <div className="notes-wrap">
      <div className="notes-container">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="page-title">Your Blockchain Notes</h1>
            <p className="page-subtitle">
              Immutable. Decentralized. Forever yours.
            </p>
          </div>

          {!isConnected ? (
            <div className="wallet-connect-card">
              <div className="wallet-icon">🔐</div>
              <h3>Connect Your Wallet</h3>
              <p>Unlock blockchain-powered note-taking</p>
              <div className="wallet-actions">
                <select
                  value={selectedWallet || ""}
                  onChange={handleWalletChange}
                  className="wallet-select"
                  disabled={isConnecting}
                >
                  <option value="">Choose Wallet</option>
                  {wallets.map((w) => (
                    <option key={w} value={w}>
                      {w.charAt(0).toUpperCase() + w.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={connectWallet}
                  className="btn-connect"
                  disabled={isConnecting || !selectedWallet}
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          ) : (
            <div className="wallet-connected-card">
              <div className="wallet-info-section">
                <div className="wallet-status">
                  <div className="status-indicator"></div>
                  <span>Wallet Connected</span>
                </div>
                {walletAddress && (
                  <div className="wallet-address-container">
                    <div className="wallet-address-full" title={walletAddress}>
                      {walletAddress}
                    </div>
                    <button onClick={copyAddress} className="btn-copy">
                      {isCopied ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn-create"
                disabled={isLoading || isInCooldown}
              >
                {isInCooldown ? `Wait ${cooldownTimeLeft}s ` : <span className="btn-icon">+</span>}
                Create Note
              </button>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-value">{notes.length}</div>
                <div className="stat-label">Total Notes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⛓️</div>
              <div className="stat-content">
                <div className="stat-value">{notes.length}</div>
                <div className="stat-label">On-Chain</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔒</div>
              <div className="stat-content">
                <div className="stat-value">100%</div>
                <div className="stat-label">Secure</div>
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="notes-main">
            <div className="notes-header">
              <h2>My Notes</h2>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-modern"
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="empty-state-modern">
                <div className="empty-illustration">
                  <div className="empty-circle"></div>
                  <div className="empty-icon">🔭</div>
                </div>
                <h3>No notes yet</h3>
                <p>Start creating blockchain-secured notes</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-create-empty"
                  disabled={isInCooldown}
                >
                  {isInCooldown ? `Wait ${cooldownTimeLeft}s ` : "Create Your First Note"}
                </button>
              </div>
            ) : (
              <div className="notes-masonry">
                {filteredNotes.map((note, idx) => (
                  <div key={idx} className="note-item" onClick={() => openNote(note)} style={{cursor: 'pointer'}}>
                    <div className="note-item-header">
                      <h3>{note.title || "Untitled"}</h3>
                      <span className="chain-badge">⛓️</span>
                    </div>
                    <p className="note-item-content">{note.content}</p>
                    <div className="note-item-footer">
                      <span className="note-time">
                        {note.timestamp
                          ? new Date(note.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </span>
                      <span className="note-hash" title={note.txHash}>
                        {note.txHash.slice(0, 6)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingNote ? "Selected Note" : "Create New Note"}</h2>
                <button
                  className="modal-close"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>
              <form onSubmit={(e) => handleSubmit(e, onSubmitNote)} className="modal-form">
                <input
                  type="text"
                  placeholder="Note title"
                  value={draft.title}
                  onChange={(e) => handleDraftChange('title', e.target.value)}
                  className="modal-input"
                  autoFocus
                />
                <textarea
                  placeholder="Write your note..."
                  value={draft.content}
                  onChange={(e) => handleDraftChange('content', e.target.value)}
                  className="modal-textarea"
                  rows="10"
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isLoading || isInCooldown || (editingNote && !hasChanges)}
                  >
                    {isLoading
                      ? editingNote ? "Saving..." : "Adding..."
                      : isInCooldown
                      ? `Wait ${cooldownTimeLeft}s `
                      : editingNote ? "Save Changes" : "Add to Blockchain"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={closeConfirmModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
              <div className="modal-header">
                <h2>Confirm Changes</h2>
                <button
                  className="modal-close"
                  onClick={closeConfirmModal}
                >
                  ×
                </button>
              </div>
              <div style={{padding: '20px'}}>
                <p style={{marginBottom: '20px', lineHeight: '1.6'}}>
                  This will create a new transaction on the blockchain with the updated content. 
                  The original note remains immutably stored on-chain, but this version will be displayed.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={closeConfirmModal}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSubmitNote}
                    className="btn-submit"
                    disabled={isLoading}
                  >
                    Confirm & Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" ? "✓" : "✕"}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}