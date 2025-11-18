import { useState, useCallback, useMemo, memo } from "react";
import { Lock, FileText, Shield, Search, Telescope, Plus, Copy, Check, CheckCircle, XCircle, Link2, ChevronDown } from "lucide-react";
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
                ? `Wait ${cooldownTimeLeft}s `
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

// Memoized Note Card Component
const NoteCard = memo(({ note, onClick }) => (
  <div className="note-item" onClick={onClick} style={{cursor: 'pointer'}}>
    <div className="note-item-header">
      <h3>{note.title || "Untitled"}</h3>
      <span className="chain-badge">
        <Link2 size={14} style={{display: 'inline-block', verticalAlign: 'middle'}} />
      </span>
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
));

NoteCard.displayName = 'NoteCard';

export default function HomePage() {
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [filter, setFilter] = useState("all"); // all, favorites, pinned

  const [provider] = useState(
    () =>
      new Blockfrost({
        network: "cardano-preview",
        projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
      })
  );

  const [editingNote, setEditingNote] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
      await connectWallet();
      showToast(`Successfully connected to ${selectedWallet}`, "success");
    } catch (err) {
      showToast(err.message || `Failed to connect to ${selectedWallet}`, "error");
    }
  }, [connectWallet, selectedWallet, showToast]);

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

    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title && !content) return;

    try {
      setIsLoading(true);
      const wallet = new WebWallet(walletApi);
      const blaze = await Blaze.from(provider, wallet);

      const metadata = {
        1: { title, content, timestamp: new Date().toISOString(), is_pinned: false, is_favorite: false },
      };

      const tx = await blaze
        .newTransaction()
        .payLovelace(Core.Address.fromBech32(walletAddress), 1_000_000n)
        .complete({ metadata });

      const signedTx = await blaze.signTransaction(tx);
      const txHash = await blaze.provider.postTransactionToChain(signedTx);

      setNotes([
        { title, content, txHash, timestamp: new Date().toISOString(), is_pinned: false, is_favorite: false },
        ...notes,
      ]);
      setDraft({ title: "", content: "" });
      setShowModal(false);
      showToast("Note added to blockchain successfully!", "success");
    } catch (err) {
      console.error("Failed to add note:", err);
      showToast("Failed to add note: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePin = (txHash) => {
    setNotes(notes.map(note =>
      note.txHash === txHash
        ? { ...note, is_pinned: !note.is_pinned }
        : note
    ));
  };

  const toggleFavorite = (txHash) => {
    setNotes(notes.map(note =>
      note.txHash === txHash
        ? { ...note, is_favorite: !note.is_favorite }
        : note
    ));
  };

  const filteredNotes = notes
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

  // Memoized filtered notes
  const filteredNotes = useMemo(() => 
    filterNotes(notes, searchQuery), 
    [notes, searchQuery]
  );


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
                    <button
                      onClick={() => setShowModal(true)}
                      className="btn-create"
                      disabled={isLoading || isInCooldown}
                    >
                      {isInCooldown ? (
                        `Wait ${cooldownTimeLeft}s `
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
              <h2>My Notes</h2>
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
                ⭐ Favorites
              </button>
              <button
                className={`filter-btn ${filter === "pinned" ? "active" : ""}`}
                onClick={() => setFilter("pinned")}
              >
                📌 Pinned
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
                  <div key={idx} className={`note-item ${note.is_pinned ? 'pinned' : ''}`}>
                    <div className="note-item-header">
                      <h3>{note.title || "Untitled"}</h3>
                      <div className="note-actions">
                        <button
                          className={`action-btn ${note.is_pinned ? 'active' : ''}`}
                          onClick={() => togglePin(note.txHash)}
                          title={note.is_pinned ? "Unpin note" : "Pin note"}
                        >
                          📌
                        </button>
                        <button
                          className={`action-btn ${note.is_favorite ? 'active' : ''}`}
                          onClick={() => toggleFavorite(note.txHash)}
                          title={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          {note.is_favorite ? '⭐' : '☆'}
                        </button>
                        <span className="chain-badge">⛓️</span>
                      </div>
                    </div>
                    <p className="note-item-content">{note.content}</p>
                    <div className="note-item-footer">
                      <span className="note-time">
                        {note.timestamp
                          ? new Date(note.timestamp).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Just now"}
                      </span>
                      <span className="note-hash" title={note.txHash}>
                        {note.txHash.slice(0, 6)}...
                      </span>
                    </div>
                  </div>
                  <NoteCard 
                    key={note.id || idx} 
                    note={note} 
                    onClick={() => openNote(note)} 
                  />
                ))}
              </div>
            )}
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