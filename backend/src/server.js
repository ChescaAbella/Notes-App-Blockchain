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
    res.json({
        status: "API is running",
        message: "Use /api/auth/signup, /api/auth/signin, /api/notes, or /api/contact endpoints"
    });
});

// ============================================
// AUTH ENDPOINTS (Keep for backwards compatibility)
// ============================================
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

// ============================================
// NOTES CRUD - WALLET-BASED
// ============================================

// Get notes by wallet address (NEW - FIXES REFRESH ISSUE)
app.get("/api/notes/wallet/:address", (req, res) => {
    const { address } = req.params;

    if (!address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        const rows = db.prepare(
            `SELECT id, wallet_address, title, content, status, is_pinned, is_favorite, 
                    updated_at, deleted_at, deletion_tx_hash, last_edit_tx_hash 
             FROM notes 
             WHERE wallet_address = ? AND deleted_at IS NULL 
             ORDER BY is_pinned DESC, datetime(updated_at) DESC`
        ).all(address);

        res.json({ notes: rows });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: "Failed to fetch notes", error: error.message });
    }
});

// Get trash by wallet address
app.get("/api/notes/wallet/:address/trash", (req, res) => {
    const { address } = req.params;

    if (!address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        const rows = db.prepare(
            `SELECT id, wallet_address, title, content, status, updated_at, 
                    deleted_at, deletion_tx_hash, last_edit_tx_hash 
             FROM notes 
             WHERE wallet_address = ? AND deleted_at IS NOT NULL 
             ORDER BY datetime(deleted_at) DESC`
        ).all(address);

        res.json({ notes: rows });
    } catch (error) {
        console.error('Error fetching trash:', error);
        res.status(500).json({ message: "Failed to fetch trash", error: error.message });
    }
});

// Legacy endpoint (keep for backwards compatibility)
app.get("/api/notes", auth, (req, res) => {
    const rows = db.prepare(
        `SELECT id, wallet_address, title, content, status, is_pinned, is_favorite, 
                updated_at, deleted_at, deletion_tx_hash, last_edit_tx_hash 
         FROM notes 
         WHERE wallet_address = ? AND deleted_at IS NULL 
         ORDER BY is_pinned DESC, datetime(updated_at) DESC`
    ).all(req.userId);
    res.json({ notes: rows });
});

// Legacy trash endpoint
app.get("/api/notes/trash", auth, (req, res) => {
    const rows = db.prepare(
        `SELECT id, wallet_address, title, content, status, updated_at, 
                deleted_at, deletion_tx_hash, last_edit_tx_hash 
         FROM notes 
         WHERE wallet_address = ? AND deleted_at IS NOT NULL 
         ORDER BY datetime(deleted_at) DESC`
    ).all(req.userId);
    res.json({ notes: rows });
});

