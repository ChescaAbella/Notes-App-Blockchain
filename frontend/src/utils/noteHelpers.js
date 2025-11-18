/**
 * Parse notes from database format
 * @param {Array} rawNotes - Notes from database
 * @returns {Array} - Parsed notes
 */
export function parseNotesFromDatabase(rawNotes) {
  return (rawNotes || []).map(note => {
    try {
      const parsed = JSON.parse(note.content);
      return {
        id: note.id,
        title: note.title,
        content: parsed.content,
        txHash: parsed.txHash,
        timestamp: parsed.timestamp
      };
    } catch {
      // If parsing fails, return as is
      return note;
    }
  });
}

/**
 * Filter notes by search query
 * @param {Array} notes - Array of notes
 * @param {string} searchQuery - Search query string
 * @returns {Array} - Filtered notes
 */
export function filterNotes(notes, searchQuery) {
  if (!searchQuery.trim()) return notes;
  
  const query = searchQuery.toLowerCase();
  return notes.filter((note) => {
    const matchesTitle = note.title.toLowerCase().includes(query);
    const matchesContent = note.content.toLowerCase().includes(query);
    return matchesTitle || matchesContent;
  });
}