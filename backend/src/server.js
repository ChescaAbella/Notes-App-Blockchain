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

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ status: "API is running", message: "Use /api/auth/signup, /api/auth/signin, /api/notes, or /api/contact endpoints" });
});

// Create account
app.post("/api/auth/signup", (req, res) => {
    const { firstName, lastName, email, password, username } = req.body || {};

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({ message: "Missing fields" });
    }
    const emailNorm = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
        return res.status(400).json({ message: "Invalid email" });
    }
    if ((password || "").length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(emailNorm);
    if (exists) return res.status(409).json({ message: "Email already in use" });

    if (username?.trim()) {
        const unameNorm = username.trim().toLowerCase();
        const uExists = db.prepare("SELECT 1 FROM users WHERE username = ?").get(unameNorm);
        if (uExists) return res.status(409).json({ message: "Username already taken" });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const id = uid();

    db.prepare(`
    INSERT INTO users (id, first_name, last_name, email, username, password_hash)
    VALUES (?,?,?,?,?,?)
  `).run(
        id,
        firstName.trim(),
        lastName.trim(),
        emailNorm,
        username?.trim()?.toLowerCase() || null,
        password_hash
    );

    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
        token,
        user: { id, firstName: firstName.trim(), lastName: lastName.trim(), email: emailNorm, username: username?.trim()?.toLowerCase() || null }
    });
});

// For Sign in 
app.post("/api/auth/signin", (req, res) => {
    const { identifier, email, password } = req.body || {};
    const loginId = (identifier || email || "").trim().toLowerCase();

    if (!loginId || !password) return res.status(400).json({ message: "Missing fields" });

    const user =
        db.prepare("SELECT * FROM users WHERE email = ?").get(loginId) ||
        db.prepare("SELECT * FROM users WHERE username = ?").get(loginId);

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!bcrypt.compareSync(password, user.password_hash))
        return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
        token,
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            username: user.username
        }
    });
});

app.get("/api/auth/me", auth, (req, res) => {
    const u = db.prepare("SELECT id, first_name, last_name, email, username FROM users WHERE id = ?").get(req.userId);
    res.json({ user: u && { id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email, username: u.username } });
});

// NOTES CRUD
app.get("/api/notes", auth, (req, res) => {
    const rows = db.prepare(
        "SELECT id, title, content, updated_at, deleted_at, deletion_tx_hash, last_edit_tx_hash, is_pinned, is_favorite FROM notes WHERE user_id = ? AND deleted_at IS NULL ORDER BY datetime(updated_at) DESC"
    ).all(req.userId);
    res.json({ notes: rows });
});

app.get("/api/notes/trash", auth, (req, res) => {
    const rows = db.prepare(
        "SELECT id, title, content, updated_at, deleted_at, deletion_tx_hash, last_edit_tx_hash FROM notes WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY datetime(deleted_at) DESC"
    ).all(req.userId);
    res.json({ notes: rows });
});

app.post("/api/notes", auth, (req, res) => {
    const { title, content } = req.body || {};
    const id = uid();
    db.prepare(
        "INSERT INTO notes (id, user_id, title, content, updated_at) VALUES (?,?,?,?,datetime('now'))"
    ).run(id, req.userId, title || "", content || "");
    const note = db.prepare("SELECT id, title, content, is_pinned, is_favorite, updated_at, last_edit_tx_hash FROM notes WHERE id = ?").get(id);
    res.json({ note });
});

app.put("/api/notes/:id", auth, (req, res) => {
    const { title, content, txHash } = req.body || {};
    db.prepare(
        "UPDATE notes SET title = ?, content = ?, updated_at = datetime('now'), last_edit_tx_hash = ? WHERE id = ? AND user_id = ?"
    ).run(title || "", content || "", txHash || null, req.params.id, req.userId);
    const note = db.prepare("SELECT id, title, content, updated_at, last_edit_tx_hash, deleted_at, deletion_tx_hash, is_pinned, is_favorite FROM notes WHERE id = ?").get(req.params.id);
    res.json({ note });
});

app.delete("/api/notes/:id", auth, (req, res) => {
    db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ ok: true });
});

// Soft delete note (marks as deleted with blockchain tx hash)
app.post("/api/notes/:id/soft-delete", auth, (req, res) => {
    const { txHash } = req.body || {};
    
    if (!txHash) {
        return res.status(400).json({ message: "Transaction hash required" });
    }

    db.prepare(
        "UPDATE notes SET deleted_at = datetime('now'), deletion_tx_hash = ? WHERE id = ? AND user_id = ?"
    ).run(txHash, req.params.id, req.userId);

    const note = db.prepare(
        "SELECT id, title, content, updated_at, deleted_at, deletion_tx_hash FROM notes WHERE id = ?"
    ).get(req.params.id);

    res.json({ note });
});

// Restore deleted note
app.post("/api/notes/:id/restore", auth, (req, res) => {
    db.prepare(
        "UPDATE notes SET deleted_at = NULL, deletion_tx_hash = NULL WHERE id = ? AND user_id = ?"
    ).run(req.params.id, req.userId);

    const note = db.prepare(
        "SELECT id, title, content, updated_at, deleted_at, deletion_tx_hash FROM notes WHERE id = ?"
    ).get(req.params.id);

    res.json({ note });
});

// CONTACT CRUD
// Submit contact form (no auth required - public endpoint)
app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body || {};

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
        return res.status(400).json({ message: "Name, email, and message are required" });
    }

    // Validate email format
    const emailNorm = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    const id = uid();
    
    db.prepare(`
        INSERT INTO contact_messages (id, name, email, subject, message)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        id,
        name.trim(),
        emailNorm,
        subject?.trim() || null,
        message.trim()
    );

    res.json({ 
        success: true, 
        message: "Thank you for your message! We'll get back to you soon." 
    });
});

// Get all contact messages (admin only - requires auth)
app.get("/api/contact", auth, (req, res) => {
    const messages = db.prepare(`
        SELECT id, name, email, subject, message, status, created_at 
        FROM contact_messages 
        ORDER BY datetime(created_at) DESC
    `).all();
    
    res.json({ messages });
});

// Update message status (admin only - requires auth)
app.put("/api/contact/:id", auth, (req, res) => {
    const { status } = req.body || {};
    
    if (!status || !['unread', 'read', 'replied'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be: unread, read, or replied" });
    }

    db.prepare(`
        UPDATE contact_messages 
        SET status = ? 
        WHERE id = ?
    `).run(status, req.params.id);

    const message = db.prepare(`
        SELECT id, name, email, subject, message, status, created_at 
        FROM contact_messages 
        WHERE id = ?
    `).get(req.params.id);

    res.json({ message });
});

// Delete contact message (admin only - requires auth)
app.delete("/api/contact/:id", auth, (req, res) => {
    db.prepare("DELETE FROM contact_messages WHERE id = ?").run(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
