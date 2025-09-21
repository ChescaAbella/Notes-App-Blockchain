import { useEffect, useState } from "react";
import api from "../lib/api";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState(null);

  async function load() {
    const { data } = await api.get("/notes");
    setNotes(data.notes);
  }
  useEffect(() => {
    load();
  }, []);

  async function addNote(e) {
    e.preventDefault();
    const { data } = await api.post("/notes", draft);
    setNotes([data.note, ...notes]);
    setDraft({ title: "", content: "" });
  }
  async function updateNote(id) {
    const note = notes.find((n) => n.id === id);
    const { data } = await api.put(`/notes/${id}`, {
      title: note.title,
      content: note.content,
    });
    setNotes(notes.map((n) => (n.id === id ? data.note : n)));
    setEditing(null);
  }
  async function removeNote(id) {
    await api.delete(`/notes/${id}`);
    setNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="container" style={{ paddingTop: 80 }}>
      <h1>My Notes</h1>
      <form onSubmit={addNote} className="note-form">
        <input
          placeholder="Title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <textarea
          placeholder="Write something…"
          rows={6}
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        />
        <button className="btn primary">Add</button>
      </form>

      <ul className="notes-list">
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
                  rows={4}
                  value={n.content}
                  onChange={(e) =>
                    setNotes(
                      notes.map((x) =>
                        x.id === n.id ? { ...x, content: e.target.value } : x
                      )
                    )
                  }
                />
                <div className="row">
                  <button className="btn" onClick={() => updateNote(n.id)}>
                    Save
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{n.title || "Untitled"}</h3>
                <p>{n.content}</p>
                <div className="row">
                  <button className="btn" onClick={() => setEditing(n.id)}>
                    Edit
                  </button>
                  <button
                    className="btn danger"
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
    </div>
  );
}
