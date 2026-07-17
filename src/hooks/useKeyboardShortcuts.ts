import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewNote: () => void;
  onSave: () => void;
  onSearch: () => void;
  onDelete: () => void;
}

export function useKeyboardShortcuts({
  onNewNote,
  onSave,
  onSearch,
  onDelete,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey; // Ctrl on windows/linux, Command on Mac
      
      // Ctrl + N -> New Note
      if (isCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNewNote();
      }
      
      // Ctrl + S -> Manual Save
      if (isCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
      
      // Ctrl + F -> Search Note
      if (isCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onSearch();
      }
      
      // Delete -> Delete Note (make sure we aren't typing in an input/textarea)
      if (e.key === 'Delete') {
        const target = e.target as HTMLElement;
        const isEditing = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable;
          
        if (!isEditing) {
          e.preventDefault();
          onDelete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNewNote, onSave, onSearch, onDelete]);
}
export default useKeyboardShortcuts;
