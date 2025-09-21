import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import db from "./db.js";

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], credentials: false }));
app.use(express.json());

const JWT_SECRET = "dev-secret-change-me";
const uid = () => crypto.randomUUID();

const auth = (req, res, next) => {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    try { req.userId = jwt.verify(token, JWT_SECRET).sub; next(); }
    catch { return res.status(401).json({ message: "Unauthorized" }); }
};

app.post("/api/auth/signup", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email.toLowerCase());
    if (exists) return res.status(409).json({ message: "Email already used" });

    const password_hash = bcrypt.hashSync(password, 10);
    const id = uid();
    db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?,?,?)")
        .run(id, email.toLowerCase(), password_hash);

    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id, email: email.toLowerCase() } });
});

app.post("/api/auth/signin", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email?.toLowerCase());
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!bcrypt.compareSync(password, user.password_hash))
        return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email } });
});

app.get("/api/auth/me", auth, (req, res) => {
    const u = db.prepare("SELECT id, email FROM users WHERE id = ?").get(req.userId);
    res.json({ user: u });
});

app.get("/api/notes", auth, (req, res) => {
    const rows = db.prepare(
        "SELECT id, title, content, updated_at FROM notes WHERE user_id = ? ORDER BY datetime(updated_at) DESC"
    ).all(req.userId);
    res.json({ notes: rows });
});

app.post("/api/notes", auth, (req, res) => {
    const { title, content } = req.body;
    const id = uid();
    db.prepare(
        "INSERT INTO notes (id, user_id, title, content, updated_at) VALUES (?,?,?,?,datetime('now'))"
    ).run(id, req.userId, title || "", content || "");
    const note = db.prepare("SELECT id, title, content, updated_at FROM notes WHERE id = ?").get(id);
    res.json({ note });
});

app.put("/api/notes/:id", auth, (req, res) => {
    const { title, content } = req.body;
    db.prepare(
        "UPDATE notes SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(title || "", content || "", req.params.id, req.userId);
    const note = db.prepare("SELECT id, title, content, updated_at FROM notes WHERE id = ?").get(req.params.id);
    res.json({ note });
});

app.delete("/api/notes/:id", auth, (req, res) => {
    db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ ok: true });
});

/* eslint-disable no-undef */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
