import React from "react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1>Capture your thoughts anytime, anywhere</h1>
          <p>
            The simplest way to organize your ideas, tasks, and inspirations.
            Fast, secure, and beautifully designed for modern productivity.
          </p>

          <Link to="/signup" className="hero-cta">
            Get Started Free <span>→</span>
          </Link>

          <div className="hero-illustration">
            <div className="note-card">
              <div className="note-lines"></div>
              <div className="note-lines"></div>
              <div className="note-lines"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
