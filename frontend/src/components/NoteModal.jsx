import { memo } from 'react';

const NoteModal = memo(({
  showModal,
  editingNote,
  draft,
  isLoading,
  isInCooldown,
  cooldownTimeLeft,
  hasChanges,
  onClose,
  onDraftChange,
  onSubmit,
}) => {
  if (!showModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingNote ? "Edit Note" : "Create New Note"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-form">
          <input
            type="text"
            placeholder="Note title"
            value={draft.title}
            onChange={(e) => onDraftChange('title', e.target.value)}
            className="modal-input"
            autoFocus
          />
          <textarea
            placeholder="Write your note..."
            value={draft.content}
            onChange={(e) => onDraftChange('content', e.target.value)}
            className="modal-textarea"
            rows="10"
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-submit"
              disabled={isLoading || isInCooldown || (editingNote && !hasChanges)}
            >
              {isLoading
                ? editingNote ? "Saving..." : "Adding..."
                : isInCooldown
                ? `Wait ${cooldownTimeLeft}s`
                : editingNote ? "Save Changes" : "Add to Blockchain"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

NoteModal.displayName = 'NoteModal';

export default NoteModal;