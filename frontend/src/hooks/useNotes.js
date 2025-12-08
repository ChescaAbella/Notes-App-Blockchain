import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const { walletAddress, isConnected } = useWallet();

  // Load notes from backend on mount or when wallet connects
  useEffect(() => {
    const loadNotes = async () => {
      console.log('Loading notes - Wallet connected:', isConnected);
      console.log('Wallet address:', walletAddress);

      if (!isConnected || !walletAddress) {
        console.warn('Wallet not connected - cannot load notes');
        setNotes([]); // Clear notes when wallet disconnects
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/notes/wallet/${walletAddress}`, {
          headers: {
            'Content-Type': 'application/json'
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
                timestamp: parsed.timestamp,
                is_pinned: note.is_pinned || parsed.is_pinned || false,
                is_favorite: note.is_favorite || parsed.is_favorite || false,
                status: note.status || 'pending',
                updated_at: note.updated_at,
                deleted_at: note.deleted_at,
                deletion_tx_hash: note.deletion_tx_hash,
                last_edit_tx_hash: note.last_edit_tx_hash
              };
            } catch {
              // If parsing fails, return as is with all properties
              return {
                ...note,
                timestamp: note.updated_at || note.timestamp
              };
            }
          });
          console.log('Parsed notes:', parsedNotes);
          setNotes(parsedNotes);
        } else if (response.status === 404) {
          // No notes found for this wallet - that's okay
          console.log('No notes found for this wallet address');
          setNotes([]);
        } else {
          console.error('Failed to load notes - status:', response.status);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    };

    loadNotes();
  }, [walletAddress, isConnected]);

  const saveNoteToDatabase = async (noteData, editingNote = null) => {
    console.log('Wallet address:', walletAddress);
    console.log('Is connected:', isConnected);

    if (!isConnected || !walletAddress) {
      console.warn('Wallet not connected - cannot save note');
      return null;
    }

    try {
      const payload = {
        wallet_address: walletAddress,
        title: noteData.title,
        content: JSON.stringify({
          content: noteData.content,
          txHash: noteData.txHash,
          timestamp: noteData.timestamp,
          is_pinned: noteData.is_pinned || false,
          is_favorite: noteData.is_favorite || false
        }),
        txHash: noteData.txHash // Store tx hash at root level too
      };
      console.log('Saving to database:', payload);

      // If editing, update the existing note in the database
      let response;
      if (editingNote && editingNote.id) {
        response = await fetch(`http://localhost:4000/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('http://localhost:4000/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
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

  const updateNoteMetadata = async (noteId, updates) => {
    if (!isConnected || !walletAddress) {
      console.warn('Wallet not connected - cannot update metadata');
      return;
    }

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    try {
      const payload = {
        wallet_address: walletAddress,
        title: note.title,
        content: JSON.stringify({
          content: note.content,
          txHash: note.txHash,
          timestamp: note.timestamp,
          is_pinned: updates.is_pinned !== undefined ? updates.is_pinned : note.is_pinned,
          is_favorite: updates.is_favorite !== undefined ? updates.is_favorite : note.is_favorite
        }),
        txHash: note.txHash
      };

      const response = await fetch(`http://localhost:4000/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Updated note metadata:', data);

        // Update local state
        updateNote(noteId, { ...note, ...updates });
      } else {
        console.error('Failed to update metadata - status:', response.status);
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  };

  return {
    notes,
    setNotes,
    saveNoteToDatabase,
    addNote,
    updateNote,
    updateNoteMetadata
  };
}