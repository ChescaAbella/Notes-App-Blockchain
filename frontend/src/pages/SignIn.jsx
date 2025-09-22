import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function SignIn() {
  const nav = useNavigate();
  const location = useLocation();
  const flashMsg = location.state?.msg;
  const { signin } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const id = form.identifier.trim();
    const pw = form.password.trim();
    if (!id || !pw) return setErr("Please fill in all fields.");
    try {
      await signin(id, pw);
      nav("/home");
    } catch (e) {
      setErr(e?.response?.data?.message || "Sign in failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>

        {flashMsg && (
          <div
            style={{
              background: "#ecfeff",
              border: "1px solid #06b6d4",
              color: "#0e7490",
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {flashMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit}>
          <input
            placeholder="Email"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {err && <p style={{ color: "#b91c1c", margin: "6px 0" }}>{err}</p>}
          <button className="btn primary" type="submit">
            Sign In
          </button>
        </form>
        <div className="auth-footer">
          <span>New here?</span>
          <Link className="text-link" to="/signup">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
