import { useEffect, useState } from "react";
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import '../styles/home.css';

export default function HomePage() {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [wallets, setWallets] = useState([]);
  const [walletApi, setWalletApi] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  const [provider] = useState(() =>
    new Blockfrost({
      network: 'cardano-preview',
      projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
    })
  );

  // Detect available wallets
  useEffect(() => {
    if (window.cardano) {
      setWallets(Object.keys(window.cardano));
    }
  }, []);

  // Handle wallet selection
  const handleWalletChange = (e) => setSelectedWallet(e.target.value);

  // Connect wallet and convert hex to Bech32
  const handleConnectWallet = async () => {
    if (!selectedWallet) return alert("Select a wallet first");

    try {
      const api = await window.cardano[selectedWallet].enable();
      setWalletApi(api);

      const hexAddress = await api.getChangeAddress(); // hex-encoded
      const bech32Address = Core.Address.fromBytes(Buffer.from(hexAddress, "hex")).toBech32();
      setWalletAddress(bech32Address);

      alert(`Connected to wallet: ${selectedWallet}`);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert(`Failed to connect to wallet: ${selectedWallet}`);
    }
  };

  // Add note on-chain
  const addNoteOnChain = async (e) => {
    e.preventDefault();
    if (!walletApi) return alert("Connect wallet first");

    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title && !content) return;

    try {
      const wallet = new WebWallet(walletApi);
      const blaze = await Blaze.from(provider, wallet);

      // Metadata as a plain JS object (label -> JSON)
      const metadata = {
        1: { title, content },
      };

      // Build transaction: send 1 ADA to yourself
      const tx = await blaze
        .newTransaction()
        .payLovelace(Core.Address.fromBech32(walletAddress), 1_000_000n)
        .complete({ metadata });

      // Sign transaction
      const signedTx = await blaze.signTransaction(tx);

      // Submit transaction
      const txHash = await blaze.provider.postTransactionToChain(signedTx);
      console.log("Note stored on-chain! TX hash:", txHash);

      // Update UI
      setNotes([{ title, content, txHash }, ...notes]);
      setDraft({ title: "", content: "" });
    } catch (err) {
      console.error("Failed to add note:", err);
      alert("Failed to add note: " + err.message);
    }
  };

  return (
    <div className="notes-wrap">
      <div className="notes-container">
        <h1 className="notes-title">My Notes</h1>

        {/* Add note */}
        <form className="note-form" onSubmit={addNoteOnChain}>
          <input
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <textarea
            placeholder="Write something…"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          />
          <button className="btn home" type="submit">Add Note On-Chain</button>
        </form>

        {/* Wallet connect */}
        <div>
          <select value={selectedWallet} onChange={handleWalletChange}>
            <option value="">Select wallet</option>
            {wallets.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <button onClick={handleConnectWallet}>Connect Wallet</button>
          <p>Connected Wallet: {walletAddress || "Not connected"}</p>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="empty">No notes yet — add your first note above.</div>
        ) : (
          <ul className="notes-grid">
            {notes.map((n, idx) => (
              <li key={idx} className="note-card">
                <h3>{n.title || "Untitled"}</h3>
                <p>{n.content}</p>
                <small>TxHash: {n.txHash}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
