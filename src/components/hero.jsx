import React from "react";

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
          <a href="#" className="hero-cta">
            Get Started Free <span>→</span>
          </a>
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
