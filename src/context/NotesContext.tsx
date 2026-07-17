import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Note, Folder, SortOption, FilterOption } from '../types';
import { useToast } from './ToastContext';

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  searchQuery: string;
  sortBy: SortOption;
  filterBy: FilterOption;
  unsavedChanges: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  setActiveNoteId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  setFilterBy: (filter: FilterOption) => void;
  
  // Notes CRUD
  createNote: (title?: string, content?: string, folderId?: string | null) => string;
  updateActiveNote: (title: string, content: string) => void;
  deleteNote: (id: string) => void;
  duplicateNote: (id: string) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
  importNote: (title: string, content: string) => void;
  
  // Folders CRUD
  createFolder: (name: string, parentId?: string | null) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
  moveFolder: (folderId: string, parentId: string | null) => void;
  
  // Cover & Tags
  updateNoteCover: (id: string, type: Note['coverType'], value: string) => void;
  addNoteTag: (id: string, tag: string) => void;
  removeNoteTag: (id: string, tag: string) => void;
  
  // Backup
  exportBackup: () => void;
  importBackup: (backupJson: string) => boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Self-contained word count helper to avoid import dependency cycles
const getWordCount = (str: string): number => {
  if (!str.trim()) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
};

const SEED_FOLDERS: Folder[] = [
  { id: 'folder-getting-started', name: 'Getting Started 🚀', parentId: null, createdAt: new Date().toISOString() },
  { id: 'folder-projects', name: 'Projects 💻', parentId: null, createdAt: new Date().toISOString() },
  { id: 'folder-ideas', name: 'Ideas 💡', parentId: 'folder-projects', createdAt: new Date().toISOString() } // nested folder
];

