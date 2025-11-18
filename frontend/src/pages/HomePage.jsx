<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import { Buffer } from "buffer";
import api from "../lib/api";
=======
import { useState, useCallback, useMemo, memo } from "react";
import { Lock, FileText, Shield, Search, Telescope, Plus, Copy, Check, CheckCircle, XCircle, Link2, ChevronDown, Star, Pin } from "lucide-react";
>>>>>>> feat/soft-deletion
import "../styles/home.css";

// Hooks
import { useWallet } from "../hooks/useWallet";
import { useNotes } from "../hooks/useNotes";
import { useTransactionCooldown } from "../hooks/useTransactionCooldown";
import { useToast } from "../hooks/useToast";
import { useBlockchainTransaction } from "../hooks/useBlockchainTransaction";

// Context
import { useBlockchain } from "../context/BlockchainProvider";

// Utils
import { copyToClipboard } from "../utils/clipboard";
import { filterNotes } from "../utils/noteHelpers";

// Memoized Modal Component - prevents re-renders when not needed
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
  onSubmit 
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
          <h2>{editingNote ? "Selected Note" : "Create New Note"}</h2>
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
            The original note remains immutably stored on-chain, but this version will be displayed.
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

// Memoized Note Card Component with pin/favorite actions
const NoteCard = memo(({ note, onClick, onTogglePin, onToggleFavorite }) => (
  <div className={`note-item ${note.is_pinned ? 'pinned' : ''}`} style={{cursor: 'pointer'}}>
    <div className="note-item-header">
      <h3 onClick={onClick}>{note.title || "Untitled"}</h3>
      <div className="note-actions">
        <button
          className={`action-btn ${note.is_pinned ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note.id);
          }}
          title={note.is_pinned ? "Unpin note" : "Pin note"}
        >
          <Pin size={16} fill={note.is_pinned ? "currentColor" : "none"} />
        </button>
        <button
          className={`action-btn ${note.is_favorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(note.id);
          }}
          title={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star size={16} fill={note.is_favorite ? "currentColor" : "none"} />
        </button>
        <span className="chain-badge">
          <Link2 size={14} style={{display: 'inline-block', verticalAlign: 'middle'}} />
        </span>
      </div>
    </div>
    <p className="note-item-content" onClick={onClick}>{note.content}</p>
    <div className="note-item-footer" onClick={onClick}>
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
));

NoteCard.displayName = 'NoteCard';

export default function HomePage() {
<<<<<<< HEAD
  const [notes, setNotes] = useState([]);
  const [deletedNotes, setDeletedNotes] = useState([]);
=======
>>>>>>> feat/soft-deletion
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
<<<<<<< HEAD
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [noteToEdit, setNoteToEdit] = useState(null);
=======
  const [editingNote, setEditingNote] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all, favorites, pinned
>>>>>>> feat/soft-deletion

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

  const { notes, saveNoteToDatabase, addNote, updateNote } = useNotes();
  const { isInCooldown, cooldownTimeLeft, startCooldown, checkCooldown } = useTransactionCooldown();
  const { toast, showToast } = useToast();
  const { provider } = useBlockchain();
  const { isLoading, saveNoteToBlockchain } = useBlockchainTransaction();

  // Memoized callbacks to prevent unnecessary re-renders
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
          updated.title !== editingNote.title || 
          updated.content !== editingNote.content
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
<<<<<<< HEAD
      setIsLoading(true);
      const walletApi = await window.cardano[selectedWallet].enable();
      setWalletApi(walletApi);

      const hexAddress = await walletApi.getChangeAddress();
      const bech32Address = Core.Address.fromBytes(
        Buffer.from(hexAddress, "hex")
      ).toBech32();
      setWalletAddress(bech32Address);

=======
      await connectWallet();
>>>>>>> feat/soft-deletion
      showToast(`Successfully connected to ${selectedWallet}`, "success");
    } catch (err) {
      showToast(err.message || `Failed to connect to ${selectedWallet}`, "error");
    }
  }, [connectWallet, selectedWallet, showToast]);

  const togglePin = useCallback((noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { ...note, is_pinned: !note.is_pinned });
    }
  }, [notes, updateNote]);

  const toggleFavorite = useCallback((noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { ...note, is_favorite: !note.is_favorite });
    }
  }, [notes, updateNote]);

  const handleSaveNote = useCallback(async () => {
    setShowConfirmModal(false);

    try {
      checkCooldown();
    } catch (error) {
      showToast(error.message, "error");
      return;
    }

<<<<<<< HEAD
  const deleteNoteOnChain = async (note) => {
    const now = Date.now();
    if (lastTxTime && now - lastTxTime < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastTxTime)) / 1000);
      showToast(`Please wait ${remaining}s before deleting another note`, "error");
      return;
    }

    try {
      setIsLoading(true);

      const wallet = new WebWallet(walletApi);
      const blaze = await Blaze.from(provider, wallet);

      const metadata = {
        1: { 
          deletionRecord: true,
          originalNoteId: note.txHash,
          deletedAt: new Date().toISOString(),
          message: `Note "${note.title}" marked for deletion on blockchain`
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

      // Update backend with soft delete and transaction hash
      await api.post(`/notes/${note.id}/soft-delete`, { txHash: deletionTxHash });

      // Remove from notes and add to deleted notes
      setNotes(notes.filter(n => n.txHash !== note.txHash));
      setDeletedNotes([
        { ...note, deletedAt: new Date().toISOString(), deletion_tx_hash: deletionTxHash },
        ...deletedNotes,
      ]);

      setNoteToDelete(null);
      showToast("Note soft deleted with blockchain record!", "success");
      setLastTxTime(Date.now());
    } catch (err) {
      console.error("Failed to delete note:", err);
      showToast("Failed to delete note: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const editNoteOnChain = async (note, updatedTitle, updatedContent) => {
    const now = Date.now();
    if (lastTxTime && now - lastTxTime < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastTxTime)) / 1000);
      showToast(`Please wait ${remaining}s before editing another note`, "error");
      return;
    }

    try {
      setIsLoading(true);

      const wallet = new WebWallet(walletApi);
      const blaze = await Blaze.from(provider, wallet);

      const metadata = {
        1: {
          editRecord: true,
          originalNoteId: note.txHash,
          title: updatedTitle,
          content: updatedContent,
          editedAt: new Date().toISOString(),
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
      const editTxHash = await blaze.provider.postTransactionToChain(signedTx);

      // Update backend with edit tx hash
      await api.put(`/notes/${note.id}`, { title: updatedTitle, content: updatedContent, txHash: editTxHash });

      // Update local state
      setNotes(notes.map(n => n.id === note.id ? { ...n, title: updatedTitle, content: updatedContent, last_edit_tx_hash: editTxHash, updated_at: new Date().toISOString() } : n));

      setNoteToEdit(null);
      showToast("Note edited and recorded on blockchain!", "success");
      setLastTxTime(Date.now());
    } catch (err) {
      console.error("Failed to edit note:", err);
      showToast("Failed to edit note: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const restoreNote = async (note) => {
    try {
      setIsLoading(true);
      await api.post(`/notes/${note.id}/restore`);
      
      setDeletedNotes(deletedNotes.filter(n => n.id !== note.id));
      setNotes([note, ...notes]);
      
      showToast("Note restored successfully!", "success");
    } catch (err) {
      console.error("Failed to restore note:", err);
      showToast("Failed to restore note: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
=======
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

  // Memoized filtered notes with filter and search
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesSearch =
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
          filter === "all" ||
          (filter === "favorites" && note.is_favorite) ||
          (filter === "pinned" && note.is_pinned);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        // Sort by pinned status first (pinned notes come first)
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        // Then sort by timestamp
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }, [notes, searchQuery, filter]);
>>>>>>> feat/soft-deletion

  const filteredDeletedNotes = deletedNotes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
                disabled={isLoading || isInCooldown}
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
              <div className="notes-header-left">
                <h2>{showTrash ? "Trash" : "My Notes"}</h2>
                <button 
                  onClick={() => setShowTrash(!showTrash)}
                  className="btn-trash-toggle"
                  title={showTrash ? "View active notes" : "View deleted notes"}
                >
                  🗑️ {deletedNotes.length > 0 && <span className="trash-badge">{deletedNotes.length}</span>}
                </button>
              </div>
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

<<<<<<< HEAD
            {!showTrash ? (
              <>
                {filteredNotes.length === 0 ? (
                  <div className="empty-state-modern">
                    <div className="empty-illustration">
                      <div className="empty-circle"></div>
                      <div className="empty-icon">📭</div>
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
                      <div key={idx} className="note-item">
                        <div className="note-item-header">
                          <h3>{note.title || "Untitled"}</h3>
                          <div className="note-item-actions">
                            <span className="chain-badge">⛓️</span>
                            <button
                              className="btn-edit-note"
                              onClick={() => setNoteToEdit(note)}
                              title="Edit note"
                              disabled={isLoading}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-delete-note"
                              onClick={() => setNoteToDelete(note)}
                              title="Delete note"
                              disabled={isLoading}
                            >
                              🗑️
                            </button>
                          </div>
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
              </>
            ) : (
              <>
                {filteredDeletedNotes.length === 0 ? (
                  <div className="empty-state-modern">
                    <div className="empty-illustration">
                      <div className="empty-circle"></div>
                      <div className="empty-icon">✨</div>
                    </div>
                    <h3>No deleted notes</h3>
                    <p>Your deleted notes will appear here</p>
                  </div>
                ) : (
                  <div className="notes-masonry">
                    {filteredDeletedNotes.map((note, idx) => (
                      <div key={idx} className="note-item deleted">
                        <div className="note-item-header">
                          <h3>{note.title || "Untitled"}</h3>
                          <div className="note-item-actions">
                            <span className="deletion-badge">⛓️🗑️</span>
                          </div>
                        </div>
                        <p className="note-item-content deleted-content">{note.content}</p>
                        <div className="note-item-footer">
                          <span className="note-time">
                            Deleted: {note.deletedAt
                              ? new Date(note.deletedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Unknown"}
                          </span>
                          <span className="note-hash" title={note.deletion_tx_hash || "Pending"}>
                            {note.deletion_tx_hash ? note.deletion_tx_hash.slice(0, 6) + "..." : "Pending"}
                          </span>
                        </div>
                        <button
                          className="btn-restore"
                          onClick={() => restoreNote(note)}
                          disabled={isLoading}
                        >
                          ↺ Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {noteToDelete && (
          <div className="modal-overlay" onClick={() => setNoteToDelete(null)}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Soft Delete Note</h2>
=======
            <div className="filter-bar">
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
            </div>

            {filteredNotes.length === 0 ? (
              <div className="empty-state-modern">
                <div className="empty-illustration">
                  <div className="empty-circle"></div>
                  <div className="empty-icon">
                    <Telescope size={56} strokeWidth={1.5} />
                  </div>
                </div>
                <h3>No notes yet</h3>
                <p>Start creating blockchain-secured notes</p>
>>>>>>> feat/soft-deletion
                <button
                  className="modal-close"
                  onClick={() => setNoteToDelete(null)}
                >
<<<<<<< HEAD
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>You're about to (soft) delete this note:</p>
                <div className="note-preview">
                  <h4>{noteToDelete.title || "Untitled"}</h4>
                  <p>{noteToDelete.content}</p>
                </div>
                <p className="warning-text">
                  ⛓️ A deletion record will be created on the blockchain to maintain an immutable audit trail.
                </p>
=======
                  {isInCooldown ? `Wait ${cooldownTimeLeft}s` : "Create Your First Note"}
                </button>
              </div>
            ) : (
              <div className="notes-masonry">
                {filteredNotes.map((note, idx) => (
                  <NoteCard 
                    key={note.id || idx} 
                    note={note} 
                    onClick={() => openNote(note)}
                    onTogglePin={togglePin}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
>>>>>>> feat/soft-deletion
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setNoteToDelete(null)}
                  className="btn-cancel"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteNoteOnChain(noteToDelete)}
                  className="btn-delete-confirm"
                  disabled={isLoading || isInCooldown}
                >
                  {isLoading ? "Deleting..." : isInCooldown ? `Wait ${cooldownTimeLeft}s` : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {noteToEdit && (
          <div className="modal-overlay" onClick={() => setNoteToEdit(null)}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Note</h2>
                <button
                  className="modal-close"
                  onClick={() => setNoteToEdit(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>Edit the note content — this will create an immutable edit record on the blockchain.</p>
                <div className="note-preview">
                  <input
                    className="modal-input"
                    value={noteToEdit.title}
                    onChange={(e) => setNoteToEdit({ ...noteToEdit, title: e.target.value })}
                    placeholder="Title"
                  />
                  <textarea
                    className="modal-textarea"
                    rows={8}
                    value={noteToEdit.content}
                    onChange={(e) => setNoteToEdit({ ...noteToEdit, content: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setNoteToEdit(null)}
                  className="btn-cancel"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => editNoteOnChain(noteToEdit, noteToEdit.title, noteToEdit.content)}
                  className="btn-submit"
                  disabled={isLoading || isInCooldown}
                >
                  {isLoading ? "Saving..." : isInCooldown ? `Wait ${cooldownTimeLeft}s` : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        <NoteModal
          showModal={showModal}
          editingNote={editingNote}
          draft={draft}
          isLoading={isLoading}
          isInCooldown={isInCooldown}
          cooldownTimeLeft={cooldownTimeLeft}
          hasChanges={hasChanges}
          onClose={closeModal}
          onDraftChange={handleDraftChange}
          onSubmit={addNoteOnChain}
        />

        <ConfirmModal
          show={showConfirmModal}
          isLoading={isLoading}
          onConfirm={handleSaveNote}
          onCancel={() => setShowConfirmModal(false)}
        />

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