import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function SignUp() {
  const nav = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
    };

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      !payload.password
    ) {
      return setErr("Please fill in all fields.");
    }

    if (payload.password.length < 6) {
      return setErr("Password must be at least 6 characters.");
    }

    try {
      await signup(payload);
      nav("/signin", {
        state: { msg: "Account created! Please sign in." },
      });
    } catch (e) {
      setErr(e?.response?.data?.message || "Sign up failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join us and start taking notes</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <input
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
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

          {err && (
            <p style={{ color: "#b91c1c", margin: "6px 0", fontSize: 14 }}>
              {err}
            </p>
          )}

          <button className="btn primary" type="submit">
            Sign Up
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link className="text-link" to="/signin">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
