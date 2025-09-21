import { useEffect, useState } from "react";
import api from "../lib/api";

export default function HomePage() {
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
