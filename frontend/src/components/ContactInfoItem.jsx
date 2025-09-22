import PaperCard from "./PaperCard";

export default function ContactInfoItem({ icon, title, description, className = "" }) {
  return (
    <PaperCard className={`contact-info-item ${className}`} showLines={false} rotation={0}>
      <h3>{icon} {title}</h3>
      <p>{description}</p>
    </PaperCard>
  );
}