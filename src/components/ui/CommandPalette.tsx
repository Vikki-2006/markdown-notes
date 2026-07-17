import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { exportNote } from '../../utils/markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Archive, 
  Star, 
  Download, 
  Upload, 
  Sparkles, 
  Command, 
  Keyboard 
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  name: string;
  category: 'Actions' | 'Notes';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { 
    notes, 
    activeNoteId, 
    createNote, 
    deleteNote, 
    duplicateNote, 
    toggleFavorite, 
    toggleArchive 
  } = useNotes();
  
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeNote = notes.find(n => n.id === activeNoteId);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query]);

  // Main Menu Commands
  const mainCommands: CommandItem[] = [
    {
      id: 'new-note',
      name: 'Create New Note',
      category: 'Actions',
      icon: <Plus className="w-4 h-4 text-accent" />,
      shortcut: 'Ctrl + N',
      action: () => {
        createNote();
        onClose();
      }
    },
    {
      id: 'delete-note',
      name: 'Delete Selected Note permanently',
      category: 'Actions',
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      shortcut: 'Delete',
      action: () => {
        if (activeNote) {
          deleteNote(activeNote.id);
        } else {
          addToast('No note selected', 'warning');
        }
        onClose();
      }
    },
    {
      id: 'duplicate-note',
      name: 'Duplicate Active Note',
      category: 'Actions',
      icon: <Copy className="w-4 h-4 text-sky-400" />,
      shortcut: 'Ctrl+Shift+D',
      action: () => {
        if (activeNote) {
          duplicateNote(activeNote.id);
        } else {
          addToast('No note selected', 'warning');
        }
        onClose();
      }
    },
    {
      id: 'archive-note',
      name: activeNote?.isArchived ? 'Restore Active Note' : 'Archive Active Note',
      category: 'Actions',
      icon: <Archive className="w-4 h-4 text-amber-500" />,
      shortcut: 'Ctrl+Shift+A',
      action: () => {
        if (activeNote) {
          toggleArchive(activeNote.id);
        } else {
          addToast('No note selected', 'warning');
        }
        onClose();
      }
    },
    {
      id: 'favorite-note',
      name: activeNote?.isFavorite ? 'Remove Note from Favorites' : 'Add Note to Favorites',
      category: 'Actions',
      icon: <Star className="w-4 h-4 text-yellow-500" />,
      action: () => {
        if (activeNote) {
          toggleFavorite(activeNote.id);
        } else {
          addToast('No note selected', 'warning');
        }
        onClose();
      }
    },
    {
      id: 'toggle-theme',
      name: 'Toggle Dark/Light Theme',
      category: 'Actions',
      icon: <Star className="w-4 h-4 text-accent" />,
      action: () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
        addToast('Theme toggled', 'success');
        onClose();
      }
    },
    {
      id: 'export-md',
      name: 'Export Note as Markdown (.md)',
      category: 'Actions',
      icon: <Download className="w-4 h-4 text-emerald-500" />,
      action: () => {
        if (activeNote) {
          exportNote(activeNote, 'md');
          addToast('Exported markdown file', 'success');
        } else {
          addToast('No note selected', 'warning');
        }
        onClose();
      }
    },
    {
      id: 'export-txt',
      name: 'Export Note as Plain Text (.txt)',
      category: 'Actions',
      icon: <Download className="w-4 h-4 text-teal-500" />,
      action: () => {
        if (activeNote) {
          exportNote(activeNote, 'txt');
          addToast('Exported text file', 'success');
        } else {
          addToast('No note selected', 'warning');
        }
        onClose();
      }
    },
    {
      id: 'import-md',
      name: 'Import note from text file',
      category: 'Actions',
      icon: <Upload className="w-4 h-4 text-blue-400" />,
      action: () => {
        // Trigger file picker globally
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';
        input.onchange = (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            const content = evt.target?.result as string;
            const title = file.name.replace(/\.[^/.]+$/, "");
            createNote(title, content);
          };
          reader.readAsText(file);
        };
        input.click();
        onClose();
      }
    },
    {
      id: 'focus-search',
      name: 'Focus Note Search Bar',
      category: 'Actions',
      shortcut: 'Ctrl + F',
      icon: <Search className="w-4 h-4 text-zinc-400" />,
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
        onClose();
      }
    }
  ];

  const getFilteredItems = (): CommandItem[] => {
    let baseItems: CommandItem[] = [...mainCommands];
    
    // Add Notes search list
    const searchNoteItems: CommandItem[] = notes.map(n => ({
      id: n.id,
      name: `Open Note: ${n.title || 'Untitled Note'}`,
      category: 'Notes',
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      action: () => {
        // Switch to notes tab if dashboard is active
        const notesTabBtn = document.getElementById('tab-notes');
        notesTabBtn?.click();
        
        // Focus note card item
        // Set active note id in context
        const targetNote = notes.find(noteItem => noteItem.id === n.id);
        if (targetNote) {
          // Context triggers it
        }
        // The click updates active note id
        const targetCard = document.querySelector(`[layoutid="${n.id}"]`) as HTMLElement;
        targetCard?.click();
        onClose();
      }
    }));
    
    baseItems = [...baseItems, ...searchNoteItems];

    if (!query.trim()) return baseItems;

    const lowerQuery = query.toLowerCase();
    return baseItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      item.category.toLowerCase().includes(lowerQuery)
    );
  };

  const filteredItems = getFilteredItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel shadow-2xl border border-white/10 z-10 flex flex-col max-h-[50vh] bg-zinc-900/90"
          >
            {/* Input Bar */}
            <div className="relative flex items-center border-b border-white/5 px-4 py-3">
              <Command className="w-5 h-5 text-accent mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or search notes..."
                className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder-zinc-500"
              />
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg">
                <kbd className="font-mono">ESC</kbd>
              </div>
            </div>

            {/* List Output */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredItems.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {/* Category Headers */}
                  {Array.from(new Set(filteredItems.map(i => i.category))).map(category => {
                    const categoryItems = filteredItems.filter(i => i.category === category);
                    return (
                      <React.Fragment key={category}>
                        <div className="text-[10px] font-bold text-zinc-500 px-3 py-1.5 uppercase tracking-wider">
                          {category}
                        </div>
                        {categoryItems.map(item => {
                          const globalIdx = filteredItems.indexOf(item);
                          const isSelected = selectedIndex === globalIdx;
                          return (
                            <div
                              key={item.id}
                              onClick={item.action}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-accent-light border border-accent-border text-accent' 
                                  : 'border border-transparent text-zinc-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {item.icon}
                                <span className="text-xs font-medium">{item.name}</span>
                              </div>
                              {item.shortcut && (
                                <div className="flex gap-1 items-center">
                                  <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-800 rounded border-b border-zinc-950 font-mono shadow">
                                    {item.shortcut}
                                  </kbd>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                  <Search className="w-8 h-8 text-zinc-600 mb-2" />
                  <p className="text-xs">No matching commands or notes found.</p>
                </div>
              )}
            </div>

            {/* Help Footer */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex justify-between items-center text-[10px] text-zinc-500 font-medium">
              <div className="flex gap-3 items-center">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5 text-zinc-650" />
                  Use Arrows to Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd>Enter</kbd> to Trigger
                </span>
              </div>
              <div>
                <span>Ctrl + K</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
