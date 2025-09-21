import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/header.css";

const Header = () => {
  const nav = useNavigate();
  const { isAuthed, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector("header");
      if (window.scrollY > 100) {
        header.style.background = "rgba(255, 255, 255, 0.98)";
        header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.1)";
      } else {
        header.style.background = "rgba(255, 255, 255, 0.95)";
        header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.05)";
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="site-header">
      <nav className="container">
        <Link to="/" className="logo" aria-label="Go to homepage">
          NoteApp
        </Link>

        <ul className="nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#demo">Demo</a>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
        </ul>

        {!isAuthed ? (
          <div className="nav-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => nav("/signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => nav("/signup")}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="nav-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => nav("/home")}
            >
              Home
            </button>
            <button type="button" className="btn danger" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
