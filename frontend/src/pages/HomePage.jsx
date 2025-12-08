import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Lock,
  FileText,
  Shield,
  Search,
  Telescope,
  Plus,
  Link2,
  Star,
  Pin,
  Trash2,
} from "lucide-react";
import "../styles/home.css";

// Hooks
import { useWallet } from "../hooks/useWallet";
import { useNotes } from "../hooks/useNotes";
import { useTransactionCooldown } from "../hooks/useTransactionCooldown";
import { useToast } from "../hooks/useToast";
import { useBlockchainTransaction } from "../hooks/useBlockchainTransaction";
import { useBlockchain } from "../hooks/useBlockchain";

// Components
import NoteModal from "../components/NoteModal";
import ConfirmModal from "../components/ConfirmModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import RestoreConfirmModal from "../components/RestoreConfirmModal";
import NoteCard from "../components/NoteCard";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";
import Footer from "../components/footer";

// Services
import { startTransactionMonitoring } from "../services/transactionConfirmation";

export default function HomePage() {
  // State
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [noteToRestore, setNoteToRestore] = useState(null);

  // Hooks
  const { walletAddress, createWebWallet, isConnected } = useWallet();
  const { notes, saveNoteToDatabase, addNote, updateNote, updateNoteMetadata } = useNotes();
  const { isInCooldown, cooldownTimeLeft, startCooldown, checkCooldown } = useTransactionCooldown();
  const { toast, showToast } = useToast();
  const { provider } = useBlockchain();
  const { isLoading: blockchainLoading, saveNoteToBlockchain } = useBlockchainTransaction();

  // Monitor pending transactions and update their status
  useEffect(() => {
    if (!isConnected || !walletAddress || notes.length === 0) return;

    const handleStatusUpdate = async (noteId, newStatus) => {
      console.log(`Updating note ${noteId} status to ${newStatus}`);

      try {
        // Update status in database
        const response = await fetch(`http://localhost:4000/api/notes/${noteId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            wallet_address: walletAddress
          })
        });

        if (response.ok) {
          // Update local state
          const note = notes.find(n => n.id === noteId);
          if (note) {
            updateNote(noteId, { ...note, status: newStatus });
          }

          // Show toast notification
          showToast(`Note confirmed on blockchain! ✓`, "success");
        }
      } catch (error) {
        console.error('Failed to update note status:', error);
      }
    };

    // Start monitoring and get cleanup function
    const cleanup = startTransactionMonitoring(notes, handleStatusUpdate);

    // Cleanup on unmount
    return cleanup;
  }, [notes, isConnected, walletAddress, updateNote, showToast]);

  // Modal Handlers
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

  // Note Actions
  const togglePin = useCallback(async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      try {
        const response = await fetch(`http://localhost:4000/api/notes/${noteId}/pin`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_address: walletAddress
          })
        });

        if (response.ok) {
          updateNote(noteId, { ...note, is_pinned: !note.is_pinned });
        }
      } catch (error) {
        console.error('Failed to toggle pin:', error);
      }
    }
  }, [notes, walletAddress, updateNote]);

  const toggleFavorite = useCallback(async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      try {
        const response = await fetch(`http://localhost:4000/api/notes/${noteId}/favorite`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_address: walletAddress
          })
        });

        if (response.ok) {
          updateNote(noteId, { ...note, is_favorite: !note.is_favorite });
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    }
  }, [notes, walletAddress, updateNote]);

  // Save/Update Note
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
        action: editingNote ? "update" : "create",
        noteId: editingNote?.id,
        onSuccess: async (note) => {
          const noteId = await saveNoteToDatabase(note, editingNote);
          if (noteId) note.id = noteId;

          if (editingNote) {
            note.is_pinned = editingNote.is_pinned;
            note.is_favorite = editingNote.is_favorite;
            updateNote(editingNote.id, note);
            showToast("Note updated successfully!", "success");
          } else {
            addNote(note);
            showToast("Note added successfully!", "success");
          }

          setDraft({ title: "", content: "" });
          closeModal();
          startCooldown();
        },
        onError: (err) => showToast("Failed to save note: " + err.message, "error")
      });
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  }, [
    checkCooldown, showToast, saveNoteToBlockchain, provider, createWebWallet,
    walletAddress, draft, editingNote, saveNoteToDatabase, updateNote, addNote,
    closeModal, startCooldown
  ]);

  const addNoteOnChain = useCallback((e) => {
    e.preventDefault();
    if (editingNote && hasChanges) {
      setShowConfirmModal(true);
      return;
    }
    handleSaveNote();
  }, [editingNote, hasChanges, handleSaveNote]);

  // Delete Note
  const handleDeleteNote = useCallback((note) => {
    setNoteToDelete(note);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!noteToDelete) return;

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
        title: noteToDelete.title,
        content: noteToDelete.content,
        action: "delete",
        noteId: noteToDelete.id,
        onSuccess: async (result) => {
          await fetch(`http://localhost:4000/api/notes/${noteToDelete.id}/soft-delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              txHash: result.txHash,
              wallet_address: walletAddress
            })
          });

          const updatedNote = {
            ...noteToDelete,
            deleted_at: new Date().toISOString(),
            deletion_tx_hash: result.txHash
          };
          updateNote(noteToDelete.id, updatedNote);

          showToast("Note deleted successfully!", "success");
          setNoteToDelete(null);
          startCooldown();
        },
        onError: (err) => showToast("Failed to delete note: " + err.message, "error")
      });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, [
    noteToDelete, checkCooldown, showToast, saveNoteToBlockchain,
    provider, createWebWallet, walletAddress, updateNote, startCooldown
  ]);

  // Restore Note
  const handleRestoreNote = useCallback(async (note) => {
    try {
      await fetch(`http://localhost:4000/api/notes/${note.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress
        })
      });

      const restoredNote = { ...note, deleted_at: null, deletion_tx_hash: null };
      updateNote(note.id, restoredNote);
      showToast("Note restored!", "success");
      setNoteToRestore(null);
    } catch (err) {
      console.error("Restore failed:", err);
      showToast("Failed to restore note: " + (err.response?.data?.message || err.message), "error");
    }
  }, [walletAddress, updateNote, showToast]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    let filtered = showTrash
      ? notes.filter(note => note.deleted_at)
      : notes.filter(note => !note.deleted_at);

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

  // Not Connected State
  if (!isConnected) {
    return (
      <>
        <div className="notes-wrap">
          <div className="notes-container">
            <div className="hero-section">
              <div className="hero-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <Lock size={80} strokeWidth={1.5} style={{ margin: '0 auto 30px', opacity: 0.6 }} />
                <h1 className="page-title">Connect Your Wallet</h1>
                <p className="page-subtitle">
                  Please connect your wallet from the header to start using the blockchain notes app.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Main Render
  return (
    <>
      <div className="notes-wrap">
        <div className="notes-container">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="page-title">Your Blockchain Notes</h1>
              <p className="page-subtitle">Immutable. Decentralized. Forever yours.</p>
            </div>
            <div className="wallet-connected-card">
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
          </div>

          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-icon"><FileText size={40} strokeWidth={1.5} /></div>
              <div className="stat-content">
                <div className="stat-value">{notes.filter(n => !n.deleted_at).length}</div>
                <div className="stat-label">Total Notes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Link2 size={40} strokeWidth={1.5} /></div>
              <div className="stat-content">
                <div className="stat-value">{notes.filter(n => !n.deleted_at).length}</div>
                <div className="stat-label">On-Chain</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Shield size={40} strokeWidth={1.5} /></div>
              <div className="stat-content">
                <div className="stat-value">100%</div>
                <div className="stat-label">Secure</div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="notes-main">
            {/* Header with Search */}
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

            {/* Filter Bar */}
            <div className="filter-bar">
              {!showTrash && (
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
              )}
              <button
                className={`filter-btn ${showTrash ? "active" : ""}`}
                onClick={() => setShowTrash(!showTrash)}
                style={{
                  marginLeft: 'auto',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={16} />
                Trash
              </button>
            </div>

            {/* Notes Grid or Empty State */}
            {filteredNotes.length === 0 ? (
              <EmptyState
                showTrash={showTrash}
                isInCooldown={isInCooldown}
                cooldownTimeLeft={cooldownTimeLeft}
                onCreateNote={() => setShowModal(true)}
              />
            ) : (
              <div className="notes-masonry">
                {filteredNotes.map((note, idx) => (
                  <NoteCard
                    key={note.id || idx}
                    note={note}
                    showTrash={showTrash}
                    onOpen={openNote}
                    onTogglePin={togglePin}
                    onToggleFavorite={toggleFavorite}
                    onDelete={handleDeleteNote}
                    onRestore={() => setNoteToRestore(note)}
                    isLoading={blockchainLoading}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Modals */}
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

          <DeleteConfirmModal
            show={!!noteToDelete}
            note={noteToDelete}
            isLoading={blockchainLoading}
            isInCooldown={isInCooldown}
            cooldownTimeLeft={cooldownTimeLeft}
            onConfirm={confirmDelete}
            onCancel={() => setNoteToDelete(null)}
          />

          <RestoreConfirmModal
            show={!!noteToRestore}
            note={noteToRestore}
            onConfirm={() => handleRestoreNote(noteToRestore)}
            onCancel={() => setNoteToRestore(null)}
          />

          {/* Toast */}
          <Toast toast={toast} />
        </div>
      </div>
      <Footer />
    </>
  );
}