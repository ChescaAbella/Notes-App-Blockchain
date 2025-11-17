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

  const filteredNotes = notes.filter((note) => {
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