// Create note (FIXED - uses wallet_address)
app.post("/api/notes", (req, res) => {
    const { wallet_address, title, content, txHash } = req.body || {};

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    const id = uid();
    const status = 'pending'; // Initial status until blockchain confirms

    try {
        db.prepare(
            `INSERT INTO notes (id, wallet_address, title, content, status, last_edit_tx_hash, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
        ).run(id, wallet_address, title || "", content || "", status, txHash || null);

        const note = db.prepare(
            `SELECT id, wallet_address, title, content, status, is_pinned, is_favorite, 
                    updated_at, last_edit_tx_hash 
             FROM notes WHERE id = ?`
        ).get(id);

        res.json({ note });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: "Failed to create note", error: error.message });
    }
});

// Update note (FIXED - verifies wallet ownership)
app.put("/api/notes/:id", (req, res) => {
    const { title, content, txHash, wallet_address } = req.body || {};

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        // Verify note belongs to this wallet
        const note = db.prepare(
            "SELECT * FROM notes WHERE id = ? AND wallet_address = ?"
        ).get(req.params.id, wallet_address);

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        // Update the note
        db.prepare(
            `UPDATE notes 
             SET title = ?, content = ?, updated_at = datetime('now'), 
                 last_edit_tx_hash = ?, status = 'pending'
             WHERE id = ?`
        ).run(title || "", content || "", txHash || null, req.params.id);

        const updatedNote = db.prepare(
            `SELECT id, wallet_address, title, content, status, is_pinned, is_favorite, 
                    updated_at, last_edit_tx_hash, deleted_at, deletion_tx_hash 
             FROM notes WHERE id = ?`
        ).get(req.params.id);

        res.json({ note: updatedNote });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: "Failed to update note", error: error.message });
    }
});

// Permanent delete note
app.delete("/api/notes/:id", (req, res) => {
    const { wallet_address } = req.body || {};

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        // Verify ownership before deleting
        const note = db.prepare(
            "SELECT * FROM notes WHERE id = ? AND wallet_address = ?"
        ).get(req.params.id, wallet_address);

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: "Failed to delete note", error: error.message });
    }
});

// Toggle pin status (FIXED - verifies wallet ownership)
app.patch("/api/notes/:id/pin", (req, res) => {
    const { wallet_address } = req.body || {};

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        const note = db.prepare(
            "SELECT is_pinned FROM notes WHERE id = ? AND wallet_address = ?"
        ).get(req.params.id, wallet_address);

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        const newPinStatus = note.is_pinned ? 0 : 1;
        db.prepare(
            "UPDATE notes SET is_pinned = ? WHERE id = ?"
        ).run(newPinStatus, req.params.id);

        const updatedNote = db.prepare(
            `SELECT id, wallet_address, title, content, status, is_pinned, is_favorite, 
                    updated_at, last_edit_tx_hash 
             FROM notes WHERE id = ?`
        ).get(req.params.id);

        res.json({ note: updatedNote });
    } catch (error) {
        console.error('Error toggling pin:', error);
        res.status(500).json({ message: "Failed to toggle pin", error: error.message });
    }
});

// Toggle favorite status (FIXED - verifies wallet ownership)
app.patch("/api/notes/:id/favorite", (req, res) => {
    const { wallet_address } = req.body || {};

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        const note = db.prepare(
            "SELECT is_favorite FROM notes WHERE id = ? AND wallet_address = ?"
        ).get(req.params.id, wallet_address);

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        const newFavoriteStatus = note.is_favorite ? 0 : 1;
        db.prepare(
            "UPDATE notes SET is_favorite = ? WHERE id = ?"
        ).run(newFavoriteStatus, req.params.id);

        const updatedNote = db.prepare(
            `SELECT id, wallet_address, title, content, status, is_pinned, is_favorite, 
                    updated_at, last_edit_tx_hash 
             FROM notes WHERE id = ?`
        ).get(req.params.id);

        res.json({ note: updatedNote });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ message: "Failed to toggle favorite", error: error.message });
    }
});

// Soft delete note (FIXED - verifies wallet ownership)
app.post("/api/notes/:id/soft-delete", (req, res) => {
    const { txHash, wallet_address } = req.body || {};

    if (!txHash) {
        return res.status(400).json({ message: "Transaction hash required" });
    }

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        // Verify note belongs to this wallet
        const note = db.prepare(
            "SELECT * FROM notes WHERE id = ? AND wallet_address = ?"
        ).get(req.params.id, wallet_address);

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        db.prepare(
            `UPDATE notes 
             SET deleted_at = datetime('now'), deletion_tx_hash = ? 
             WHERE id = ?`
        ).run(txHash, req.params.id);

        const deletedNote = db.prepare(
            `SELECT id, wallet_address, title, content, status, updated_at, 
                    deleted_at, deletion_tx_hash 
             FROM notes WHERE id = ?`
        ).get(req.params.id);

        res.json({ note: deletedNote });
    } catch (err) {
        console.error("Soft delete error:", err);
        res.status(500).json({ message: "Failed to delete note", error: err.message });
    }
});

// Restore deleted note (FIXED - verifies wallet ownership)
app.post("/api/notes/:id/restore", (req, res) => {
    const { wallet_address } = req.body || {};

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    try {
        // Verify note belongs to this wallet
        const note = db.prepare(
            "SELECT * FROM notes WHERE id = ? AND wallet_address = ?"
        ).get(req.params.id, wallet_address);

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        db.prepare(
            `UPDATE notes 
             SET deleted_at = NULL, deletion_tx_hash = NULL 
             WHERE id = ?`
        ).run(req.params.id);

        const restoredNote = db.prepare(
            `SELECT id, wallet_address, title, content, status, updated_at, 
                    deleted_at, deletion_tx_hash 
             FROM notes WHERE id = ?`
        ).get(req.params.id);

        res.json({ note: restoredNote });
    } catch (err) {
        console.error("Restore error:", err);
        res.status(500).json({ message: "Failed to restore note", error: err.message });
    }
});

// Update note status (for blockchain confirmation tracking)
app.patch("/api/notes/:id/status", (req, res) => {
    const { status, wallet_address } = req.body || {};

    if (!wallet_address) {
        return res.status(400).json({ message: "Wallet address required" });
    }

    if (!status || !['pending', 'confirmed', 'failed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        // Verify ownership
        const note = db.prepare(
            "SELECT * FROM notes WHERE id = ? AND wallet_address = ?"
        ).get(req.params.id, wallet_address);

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        db.prepare("UPDATE notes SET status = ? WHERE id = ?").run(status, req.params.id);

        const updatedNote = db.prepare(
            `SELECT id, wallet_address, title, content, status, is_pinned, is_favorite, 
                    updated_at, last_edit_tx_hash 
             FROM notes WHERE id = ?`
        ).get(req.params.id);

        res.json({ note: updatedNote });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: "Failed to update status", error: error.message });
    }
});

// ============================================
// CONTACT ENDPOINTS
// ============================================
app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body || {};

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
        return res.status(400).json({ message: "Name, email, and message are required" });
    }

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

app.get("/api/contact", auth, (req, res) => {
    const messages = db.prepare(`
        SELECT id, name, email, subject, message, status, created_at 
        FROM contact_messages 
        ORDER BY datetime(created_at) DESC
    `).all();

    res.json({ messages });
});

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

app.delete("/api/contact/:id", auth, (req, res) => {
    db.prepare("DELETE FROM contact_messages WHERE id = ?").run(req.params.id);
    res.json({ success: true });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));