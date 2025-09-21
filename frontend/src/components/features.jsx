import React, { useEffect } from "react";

const features = [
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "Your notes are encrypted and protected with secure login. Only you have access to your thoughts and ideas.",
  },
  {
    icon: "📁",
    title: "Smart Organization",
    desc: "Organize your notes with categories, tags, and folders. Find what you need instantly with powerful search.",
  },
  {
    icon: "☁️",
    title: "Cloud Sync",
    desc: "Access your notes from any device. Changes sync automatically so your thoughts are always up to date.",
  },
  {
    icon: "⚡",
    title: "Fast & Simple",
    desc: "Clean, distraction-free interface that loads instantly. Focus on your ideas, not the app.",
  },
];

const Features = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".feature-card").forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(card);
    });
  }, []);

  return (
    <section className="features" id="features">
      <div className="container">
        <h2>Everything you need to stay organized</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
