import { memo } from 'react';
import { Link2, Star, Pin } from 'lucide-react';

const NoteCard = memo(({ 
  note, 
  showTrash, 
  onOpen, 
  onTogglePin, 
  onToggleFavorite, 
  onDelete, 
  onRestore,
  isLoading 
}) => {
  return (
    <div className={`note-item ${note.is_pinned ? 'pinned' : ''}`} style={{cursor: 'pointer'}}>
      {/* Header */}
      <div className="note-item-header">
        <h3 onClick={() => !showTrash && onOpen(note)}>
          {note.title || "Untitled"}
        </h3>
        <div className="note-actions">
          {!showTrash ? (
            <>
              <button
                className={`action-btn ${note.is_pinned ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id);
                }}
                title={note.is_pinned ? "Unpin note" : "Pin note"}
              >
                <Pin size={16} fill={note.is_pinned ? "currentColor" : "none"} />
              </button>
              <button
                className={`action-btn ${note.is_favorite ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(note.id);
                }}
                title={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star size={16} fill={note.is_favorite ? "currentColor" : "none"} />
              </button>
              <button
                className="action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
                title="Delete note"
                disabled={isLoading}
              >
                {isLoading ? "..." : "🗑️"}
              </button>
            </>
          ) : (
            <button
              className="action-btn restore"
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
              title="Restore note"
            >
              ↩️ Restore
            </button>
          )}
          <span className="chain-badge">
            <Link2 size={14} style={{display: 'inline-block', verticalAlign: 'middle'}} />
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="note-item-content" onClick={() => !showTrash && onOpen(note)}>
        {note.content}
      </p>

      {/* Footer */}
      <div className="note-item-footer" onClick={() => !showTrash && onOpen(note)}>
        <span className="note-time">
          {showTrash && note.deleted_at
            ? new Date(note.deleted_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : note.timestamp
            ? new Date(note.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Just now"}
        </span>
        <span className="note-hash" title={note.deletion_tx_hash || note.txHash || ""}>
          {(note.deletion_tx_hash || note.txHash || "").slice(0, 6)}...
        </span>
      </div>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';

export default NoteCard;