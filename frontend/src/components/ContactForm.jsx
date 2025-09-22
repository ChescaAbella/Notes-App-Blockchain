import { useState } from "react";
import api from "../lib/api";
import FormInput from "./FormInput";
import PaperCard from "./PaperCard";

export default function ContactForm({ onSuccess, className = "" }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim()
      });

      // Reset form
      setForm({ name: "", email: "", subject: "", message: "" });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data.message);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperCard className={`contact-form ${className}`} showLines={false} rotation={0}>
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your full name"
          disabled={loading}
          required
        />

        <FormInput
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          disabled={loading}
          required
        />

        <FormInput
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          placeholder="What's this about?"
          disabled={loading}
        />

        <FormInput
          label="Message"
          type="textarea"
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Tell us how we can help..."
          rows={5}
          disabled={loading}
          required
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn primary"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </PaperCard>
  );
}