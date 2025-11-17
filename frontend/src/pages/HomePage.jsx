import { useEffect, useState } from "react";
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import { Buffer } from "buffer";
import "../styles/home.css";

export default function HomePage() {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [wallets, setWallets] = useState([]);
  const [walletApi, setWalletApi] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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
      const api = await window.cardano[selectedWallet].enable();
      setWalletApi(api);

      const hexAddress = await api.getChangeAddress();
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
                disabled={isLoading}
              >
                <span className="btn-icon">+</span>
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
                  <div className="empty-icon">📭</div>
                </div>
                <h3>No notes yet</h3>
                <p>Start creating blockchain-secured notes</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-create-empty"
                >
                  Create Your First Note
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
                ))}
              </div>
            )}
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Adding..." : "Add to Blockchain"}
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
