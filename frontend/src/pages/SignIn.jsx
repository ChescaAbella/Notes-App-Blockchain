import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function SignIn() {
  const nav = useNavigate();
  const { signin } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!form.email || !form.password)
      return setErr("Please fill in all fields.");
    try {
      await signin(form.email, form.password);
      nav("/notes");
    } catch (e) {
      setErr(e?.response?.data?.message || "Sign in failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <form className="auth-form" onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