const SEED_NOTES: Note[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to Markdown Notes',
    content: `# Welcome to Markdown Notes! 🚀\n\nThis is a premium, minimal, and fully-featured Markdown Editor designed for speed and productivity.\n\n## Slash commands\nType \`/\` in the editor to insert structured blocks (headings, lists, quotes, tables, code blocks, dividers, callout panels) instantly!\n\n## Custom Cover Images\nYou can change the header cover to solid colors, gradients, emoji characters, or premium Unsplash graphics using the controls at the top of the editor page!\n\n## Tags\nYou can categorize notes with tag items. We added \`#Guide\` and \`#Markdown\` as seed tags below.\n`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: true,
    isFavorite: false,
    isArchived: false,
    folderId: 'folder-getting-started',
    tags: ['#Guide', '#Markdown'],
    coverType: 'gradient',
    coverValue: 'linear-gradient(to right, #06b6d4, #3b82f6)',
    wordCountHistory: {}
  },
  {
    id: 'note-roadmap',
    title: 'SaaS Product Roadmap',
    content: `# Product Release Roadmap 🗺️\n\n- [x] Responsive layout & multi-theme toggle\n- [x] Command Palette (Ctrl+K)\n- [x] Notion-style slash block commands\n- [ ] JWT authentication integration\n- [ ] AI copilot companion\n\n> "Execution is everything."\n`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: false,
    isFavorite: true,
    isArchived: false,
    folderId: 'folder-projects',
    tags: ['#Projects', '#SaaS'],
    coverType: 'unsplash',
    coverValue: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    wordCountHistory: {}
  }
];

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  // 1. Initial State from localStorage
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('markdown_folders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return SEED_FOLDERS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('markdown_notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((n: any) => ({
            ...n,
            folderId: n.folderId !== undefined ? n.folderId : null,
            tags: Array.isArray(n.tags) ? n.tags : [],
            coverType: n.coverType || 'none',
            coverValue: n.coverValue || '',
            wordCountHistory: n.wordCountHistory || {}
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
    return SEED_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const savedActive = localStorage.getItem('active_note_id');
    if (savedActive) return savedActive;
    return notes.length > 0 ? notes[0].id : null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state to local storage
  const persistNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('markdown_notes', JSON.stringify(updatedNotes));
  };

  const persistFolders = (updatedFolders: Folder[]) => {
    setFolders(updatedFolders);
    localStorage.setItem('markdown_folders', JSON.stringify(updatedFolders));
  };

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('active_note_id', activeNoteId);
    } else {
      localStorage.removeItem('active_note_id');
    }
  }, [activeNoteId]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // 2. Notes CRUD Operations
  const createNote = (title = 'Untitled Note', content = '', folderId: string | null = null) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      folderId,
      tags: [],
      coverType: 'none',
      coverValue: '',
      wordCountHistory: {}
    };
    const updated = [newNote, ...notes];
    persistNotes(updated);
    setActiveNoteId(newNote.id);
    addToast('Note created successfully', 'success');
    return newNote.id;
  };

  const updateActiveNote = (title: string, content: string) => {
    if (!activeNoteId) return;

    setUnsavedChanges(true);
    setIsSaving(true);

    // Update state immediately to keep editor responsive
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === activeNoteId
          ? { ...note, title, content }
          : note
      )
    );

    // Debounce save for localStorage & updatedAt update
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      const today = now.split('T')[0];
      
      setNotes((prevNotes) => {
        const nextNotes = prevNotes.map((note) => {
          if (note.id !== activeNoteId) return note;
          
          // Calculate words difference
          const oldSavedNotes = JSON.parse(localStorage.getItem('markdown_notes') || '[]');
          const oldSavedNote = oldSavedNotes.find((n: Note) => n.id === activeNoteId);
          const oldWords = oldSavedNote ? getWordCount(oldSavedNote.content) : 0;
          const newWords = getWordCount(content);
          const diff = Math.max(0, newWords - oldWords);
          
          const history = { ...(note.wordCountHistory || {}) };
          if (diff > 0) {
            history[today] = (history[today] || 0) + diff;
          }

          return { 
            ...note, 
            title, 
            content, 
            updatedAt: now,
            wordCountHistory: history
          };
        });
        localStorage.setItem('markdown_notes', JSON.stringify(nextNotes));
        return nextNotes;
      });
      setUnsavedChanges(false);
      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 800);
  };

  const deleteNote = (id: string) => {
    const filtered = notes.filter((n) => n.id !== id);
    persistNotes(filtered);
    
    if (activeNoteId === id) {
      const nextNote = filtered.find((n) => !n.isArchived) || filtered[0] || null;
      setActiveNoteId(nextNote ? nextNote.id : null);
    }
    
    addToast('Note deleted permanently', 'info');
  };

  const duplicateNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const copy: Note = {
      ...target,
      id: Math.random().toString(36).substring(2, 9),
      title: `${target.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
    };

    const updated = [copy, ...notes];
    persistNotes(updated);
    setActiveNoteId(copy.id);
    addToast('Note duplicated', 'success');
  };

  const togglePin = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
    );
    persistNotes(updated);
    const note = updated.find((n) => n.id === id);
    addToast(note?.isPinned ? 'Note pinned' : 'Note unpinned', 'info');
  };

  const toggleFavorite = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isFavorite: !n.isFavorite, updatedAt: new Date().toISOString() } : n
    );
    persistNotes(updated);
    const note = updated.find((n) => n.id === id);
    addToast(note?.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'info');
  };

  const toggleArchive = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isArchived: !n.isArchived, updatedAt: new Date().toISOString() } : n
    );
    persistNotes(updated);
    
    const note = updated.find((n) => n.id === id);
    const archived = note?.isArchived;
    
    addToast(archived ? 'Note archived' : 'Note restored from archive', 'success');
    
    if (activeNoteId === id) {
      const nextNote = updated.find((n) => archived ? !n.isArchived : n.id === id) || null;
      setActiveNoteId(nextNote ? nextNote.id : null);
    }
  };

  const importNote = (title: string, content: string) => {
    const newId = createNote(title, content);
    addToast('Note imported successfully', 'success');
    setActiveNoteId(newId);
  };

  // 3. Folders CRUD Operations
  const createFolder = (name: string, parentId: string | null = null) => {
    const newFolder: Folder = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      parentId,
      createdAt: new Date().toISOString()
    };
    persistFolders([...folders, newFolder]);
    addToast(`Folder "${name}" created`, 'success');
    return newFolder.id;
  };

  const renameFolder = (id: string, name: string) => {
    const updated = folders.map(f => f.id === id ? { ...f, name } : f);
    persistFolders(updated);
    addToast('Folder renamed', 'success');
  };

  const deleteFolder = (id: string) => {
    // Delete target folder and nested folders
    const getSubfolderIds = (folderId: string): string[] => {
      const children = folders.filter(f => f.parentId === folderId);
      return [folderId, ...children.flatMap(c => getSubfolderIds(c.id))];
    };
    
    const allFolderIdsToDelete = getSubfolderIds(id);
    
    // Unassign notes in deleted folders (assign to root)
    const updatedNotes = notes.map(n => 
      n.folderId && allFolderIdsToDelete.includes(n.folderId)
        ? { ...n, folderId: null }
        : n
    );
    
    const updatedFolders = folders.filter(f => !allFolderIdsToDelete.includes(f.id));
    
    persistNotes(updatedNotes);
    persistFolders(updatedFolders);
    addToast('Folder deleted recursively (notes moved to root)', 'info');
  };

  const moveNoteToFolder = (noteId: string, folderId: string | null) => {
    const updated = notes.map(n => n.id === noteId ? { ...n, folderId, updatedAt: new Date().toISOString() } : n);
    persistNotes(updated);
    addToast('Note moved', 'success');
  };

  const moveFolder = (folderId: string, parentId: string | null) => {
    // Prevent folder nesting inside itself
    if (folderId === parentId) return;
    
    const updated = folders.map(f => f.id === folderId ? { ...f, parentId } : f);
    persistFolders(updated);
    addToast('Folder structure updated', 'success');
  };

  // 4. Covers & Tags Operations
  const updateNoteCover = (id: string, type: Note['coverType'], value: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, coverType: type, coverValue: value, updatedAt: new Date().toISOString() } : n);
    persistNotes(updated);
  };

  const addNoteTag = (id: string, tag: string) => {
    // Ensure tag starts with '#'
    const cleanTag = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;
    const target = notes.find(n => n.id === id);
    if (!target || target.tags.includes(cleanTag)) return;

    const updated = notes.map(n => 
      n.id === id 
        ? { ...n, tags: [...n.tags, cleanTag], updatedAt: new Date().toISOString() } 
        : n
    );
    persistNotes(updated);
    addToast(`Added tag ${cleanTag}`, 'success');
  };

  const removeNoteTag = (id: string, tag: string) => {
    const updated = notes.map(n => 
      n.id === id 
        ? { ...n, tags: n.tags.filter(t => t !== tag), updatedAt: new Date().toISOString() } 
        : n
    );
    persistNotes(updated);
    addToast(`Removed tag ${tag}`, 'info');
  };

  // 5. JSON Backup Export/Import
  const exportBackup = () => {
    const data = {
      notes,
      folders,
      exportDate: new Date().toISOString(),
      version: 's_1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdown-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('Backup exported successfully', 'success');
  };

  const importBackup = (backupJson: string): boolean => {
    try {
      const parsed = JSON.parse(backupJson);
      if (!parsed.notes || !Array.isArray(parsed.notes)) {
        addToast('Invalid backup format', 'error');
        return false;
      }
      
      const newNotes = parsed.notes;
      const newFolders = parsed.folders || [];
      
      // Merge by overwriting matches and appending new entries
      setNotes(newNotes);
      localStorage.setItem('markdown_notes', JSON.stringify(newNotes));
      
      setFolders(newFolders);
      localStorage.setItem('markdown_folders', JSON.stringify(newFolders));
      
      if (newNotes.length > 0) {
        setActiveNoteId(newNotes[0].id);
      }
      
      addToast('Backup imported successfully', 'success');
      return true;
    } catch (e) {
      console.error(e);
      addToast('Failed to parse backup JSON file', 'error');
      return false;
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        folders,
        activeNoteId,
        searchQuery,
        sortBy,
        filterBy,
        unsavedChanges,
        isSaving,
        lastSaved,
        setActiveNoteId,
        setSearchQuery,
        setSortBy,
        setFilterBy,
        
        // Notes CRUD
        createNote,
        updateActiveNote,
        deleteNote,
        duplicateNote,
        togglePin,
        toggleFavorite,
        toggleArchive,
        importNote,
        
        // Folders CRUD
        createFolder,
        renameFolder,
        deleteFolder,
        moveNoteToFolder,
        moveFolder,
        
        // Cover & Tags
        updateNoteCover,
        addNoteTag,
        removeNoteTag,
        
        // Backup
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
};
