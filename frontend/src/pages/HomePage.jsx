import { useEffect, useState } from "react";
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import { Buffer } from "buffer";
import api from "../lib/api";
import "../styles/home.css";

export default function HomePage() {
  const [notes, setNotes] = useState([]);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [wallets, setWallets] = useState([]);
  const [walletApi, setWalletApi] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [noteToDelete, setNoteToDelete] = useState(null);

  const [lastTxTime, setLastTxTime] = useState(null);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const COOLDOWN_MS = 90_000; // 90 seconds

  const isInCooldown = lastTxTime && Date.now() - lastTxTime < COOLDOWN_MS;

  const [provider] = useState(
    () =>
      new Blockfrost({
        network: "cardano-preview",
        projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
      })
  );

  // Cooldown countdown effect
  useEffect(() => {
    if (!lastTxTime) return;

    const interval = setInterval(() => {
      const remaining = COOLDOWN_MS - (Date.now() - lastTxTime);

      if (remaining <= 0) {
        setCooldownTimeLeft(0);
        clearInterval(interval);
      } else {
        setCooldownTimeLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastTxTime]);

  useEffect(() => {
    if (window.cardano) {
      setWallets(Object.keys(window.cardano));
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleWalletChange = (e) => setSelectedWallet(e.target.value);

  const handleConnectWallet = async () => {
    if (!selectedWallet) {
      showToast("Please select a wallet first", "error");
      return;
    }

    try {
      setIsLoading(true);
      const walletApi = await window.cardano[selectedWallet].enable();
      setWalletApi(walletApi);

      const hexAddress = await walletApi.getChangeAddress();
      const bech32Address = Core.Address.fromBytes(
        Buffer.from(hexAddress, "hex")
      ).toBech32();
      setWalletAddress(bech32Address);

      showToast(`Successfully connected to ${selectedWallet}`, "success");
    } catch (err) {
      console.error("Wallet connection failed:", err);
      showToast(`Failed to connect to ${selectedWallet}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const addNoteOnChain = async (e) => {
    e.preventDefault();

    const now = Date.now();
    if (lastTxTime && now - lastTxTime < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastTxTime)) / 1000);
      showToast(`Please wait ${remaining}s before adding another note`, "error");
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

      const wallet = new WebWallet(walletApi);
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

      setNotes([
        { title, content, txHash, timestamp: new Date().toISOString() },
        ...notes,
      ]);

      setDraft({ title: "", content: "" });
      setShowModal(false);
      showToast("Note added to blockchain successfully!", "success");

      setLastTxTime(Date.now());
    } catch (err) {
      console.error("Failed to add note:", err);
      showToast("Failed to add note: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

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

          {!walletApi ? (
            <div className="wallet-connect-card">
              <div className="wallet-icon">🔐</div>
              <h3>Connect Your Wallet</h3>
              <p>Unlock blockchain-powered note-taking</p>
              <div className="wallet-actions">
                <select
                  value={selectedWallet || ""}
                  onChange={handleWalletChange}
                  className="wallet-select"
                  disabled={isLoading}
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
                  disabled={isLoading || !selectedWallet}
                >
                  {isLoading ? "Connecting..." : "Connect"}
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

        {walletApi && (
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

        {walletApi && (
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
                <span className="search-icon">🔍</span>
              </div>
            </div>

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
                <button
                  className="modal-close"
                  onClick={() => setNoteToDelete(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>You're about to soft delete this note:</p>
                <div className="note-preview">
                  <h4>{noteToDelete.title || "Untitled"}</h4>
                  <p>{noteToDelete.content}</p>
                </div>
                <p className="warning-text">
                  ⛓️ A deletion record will be created on the blockchain to maintain an immutable audit trail.
                </p>
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
                  {isLoading ? "Deleting..." : isInCooldown ? `Wait ${cooldownTimeLeft}s` : "Soft Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Note</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={addNoteOnChain} className="modal-form">
                <input
                  type="text"
                  placeholder="Note title"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className="modal-input"
                  autoFocus
                />
                <textarea
                  placeholder="Write your note..."
                  value={draft.content}
                  onChange={(e) =>
                    setDraft({ ...draft, content: e.target.value })
                  }
                  className="modal-textarea"
                  rows="10"
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isLoading || isInCooldown}
                  >
                    {isLoading
                      ? "Adding..."
                      : isInCooldown
                      ? `Wait ${cooldownTimeLeft}s `
                      : "Add to Blockchain"}
                  </button>
                </div>
              </form>
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
