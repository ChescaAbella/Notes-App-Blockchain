import { useState, useCallback, useMemo, memo } from "react";
import {
  Lock,
  FileText,
  Shield,
  Search,
  Telescope,
  Plus,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  Link2,
  ChevronDown,
  Star,
  Pin,
} from "lucide-react";
import "../styles/home.css";

// Hooks
import { useWallet } from "../hooks/useWallet";
import { useNotes } from "../hooks/useNotes";
import { useTransactionCooldown } from "../hooks/useTransactionCooldown";
import { useToast } from "../hooks/useToast";
import { useBlockchainTransaction } from "../hooks/useBlockchainTransaction";
import { useBlockchain } from "../hooks/useBlockchain";

// Utils
import { copyToClipboard } from "../utils/clipboard";
import api from "../lib/api";

// Memoized Modal Component
const NoteModal = memo(({
  showModal,
  editingNote,
  draft,
  isLoading,
  isInCooldown,
  cooldownTimeLeft,
  hasChanges,
  onClose,
  onDraftChange,
  onSubmit,
}) => {
  if (!showModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingNote ? "Edit Note" : "Create New Note"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-form">
          <input
            type="text"
            placeholder="Note title"
            value={draft.title}
            onChange={(e) => onDraftChange('title', e.target.value)}
            className="modal-input"
            autoFocus
          />
          <textarea
            placeholder="Write your note..."
            value={draft.content}
            onChange={(e) => onDraftChange('content', e.target.value)}
            className="modal-textarea"
            rows="10"
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-submit"
              disabled={isLoading || isInCooldown || (editingNote && !hasChanges)}
            >
              {isLoading
                ? editingNote ? "Saving..." : "Adding..."
                : isInCooldown
                ? `Wait ${cooldownTimeLeft}s`
                : editingNote ? "Save Changes" : "Add to Blockchain"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

NoteModal.displayName = 'NoteModal';

// Memoized Confirmation Modal
const ConfirmModal = memo(({ show, isLoading, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '450px'}}>
        <div className="modal-header">
          <h2>Confirm Changes</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div style={{padding: '30px', paddingTop: '20px'}}>
          <p style={{marginBottom: '25px', lineHeight: '1.6'}}>
            This will create a new transaction on the blockchain with the updated content.
            The original note remains immutably stored on-chain.
          </p>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} className="btn-submit" disabled={isLoading}>
              Confirm & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ConfirmModal.displayName = 'ConfirmModal';

export default function HomePage() {
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [noteToRestore, setNoteToRestore] = useState(null);

  // Custom hooks
  const {
    wallets,
    selectedWallet,
    setSelectedWallet,
    walletAddress,
    isConnecting,
    connectWallet,
    createWebWallet,
    isConnected
  } = useWallet();

  const { notes, saveNoteToDatabase, addNote, updateNote, updateNoteMetadata } = useNotes();
  const { isInCooldown, cooldownTimeLeft, startCooldown, checkCooldown } = useTransactionCooldown();
  const { toast, showToast } = useToast();
  const { provider } = useBlockchain();
  const { isLoading: blockchainLoading, saveNoteToBlockchain } = useBlockchainTransaction();

  // Callbacks
  const openNote = useCallback((note) => {
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content });
    setHasChanges(false);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingNote(null);
    setDraft({ title: "", content: "" });
    setHasChanges(false);
  }, []);

  const handleDraftChange = useCallback((field, value) => {
    setDraft(prev => {
      const updated = { ...prev, [field]: value };
      if (editingNote) {
        setHasChanges(
          updated.title !== editingNote.title || updated.content !== editingNote.content
        );
      }
      return updated;
    });
  }, [editingNote]);

  const copyAddress = useCallback(async () => {
    if (walletAddress) {
      const success = await copyToClipboard(walletAddress);
      if (success) {
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
      }
    }
  }, [walletAddress]);

  const handleWalletChange = useCallback((e) => {
    setSelectedWallet(e.target.value);
  }, [setSelectedWallet]);

  const handleConnectWallet = useCallback(async () => {
    try {
      await connectWallet();
      showToast(`Successfully connected to ${selectedWallet}`, "success");
    } catch (err) {
      showToast(err.message || `Failed to connect to ${selectedWallet}`, "error");
    }
  }, [connectWallet, selectedWallet, showToast]);

  const togglePin = useCallback(async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const updated = { ...note, is_pinned: !note.is_pinned };
      updateNote(noteId, updated);
      await updateNoteMetadata(noteId, { is_pinned: !note.is_pinned });
    }
  }, [notes, updateNote, updateNoteMetadata]);

  const toggleFavorite = useCallback(async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const updated = { ...note, is_favorite: !note.is_favorite };
      updateNote(noteId, updated);
      await updateNoteMetadata(noteId, { is_favorite: !note.is_favorite });
    }
  }, [notes, updateNote, updateNoteMetadata]);

  const handleDeleteNote = useCallback((note) => {
    setNoteToDelete(note);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!noteToDelete) return;

    try {
      setIsLoading(true);

      // Create blockchain transaction for deletion
      const wallet = createWebWallet();
      const { Blaze, Core } = await import("@blaze-cardano/sdk");
      const blaze = await Blaze.from(provider, wallet);

      const metadata = {
        1: {
          action: "delete_note",
          noteId: noteToDelete.id,
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
      const deletionTxHash = await blaze.provider.postTransactionToChain(signedTx);

      // Save deletion to backend
      await api.post(`notes/${noteToDelete.id}/soft-delete`, { txHash: deletionTxHash });

      // Update UI
      const updatedNote = { ...noteToDelete, deleted_at: new Date().toISOString(), deletion_tx_hash: deletionTxHash };
      updateNote(noteToDelete.id, updatedNote);

      showToast("Note soft deleted! Check trash to restore.", "success");
      setNoteToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("Failed to delete note: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setIsLoading(false);
    }
  }, [noteToDelete, updateNote, showToast, provider, walletAddress, createWebWallet]);

  const handleRestoreNote = useCallback(async (note) => {
    try {
      setIsLoading(true);
      await api.post(`notes/${note.id}/restore`);

      const restoredNote = { ...note, deleted_at: null, deletion_tx_hash: null };
      updateNote(note.id, restoredNote);

      showToast("Note restored!", "success");
      setNoteToRestore(null);
    } catch (err) {
      console.error("Restore failed:", err);
      showToast("Failed to restore note: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setIsLoading(false);
    }
  }, [updateNote, showToast]);

  const handleSaveNote = useCallback(async () => {
    setShowConfirmModal(false);

    try {
      checkCooldown();
    } catch (error) {
      showToast(error.message, "error");
      return;
    }

    try {
      await saveNoteToBlockchain({
        provider,
        createWebWallet,
        walletAddress,
        title: draft.title,
        content: draft.content,
        onSuccess: async (note) => {
          const noteId = await saveNoteToDatabase(note, editingNote);
          if (noteId) {
            note.id = noteId;
          }

          if (editingNote) {
            updateNote(editingNote.id, note);
            showToast("Note updated on blockchain successfully!", "success");
          } else {
            addNote(note);
            showToast("Note added to blockchain successfully!", "success");
          }

          setDraft({ title: "", content: "" });
          closeModal();
          startCooldown();
        },
        onError: (err) => {
          showToast("Failed to add note: " + err.message, "error");
        }
      });
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  }, [checkCooldown, showToast, saveNoteToBlockchain, provider, createWebWallet,
    walletAddress, draft, saveNoteToDatabase, editingNote, updateNote, addNote,
    closeModal, startCooldown]);

  const addNoteOnChain = useCallback((e) => {
    e.preventDefault();
    if (editingNote && hasChanges) {
      setShowConfirmModal(true);
      return;
    }
    handleSaveNote();
  }, [editingNote, hasChanges, handleSaveNote]);

  // Memoized filtered notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (showTrash) {
      filtered = notes.filter(note => note.deleted_at);
    } else {
      filtered = notes.filter(note => !note.deleted_at);
    }

    return filtered
      .filter((note) => {
        const matchesSearch =
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = showTrash ||
          filter === "all" ||
          (filter === "favorites" && note.is_favorite) ||
          (filter === "pinned" && note.is_pinned);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (!showTrash) {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
        }
        const aTime = showTrash ? (a.deleted_at || a.timestamp || 0) : (a.timestamp || 0);
        const bTime = showTrash ? (b.deleted_at || b.timestamp || 0) : (b.timestamp || 0);
        return new Date(bTime) - new Date(aTime);
      });
  }, [notes, searchQuery, filter, showTrash]);

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
              <div className="wallet-icon">
                <Lock size={64} strokeWidth={1.5} />
              </div>
              <h3>Connect Your Wallet</h3>
              <p>Unlock blockchain-powered note-taking</p>
              <div className="wallet-actions">
                <div className="custom-select-wrapper">
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
                  <ChevronDown className="select-icon" size={20} />
                </div>
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
                      {addressCopied ? (
                        <>
                          <Check size={16} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn-create"
                disabled={blockchainLoading || isInCooldown}
              >
                {isInCooldown ? (
                  `Wait ${cooldownTimeLeft}s`
                ) : (
                  <>
                    <Plus size={20} strokeWidth={2.5} />
                    Create Note
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-icon">
                <FileText size={40} strokeWidth={1.5} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{notes.length}</div>
                <div className="stat-label">Total Notes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Link2 size={40} strokeWidth={1.5} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{notes.length}</div>
                <div className="stat-label">On-Chain</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Shield size={40} strokeWidth={1.5} />
              </div>
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
              <h2>{showTrash ? "Trash" : "My Notes"}</h2>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-modern"
                />
                <Search className="search-icon" size={18} />
              </div>
            </div>

            <div className="filter-bar">
              {!showTrash ? (
                <>
                  <button
                    className={`filter-btn ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    All Notes
                  </button>
                  <button
                    className={`filter-btn ${filter === "favorites" ? "active" : ""}`}
                    onClick={() => setFilter("favorites")}
                  >
                    <Star size={16} /> Favorites
                  </button>
                  <button
                    className={`filter-btn ${filter === "pinned" ? "active" : ""}`}
                    onClick={() => setFilter("pinned")}
                  >
                    <Pin size={16} /> Pinned
                  </button>
                </>
              ) : null}
              <button
                className={`filter-btn ${showTrash ? "active" : ""}`}
                onClick={() => setShowTrash(!showTrash)}
                style={{ marginLeft: 'auto' }}
              >
                🗑️ Trash
              </button>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="empty-state-modern">
                <div className="empty-illustration">
                  <div className="empty-circle"></div>
                  <div className="empty-icon">
                    <Telescope size={56} strokeWidth={1.5} />
                  </div>
                </div>
                <h3>{showTrash ? "Trash is empty" : "No notes yet"}</h3>
                <p>{showTrash ? "Deleted notes will appear here" : "Start creating blockchain-secured notes"}</p>
                {!showTrash && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-create-empty"
                    disabled={isInCooldown}
                  >
                    {isInCooldown ? `Wait ${cooldownTimeLeft}s` : "Create Your First Note"}
                  </button>
                )}
              </div>
            ) : (
              <div className="notes-masonry">
                {filteredNotes.map((note, idx) => (
                  <div key={note.id || idx} className={`note-item ${note.is_pinned ? 'pinned' : ''}`} style={{cursor: 'pointer'}}>
                    <div className="note-item-header">
                      <h3 onClick={() => !showTrash && openNote(note)}>{note.title || "Untitled"}</h3>
                      <div className="note-actions">
                        {!showTrash ? (
                          <>
                            <button
                              className={`action-btn ${note.is_pinned ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(note.id);
                              }}
                              title={note.is_pinned ? "Unpin note" : "Pin note"}
                            >
                              <Pin size={16} fill={note.is_pinned ? "currentColor" : "none"} />
                            </button>
                            <button
                              className={`action-btn ${note.is_favorite ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(note.id);
                              }}
                              title={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star size={16} fill={note.is_favorite ? "currentColor" : "none"} />
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note);
                              }}
                              title="Delete note"
                              disabled={isLoading}
                            >
                              {isLoading ? "..." : "🗑️"}
                            </button>
                          </>
                        ) : (
                          <button
                            className="action-btn restore"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteToRestore(note);
                            }}
                            title="Restore note"
                            disabled={isLoading}
                          >
                            {isLoading ? "..." : "↩️ Restore"}
                          </button>
                        )}
                        <span className="chain-badge">
                          <Link2 size={14} style={{display: 'inline-block', verticalAlign: 'middle'}} />
                        </span>
                      </div>
                    </div>
                    <p className="note-item-content" onClick={() => !showTrash && openNote(note)}>{note.content}</p>
                    <div className="note-item-footer" onClick={() => !showTrash && openNote(note)}>
                      <span className="note-time">
                        {showTrash && note.deleted_at
                          ? new Date(note.deleted_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : note.timestamp
                          ? new Date(note.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </span>
                      <span className="note-hash" title={note.deletion_tx_hash || note.txHash || ""}>
                        {(note.deletion_tx_hash || note.txHash || "").slice(0, 6)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <NoteModal
          showModal={showModal}
          editingNote={editingNote}
          draft={draft}
          isLoading={blockchainLoading}
          isInCooldown={isInCooldown}
          cooldownTimeLeft={cooldownTimeLeft}
          hasChanges={hasChanges}
          onClose={closeModal}
          onDraftChange={handleDraftChange}
          onSubmit={addNoteOnChain}
        />

        <ConfirmModal
          show={showConfirmModal}
          isLoading={blockchainLoading}
          onConfirm={handleSaveNote}
          onCancel={() => setShowConfirmModal(false)}
        />

        {/* Delete Confirmation Modal */}
        {noteToDelete && (
          <div className="modal-overlay" onClick={() => setNoteToDelete(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '450px'}}>
              <div className="modal-header">
                <h2>Delete Note</h2>
                <button className="modal-close" onClick={() => setNoteToDelete(null)}>×</button>
              </div>
              <div style={{padding: '30px', paddingTop: '20px'}}>
                <p style={{marginBottom: '15px', lineHeight: '1.6', fontWeight: '500'}}>
                  Delete "{noteToDelete.title || 'Untitled'}"?
                </p>
                <p style={{marginBottom: '25px', lineHeight: '1.6', color: '#666'}}>
                  ⛓️ This will move the note to trash. You can restore it anytime.
                </p>
                <div className="modal-actions">
                  <button type="button" onClick={() => setNoteToDelete(null)} className="btn-cancel">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="btn-submit"
                    style={{background: '#ef4444'}}
                    disabled={isLoading}
                  >
                    {isLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore Confirmation Modal */}
        {noteToRestore && (
          <div className="modal-overlay" onClick={() => setNoteToRestore(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '450px'}}>
              <div className="modal-header">
                <h2>Restore Note</h2>
                <button className="modal-close" onClick={() => setNoteToRestore(null)}>×</button>
              </div>
              <div style={{padding: '30px', paddingTop: '20px'}}>
                <p style={{marginBottom: '15px', lineHeight: '1.6', fontWeight: '500'}}>
                  Restore "{noteToRestore.title || 'Untitled'}"?
                </p>
                <p style={{marginBottom: '25px', lineHeight: '1.6', color: '#666'}}>
                  ↩️ This will move the note back to your notes.
                </p>
                <div className="modal-actions">
                  <button type="button" onClick={() => setNoteToRestore(null)} className="btn-cancel">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestoreNote(noteToRestore)}
                    className="btn-submit"
                    style={{background: '#22c55e'}}
                    disabled={isLoading}
                  >
                    {isLoading ? "Restoring..." : "Restore Note"}
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
              {toast.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
