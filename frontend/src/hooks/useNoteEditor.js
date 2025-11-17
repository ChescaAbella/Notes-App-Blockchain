import { useState } from 'react';

export function useNoteEditor() {
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const openNote = (note) => {
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content });
    setHasChanges(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setDraft({ title: "", content: "" });
    setHasChanges(false);
  };

  const handleDraftChange = (field, value) => {
    setDraft({ ...draft, [field]: value });
    if (editingNote) {
      const changed = value !== editingNote[field];
      setHasChanges(
        changed || 
        (field === 'title' 
          ? draft.content !== editingNote.content 
          : draft.title !== editingNote.title)
      );
    }
  };

  const resetDraft = () => {
    setDraft({ title: "", content: "" });
  };

  const openConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  return {
    draft,
    editingNote,
    hasChanges,
    showModal,
    showConfirmModal,
    setShowModal,
    openNote,
    closeModal,
    handleDraftChange,
    resetDraft,
    openConfirmModal,
    closeConfirmModal
  };
}