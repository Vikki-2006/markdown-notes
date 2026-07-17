import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import Sidebar from './components/layout/Sidebar';
import EditorPanel from './components/layout/EditorPanel';
import DashboardView from './components/layout/DashboardView';
import CalendarView from './components/layout/CalendarView';
import AnalyticsView from './components/layout/AnalyticsView';
import ToastContainer from './components/ui/ToastContainer';
import DeleteModal from './components/ui/DeleteModal';
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal';
import CommandPalette from './components/ui/CommandPalette';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import type { Note } from './types';

const NotesDashboard: React.FC = () => {
  const { 
    notes, 
    activeNoteId, 
    createNote, 
    deleteNote, 
    updateActiveNote,
    duplicateNote,
    toggleArchive
  } = useNotes();
  
  const { addToast } = useToast();

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Modals state
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<Note | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global Page views state: dashboard, notes, calendar, analytics
  const [activeTab, setActiveTab] = useState<'notes' | 'dashboard' | 'calendar' | 'analytics'>('dashboard');

  // Mobile responsiveness: Toggle whether sidebar or editor is shown
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  // Command Palette global Hotkey: Ctrl + K
  useEffect(() => {
    const handlePaletteTrigger = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handlePaletteTrigger);
    return () => window.removeEventListener('keydown', handlePaletteTrigger);
  }, []);

  // Esc closes all modals
  useEffect(() => {
    const handleEscapeClose = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsPaletteOpen(false);
        setIsShortcutsOpen(false);
        setDeleteConfirmNote(null);
      }
    };
    window.addEventListener('keydown', handleEscapeClose);
    return () => window.removeEventListener('keydown', handleEscapeClose);
  }, []);

  // Ctrl + Shift + D (duplicate), Ctrl + Shift + A (archive) keyboard shortcuts
  useEffect(() => {
    const handleExtraShortcuts = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (activeNote) {
          duplicateNote(activeNote.id);
        } else {
          addToast('No note selected to duplicate', 'warning');
        }
      } else if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (activeNote) {
          toggleArchive(activeNote.id);
        } else {
          addToast('No note selected to archive', 'warning');
        }
      }
    };
    window.addEventListener('keydown', handleExtraShortcuts);
    return () => window.removeEventListener('keydown', handleExtraShortcuts);
  }, [activeNote, duplicateNote, toggleArchive]);

  // Standard keyboard shortcut hooks handlers
  const handleNewNoteShortcut = () => {
    createNote();
    setActiveTab('notes');
    setShowSidebarMobile(false); // edit directly on mobile
  };

  const handleSaveShortcut = () => {
    if (activeNote) {
      updateActiveNote(activeNote.title, activeNote.content);
      addToast('Note saved successfully', 'success');
    } else {
      addToast('No active note to save', 'warning');
    }
  };

  const handleSearchShortcut = () => {
    setActiveTab('notes');
    setShowSidebarMobile(true);
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    searchInput?.focus();
  };

  const handleDeleteShortcut = () => {
    if (activeNote) {
      setDeleteConfirmNote(activeNote);
    } else {
      addToast('No note selected to delete', 'warning');
    }
  };

  useKeyboardShortcuts({
    onNewNote: handleNewNoteShortcut,
    onSave: handleSaveShortcut,
    onSearch: handleSearchShortcut,
    onDelete: handleDeleteShortcut,
  });

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 overflow-hidden transition-colors duration-300">
      
      {/* Sidebar View Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 lg:relative lg:z-0 lg:flex transform transition-transform duration-300 lg:translate-x-0 ${
          showSidebarMobile ? 'translate-x-0 w-full sm:w-80' : '-translate-x-full w-0 lg:w-80'
        }`}
      >
        <Sidebar 
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'notes') {
              setShowSidebarMobile(false); // fill main pane on mobile
            }
          }}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenDeleteConfirm={(note) => setDeleteConfirmNote(note)}
        />
      </div>

      {/* Main Workspace Area (Switches panels based on activeTab) */}
      <div className={`flex-1 h-full flex flex-col transition-all duration-300 ${
        showSidebarMobile ? 'hidden lg:flex' : 'flex'
      }`}>
        {activeTab === 'notes' && (
          <EditorPanel 
            onOpenDeleteConfirm={(note) => setDeleteConfirmNote(note)}
            onShowSidebar={() => setShowSidebarMobile(true)}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardView onSelectTab={setActiveTab} />
        )}
        {activeTab === 'calendar' && (
          <CalendarView onSelectTab={setActiveTab} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}
      </div>

      {/* Modals & Dialogs overlays */}
      <DeleteModal
        isOpen={deleteConfirmNote !== null}
        onClose={() => setDeleteConfirmNote(null)}
        onConfirm={() => {
          if (deleteConfirmNote) {
            deleteNote(deleteConfirmNote.id);
            setDeleteConfirmNote(null);
          }
        }}
        noteTitle={deleteConfirmNote?.title || ''}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <CommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <NotesProvider>
        <ThemeProvider>
          <NotesDashboard />
          <ToastContainer />
        </ThemeProvider>
      </NotesProvider>
    </ToastProvider>
  );
}
