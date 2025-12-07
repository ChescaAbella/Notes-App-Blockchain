import { memo } from 'react';
import { Telescope } from 'lucide-react';

const EmptyState = memo(({ 
  showTrash, 
  isInCooldown, 
  cooldownTimeLeft, 
  onCreateNote 
}) => {
  return (
    <div className="empty-state-modern">
      <div className="empty-illustration">
        <div className="empty-circle"></div>
        <div className="empty-icon">
          <Telescope size={56} strokeWidth={1.5} />
        </div>
      </div>
      <h3>{showTrash ? "Trash is empty" : "No notes yet"}</h3>
      <p>{showTrash ? "Deleted notes will appear here" : "Start creating blockchain-secured notes"}</p>
      {!showTrash && (
        <button
          onClick={onCreateNote}
          className="btn-create-empty"
          disabled={isInCooldown}
        >
          {isInCooldown ? `Wait ${cooldownTimeLeft}s` : "Create Your First Note"}
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;