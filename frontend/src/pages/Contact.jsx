// frontend/src/pages/Contact.jsx
import { useState } from "react";
import ContactForm from "../components/ContactForm";
import ContactInfoItem from "../components/ContactInfoItem";
import SuccessMessage from "../components/SuccessMessage";
import Footer from "../components/footer";
import "../styles/contact.css";

const Contact = () => {
  const [successMessage, setSuccessMessage] = useState("");

  const handleFormSuccess = (message) => {
    setSuccessMessage(message);
    // Auto-hide success message after 5 seconds
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const contactInfoData = [
    {
      icon: "📧",
      title: "Email",
      description: "support@noteapp.com"
    },
    {
      icon: "⏰",
      title: "Response Time", 
      description: "We typically respond within 24 hours"
    },
    {
      icon: "🔒",
      title: "Privacy",
      description: "Your information is secure and will never be shared"
    }
  ];

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>
            Have questions, suggestions, or need help? We'd love to hear from you!
            Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        {successMessage && (
          <SuccessMessage 
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}

        <div className="contact-content">
          <div className="contact-form-section">
            <ContactForm onSuccess={handleFormSuccess} />
          </div>
          
          <div className="contact-info">
            {contactInfoData.map((item, index) => (
              <ContactInfoItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
