import React from 'react';
import '../styles/landingStyles.css'; 
import '../styles/about.css'; 
import Footer from '../components/footer'; 

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>About Note App</h1>
          <p>Your digital companion for organizing thoughts and ideas</p>
          <div className="hero-illustration">
            <div className="note-card">
              <div className="note-lines"></div>
              <div className="note-lines"></div>
              <div className="note-lines"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team">
        <h2>Meet Our Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <img src="/images/member1.jpg" alt="kyle" />
            <h3>Kyle S.</h3>
            <p>Backend Developer</p>
          </div>

          <div className="team-member">
            <img src="/images/member2.jpg" alt="berna" />
            <h3>Bernadeth A.</h3>
            <p>Frontend Developer</p>
          </div>

          <div className="team-member">
            <img src="/images/member3.jpg" alt="juvie" />
            <h3>Juvie C.</h3>
            <p>UI/UX Designer</p>
          </div>

          <div className="team-member">
            <img src="/images/member4.jpg" alt="franchesca" />
            <h3>Franchesca A.</h3>
            <p>Marketing Specialist</p>
          </div>

          <div className="team-member">
            <img src="/images/member5.jpg" alt="estelle" />
            <h3>Estelle C.</h3>
            <p>Product Manager</p>
          </div>

          <div className="team-member">
            <img src="/images/member6.jpg" alt="arcelyn" />
            <h3>Arcelyn T.</h3>
            <p>QA Engineer</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
