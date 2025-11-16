import { use, useEffect, useState } from "react";
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import api from "../lib/api";

export default function HomePage() {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState(null);

  const [wallets, setWallets] = useState([]);
  const [walletApi, setWalletApi] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [recipeient, setRecipeient] = useState(0n);
  const [amount, setAmount] = useState(0n);

  const[provider] = useState(() => new Blockfrost({
    network: 'cardano-preview',
    projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
  }));


  useEffect(() => {
    if(window.cardano){
      setWallets(Object.keys(window.cardano));
    }
  }, []);

  async function load() {
    const { data } = await api.get("/notes");
    setNotes(data.notes);
  }
  useEffect(() => {
    load();
  }, []);

  async function addNote(e) {
    e.preventDefault();
    const t = draft.title.trim();
    const c = draft.content.trim();
    if (!t && !c) return;
    const { data } = await api.post("/notes", { title: t, content: c });
    setNotes([data.note, ...notes]);
    setDraft({ title: "", content: "" });
  }

  async function updateNote(id) {
    const note = notes.find((n) => n.id === id);
    const { data } = await api.put(`/notes/${id}`, {
      title: (note.title || "").trim(),
      content: (note.content || "").trim(),
    });
    setNotes(notes.map((n) => (n.id === id ? data.note : n)));
    setEditing(null);
  }

  async function removeNote(id) {
    await api.delete(`/notes/${id}`);
    setNotes(notes.filter((n) => n.id !== id));
  }

  const handleWalletChange = async (e) => {
    const walletName = e.target.value;
    setSelectedWallet(walletName);
  }
  const handleConnectWallet = async () => {
    console.log("Connecting to wallet:", window.cardano[selectedWallet]);
    if(selectedWallet && window.cardano[selectedWallet]){
      try{
        const api = await window.cardano[selectedWallet].enable();
        setWalletApi(api);
        console.log("Connected to wallet:", selectedWallet, api);
        alert(`Connected to wallet: ${selectedWallet}`);

        const address = await api.getChangeAddress();
        console.log("Wallet address:", address);
        setWalletAddress(address);
      }catch(err){
        console.error("Wallet connection failed:", err);
        alert(`Failed to connect to wallet: ${selectedWallet}`);
      }
    }
  }
    const handleRecipeientChange = (e) => {
      setRecipeient(e.target.value);
    }
    const handleAmountChange = (e) => {
      setAmount(BigInt(e.target.value));
    }
    const handleSubmitTransaction = async () => {
    if (!walletApi) return alert("Connect wallet first");

    try {
      const wallet = new WebWallet(walletApi);
      const blaze = await Blaze.from(provider, wallet);

      console.log("Blaze ready:", blaze);
      const bech32Address = Core.Address.fromBytes(Buffer.from(walletAddress, 'hex')).toBech32();
      console.log("Converted Address:", bech32Address);
      
      const tx = await blaze
      .newTransaction()
      .payLovelace(
        Core.Address.fromBech32(recipeient),
        amount
      )
      .complete();
      //BUILDING TRANSACTION
      console.log("Transaction built:", tx.toCbor());
      const signedTx = await blaze.signTransaction(tx);
      //SIGNING TRANSACTION
      console.log("Transaction signed:", signedTx.toCbor());
      //SUBMITTING TRANSACTION
      const txHash = await blaze.provider.postTransactionToChain(signedTx);
      console.log("Transaction submitted. Hash:", txHash);
      
    } catch (err) {
      console.error("Transaction failed:", err);
      alert("Transaction failed: " + err.message);
    }
  };
  

  return (
    <div className="notes-wrap">
      <div className="notes-container">
        <h1 className="notes-title">My Notes</h1>

        {/* add note */}
        <form className="note-form" onSubmit={addNote}>
          <input
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <div className="row">
            <textarea
              placeholder="Write something…"
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
            <button className="btn primary" type="submit">
              Add
            </button>
          </div>
        </form>
        {/* aaring connect wallet */}
         <div>
          <select value={selectedWallet} onChange={handleWalletChange}>
            <option value="">Select wallet</option>
            {wallets.length> 0 && wallets.map((wallet) => (
              <option key={wallet} value={wallet}>{wallet}</option>
            ))}
          </select>
        </div>
        <div>
          {walletApi ? "Wallet connected" : "No wallet connected"}

          {!walletApi && (
            <button onClick={handleConnectWallet}>Connect Wallet</button>
          )}
        </div>


        <div>
          <p>Connected Wallet Address: {walletAddress || "Not connected"}</p>
          <br />
          <label>Receipient Addresses: </label>
          <input type ="text" placeholder="Enter Receipient Address"value={recipeient} onChange={handleRecipeientChange}/>
          <br />
          <label>Amount to Send: </label>
          <input type ="number" placeholder="Enter Amount" value={amount} onChange={handleAmountChange}/>
          <br />
          <button onClick={handleSubmitTransaction}>Send ADA</button>
        </div>
        {/* list */}
        {notes.length === 0 ? (
          <div className="empty">No notes yet — add your first note above.</div>
        ) : (
          <ul className="notes-grid">
            {notes.map((n) => (
              <li key={n.id} className="note-card">
                {editing === n.id ? (
                  <>
                    <input
                      value={n.title}
                      onChange={(e) =>
                        setNotes(
                          notes.map((x) =>
                            x.id === n.id ? { ...x, title: e.target.value } : x
                          )
                        )
                      }
                    />
                    <textarea
                      rows={6}
                      value={n.content}
                      onChange={(e) =>
                        setNotes(
                          notes.map((x) =>
                            x.id === n.id
                              ? { ...x, content: e.target.value }
                              : x
                          )
                        )
                      }
                    />
                    <div className="actions">
                      <button
                        className="btn primary"
                        type="button"
                        onClick={() => updateNote(n.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>{n.title || "Untitled"}</h3>
                    {n.content && <p>{n.content}</p>}
                    <div className="actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => setEditing(n.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => removeNote(n.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
