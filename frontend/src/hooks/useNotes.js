import { useState, useEffect } from 'react';

export function useNotes() {
  const [notes, setNotes] = useState([]);

  // Load notes from backend on mount
  useEffect(() => {
    const loadNotes = async () => {
      const token = localStorage.getItem('token');
      console.log('Loading notes - Token exists:', !!token);
      
      if (!token) {
        console.warn('No token found - user not logged in');
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/api/notes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Load notes response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded notes from database:', data);
          
          // Parse the content field which contains our blockchain data
          const parsedNotes = (data.notes || []).map(note => {
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
          console.log('Parsed notes:', parsedNotes);
          setNotes(parsedNotes);
        } else {
          console.error('Failed to load notes - status:', response.status);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    };
    loadNotes();
  }, []);

  const saveNoteToDatabase = async (noteData, editingNote = null) => {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.warn('No token found - are you logged in?');
      return null;
    }

    try {
      const payload = {
        title: noteData.title,
        content: JSON.stringify({ 
          content: noteData.content, 
          txHash: noteData.txHash, 
          timestamp: noteData.timestamp 
        })
      };
      console.log('Saving to database:', payload);
      
      // If editing, update the existing note in the database
      let response;
      if (editingNote && editingNote.id) {
        response = await fetch(`http://localhost:4000/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('http://localhost:4000/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      
      console.log('Database response status:', response.status);
      const data = await response.json();
      console.log('Database response data:', data);
      
      if (response.ok) {
        return data.note.id;
      } else {
        console.error('Failed to save - server error:', data);
        return null;
      }
    } catch (error) {
      console.error('Failed to save to database:', error);
      return null;
    }
  };

  const addNote = (newNote) => {
    setNotes([newNote, ...notes]);
  };

  const updateNote = (noteId, updatedNote) => {
    setNotes(notes.map(n => n.id === noteId ? updatedNote : n));
  };

  return {
    notes,
    setNotes,
    saveNoteToDatabase,
    addNote,
    updateNote
  };
}