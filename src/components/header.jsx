import React, { useEffect } from "react";

import "../styles/header.css";

const Header = () => {
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
    <header>
      <nav className="container">
        <a href="#" className="logo">
          NoteApp
        </a>
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
        <a href="#" className="nav-cta">
          Sign Up
        </a>
      </nav>
    </header>
  );
};

export default Header;
