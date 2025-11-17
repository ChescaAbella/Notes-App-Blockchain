import { useState } from "react";
import { Blaze, Core } from "@blaze-cardano/sdk";
import "../styles/home.css";

// Hooks
import { useWallet } from "../hooks/useWallet";
import { useNotes } from "../hooks/useNotes";
import { useTransactionCooldown } from "../hooks/useTransactionCooldown";
import { useToast } from "../hooks/useToast";

// Context
import { useBlockchain } from "../context/BlockchainProvider";

// Utils
import { copyToClipboard } from "../utils/clipboard";
import { filterNotes } from "../utils/noteHelpers";

export default function HomePage() {
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Custom hooks
  const {
    wallets,
    walletApi,
    selectedWallet,
    setSelectedWallet,
    walletAddress,
    isConnecting,
    connectWallet,
    createWebWallet,
    isConnected
  } = useWallet();

  const { notes, saveNoteToDatabase, addNote, updateNote } = useNotes();
  const { isInCooldown, cooldownTimeLeft, startCooldown, checkCooldown } = useTransactionCooldown();
  const { toast, showToast } = useToast();
  const { provider } = useBlockchain();

  const openNote = (note) => {
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content });
    setHasChanges(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setDraft({ title: "", content: "" });
    setHasChanges(false);
  };

  const handleDraftChange = (field, value) => {
    setDraft({ ...draft, [field]: value });
    if (editingNote) {
      const changed = value !== editingNote[field];
      setHasChanges(changed || (field === 'title' ? draft.content !== editingNote.content : draft.title !== editingNote.title));
    }
  };

  const copyAddress = async () => {
    if (walletAddress) {
      const success = await copyToClipboard(walletAddress);
      if (success) {
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
      }
    }
  };

  const handleWalletChange = (e) => setSelectedWallet(e.target.value);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      showToast(`Successfully connected to ${selectedWallet}`, "success");
    } catch (err) {
      showToast(err.message || `Failed to connect to ${selectedWallet}`, "error");
    }
  };

  const addNoteOnChain = async (e) => {
    e.preventDefault();

    // If editing and has changes, show confirmation
    if (editingNote && hasChanges) {
      setShowConfirmModal(true);
      return;
    }

    await saveNoteToBlockchain();
  };

  const saveNoteToBlockchain = async () => {
    setShowConfirmModal(false);

    try {
      checkCooldown();
    } catch (error) {
      showToast(error.message, "error");
      return;
    }

    if (!walletApi) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title && !content) return;

    try {
      setIsLoading(true);

      const wallet = createWebWallet();
      const blaze = await Blaze.from(provider, wallet);

      const metadata = {
        1: { title, content, timestamp: new Date().toISOString() },
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
        title, 
        content, 
        txHash, 
        timestamp: new Date().toISOString() 
      };

      // Save to backend database
      const noteId = await saveNoteToDatabase(newNote, editingNote);
      if (noteId) {
        newNote.id = noteId;
      }

      // Update notes list - replace if editing, add if new
      if (editingNote) {
        updateNote(editingNote.id, newNote);
        showToast("Note updated on blockchain successfully!", "success");
      } else {
        addNote(newNote);
        showToast("Note added to blockchain successfully!", "success");
      }

      setDraft({ title: "", content: "" });
      closeModal();
      startCooldown();
    } catch (err) {
      console.error("Failed to add note:", err);
      showToast("Failed to add note: " + err.message, "error");
    } finally {
      setIsLoading(false);
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
                  onClick={handleConnectWallet}
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
                      {addressCopied ? "✓ Copied" : "📋 Copy"}
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
              <form onSubmit={addNoteOnChain} className="modal-form">
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
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
              <div className="modal-header">
                <h2>Confirm Changes</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowConfirmModal(false)}
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
                    onClick={() => setShowConfirmModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveNoteToBlockchain}
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