import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../../context/NotesContext';
import type { Note } from '../../types';
import { 
  getWordCount, 
  getCharacterCount, 
  getReadingTime, 
  exportNote 
} from '../../utils/markdown';
import PreviewPanel from './PreviewPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pin, 
  Star, 
  Archive, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  FileText, 
  Edit3, 
  BookOpen, 
  Columns, 
  Sparkles, 
  ArrowLeft,
  Mic,
  MicOff,
  Image as ImageIcon,
  Tag as TagIcon,
  X,
  Heading1,
  Heading2,
  Table as TableIcon,
  Minus,
  Quote,
  CheckSquare,
  Code2,
  AlertCircle
} from 'lucide-react';

interface EditorPanelProps {
  onOpenDeleteConfirm: (note: Note) => void;
  onShowSidebar: () => void;
}

interface SlashItem {
  name: string;
  desc: string;
  icon: React.ReactNode;
  template: string;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  onOpenDeleteConfirm,
  onShowSidebar
}) => {
  const {
    notes,
    activeNoteId,
    unsavedChanges,
    isSaving,
    lastSaved,
    updateActiveNote,
    createNote,
    duplicateNote,
    togglePin,
    toggleFavorite,
    toggleArchive,
    importNote,
    updateNoteCover,
    addNoteTag,
    removeNoteTag
  } = useNotes();

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Editor states
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');

  // Speech Recognition Speech to Text
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Notion-style slash commands menu states
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const coverMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  // Sync state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle('');
      setContent('');
    }
    setShowSlashMenu(false);
    setShowCoverSelector(false);
  }, [activeNoteId]);

  // Adjust editor mode based on screen width on mount/resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && editorMode === 'split') {
        setEditorMode('edit');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [editorMode]);

  // Click outside menus triggers close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (coverMenuRef.current && !coverMenuRef.current.contains(e.target as Node)) {
        setShowCoverSelector(false);
      }
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Web Speech API SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim() && activeNote) {
          // Append transcript at cursor
          const txtArea = textareaRef.current;
          if (txtArea) {
            const start = txtArea.selectionStart;
            const end = txtArea.selectionEnd;
            const text = txtArea.value;
            const nextContent = text.substring(0, start) + ' ' + transcript + ' ' + text.substring(end);
            setContent(nextContent);
            updateActiveNote(title, nextContent);
            
            // Refocus & reset cursor
            setTimeout(() => {
              txtArea.focus();
              txtArea.selectionStart = txtArea.selectionEnd = start + transcript.length + 2;
            }, 50);
          } else {
            const nextContent = content + ' ' + transcript;
            setContent(nextContent);
            updateActiveNote(title, nextContent);
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, [activeNote, content, title]);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTitle = e.target.value;
    setTitle(nextTitle);
    updateActiveNote(nextTitle, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextContent = e.target.value;
    setContent(nextContent);
    updateActiveNote(title, nextContent);

    // Notion slash commands menu trigger check
    const selectionEnd = e.target.selectionEnd;
    const textBeforeCursor = nextContent.substring(0, selectionEnd);
    
    // Check if the last character typed is '/' or if we are typing inside a slash search
    const slashIdx = textBeforeCursor.lastIndexOf('/');
    if (slashIdx !== -1 && slashIdx >= textBeforeCursor.lastIndexOf('\n')) {
      const query = textBeforeCursor.substring(slashIdx + 1);
      // Ensure no spaces inside query
      if (!query.includes(' ')) {
        setShowSlashMenu(true);
        setSlashQuery(query);
        setSlashIndex(0);
        return;
      }
    }
    setShowSlashMenu(false);
  };

  // Keyboard navigation inside Slash Command Menu
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu) {
      const items = getFilteredSlashItems();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex(prev => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex(prev => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[slashIndex]) {
          insertSlashTemplate(items[slashIndex].template);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
      }
    }
  };

  const getFilteredSlashItems = (): SlashItem[] => {
    const allSlashItems: SlashItem[] = [
      { name: 'Heading 1', desc: 'Large section heading', icon: <Heading1 className="w-4 h-4 text-accent" />, template: '\n# ' },
      { name: 'Heading 2', desc: 'Medium subsection heading', icon: <Heading2 className="w-4 h-4 text-indigo-400" />, template: '\n## ' },
      { name: 'Checklist', desc: 'Task checklist item', icon: <CheckSquare className="w-4 h-4 text-emerald-400" />, template: '\n- [ ] ' },
      { name: 'Table', desc: 'Insert markdown table block', icon: <TableIcon className="w-4 h-4 text-purple-400" />, template: '\n| Col 1 | Col 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n' },
      { name: 'Divider', desc: 'Horizontal line divider', icon: <Minus className="w-4 h-4 text-zinc-400" />, template: '\n---\n' },
      { name: 'Quote', desc: 'Blockquote citation', icon: <Quote className="w-4 h-4 text-amber-500" />, template: '\n> ' },
      { name: 'Code Block', desc: 'Fenced code syntax block', icon: <Code2 className="w-4 h-4 text-rose-400" />, template: '\n```javascript\n\n```' },
      { name: 'Callout Box', desc: 'Highlighted alert panel', icon: <AlertCircle className="w-4 h-4 text-sky-400" />, template: '\n> 💡 **Callout Title**\n> Description details\n' }
    ];

    if (!slashQuery) return allSlashItems;
    return allSlashItems.filter(item => 
      item.name.toLowerCase().includes(slashQuery.toLowerCase())
    );
  };

  const insertSlashTemplate = (template: string) => {
    const txtArea = textareaRef.current;
    if (!txtArea) return;

    const start = txtArea.selectionStart;
    const end = txtArea.selectionEnd;
    const text = txtArea.value;
    
    // Find where the '/' character started
    const textBeforeCursor = text.substring(0, start);
    const slashIdx = textBeforeCursor.lastIndexOf('/');
    
    if (slashIdx !== -1) {
      const nextContent = text.substring(0, slashIdx) + template + text.substring(end);
      setContent(nextContent);
      updateActiveNote(title, nextContent);
      
      // Reset cursor position
      setTimeout(() => {
        txtArea.focus();
        const cursorLoc = slashIdx + template.length;
        txtArea.selectionStart = txtArea.selectionEnd = cursorLoc;
      }, 50);
    }
    
    setShowSlashMenu(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
      importNote(cleanTitle, text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInputValue.trim() && activeNote) {
      addNoteTag(activeNote.id, tagInputValue.trim());
      setTagInputValue('');
    }
  };

  // Covers selections data list
  const coversList = [
    { type: 'gradient', name: 'Neon Cyan', value: 'linear-gradient(to right, #06b6d4, #3b82f6)' },
    { type: 'gradient', name: 'Sunset Orange', value: 'linear-gradient(to right, #f43f5e, #fb923c)' },
    { type: 'gradient', name: 'Royal Velvet', value: 'linear-gradient(to right, #8b5cf6, #ec4899)' },
    { type: 'gradient', name: 'Mint Emerald', value: 'linear-gradient(to right, #10b981, #059669)' },
    { type: 'color', name: 'Steel Blue', value: '#1e3a8a' },
    { type: 'color', name: 'Slate Gray', value: '#334155' },
    { type: 'emoji', name: 'Brain', value: '🧠' },
    { type: 'emoji', name: 'Code', value: '💻' },
    { type: 'emoji', name: 'Rocket', value: '🚀' },
    { type: 'unsplash', name: 'Workspace', value: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80' },
    { type: 'unsplash', name: 'Cyberpunk', value: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=1200&q=80' }
  ];

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="w-16 h-16 rounded-3xl bg-accent-light border border-accent-border flex items-center justify-center text-accent mb-6 shadow-2xl shadow-accent/10">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-200 mb-2 tracking-tight">Create your first note</h2>
        <p className="text-zinc-500 dark:text-zinc-450 text-sm max-w-sm leading-relaxed mb-6">
          Write down your ideas, structure guides, checklists, or document workflows with clean markdown syntax.
        </p>
        <button
          onClick={() => createNote('Welcome to Notes', '# Start writing here\n\nType your notes in markdown!')}
          className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-all hover:scale-[1.02] shadow-lg shadow-accent/20 cursor-pointer animate-bounce"
        >
          Create Note
        </button>
      </div>
    );
  }

  const wordCount = getWordCount(content);
  const charCount = getCharacterCount(content);
  const readingTime = getReadingTime(content);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden transition-colors duration-300 relative">
      
      {/* Dynamic Cover Header Banner */}
      {activeNote.coverType && activeNote.coverType !== 'none' && (
        <div className="w-full h-36 relative overflow-hidden flex-shrink-0 group">
          {activeNote.coverType === 'gradient' && (
            <div className="w-full h-full" style={{ background: activeNote.coverValue }} />
          )}
          {activeNote.coverType === 'color' && (
            <div className="w-full h-full" style={{ backgroundColor: activeNote.coverValue }} />
          )}
          {activeNote.coverType === 'emoji' && (
            <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-900 text-6xl select-none">
              {activeNote.coverValue}
            </div>
          )}
          {activeNote.coverType === 'unsplash' && (
            <img src={activeNote.coverValue} alt="Cover Banner" className="w-full h-full object-cover" />
          )}

          {/* Remove / Change covers options inside overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-4 gap-2">
            <button
              onClick={() => setShowCoverSelector(!showCoverSelector)}
              className="py-1 px-3 bg-black/60 hover:bg-black text-white text-[10px] font-bold rounded-lg border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3 h-3" /> Change Cover
            </button>
            <button
              onClick={() => updateNoteCover(activeNote.id, 'none', '')}
              className="py-1 px-3 bg-black/60 hover:bg-rose-900/80 text-white text-[10px] font-bold rounded-lg border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      )}

      {/* Editor Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-100/80 dark:bg-zinc-900/40 backdrop-blur-md">
        
        {/* Navigation, title, cover add */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onShowSidebar}
            className="lg:hidden p-2 -ml-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Open Sidebar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col min-w-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="bg-transparent text-xl font-bold text-zinc-850 dark:text-zinc-100 outline-none placeholder-zinc-400 dark:placeholder-zinc-600 truncate max-w-xs sm:max-w-md focus:placeholder-zinc-500"
            />
            {/* Auto-save indicators */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {isSaving ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[9px] text-accent font-bold">Saving...</span>
                </>
              ) : unsavedChanges ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                  <span className="text-[9px] text-amber-600 dark:text-amber-400/80 font-bold">Unsaved changes</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-zinc-500 font-bold">
                    {lastSaved ? `Saved at ${lastSaved}` : 'All changes saved'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center gap-1.5 sm:self-center overflow-x-auto py-1 sm:py-0">
          
          {/* Cover add button if cover is none */}
          {(!activeNote.coverType || activeNote.coverType === 'none') && (
            <button
              onClick={() => setShowCoverSelector(!showCoverSelector)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-500 dark:text-zinc-400 border border-zinc-250 dark:border-white/5 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
              title="Add banner cover"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Add Cover</span>
            </button>
          )}

          {/* Voice transcription Mic */}
          <button
            onClick={handleMicToggle}
            className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${
              isListening
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'
                : 'bg-zinc-100 dark:bg-white/5 border-zinc-250 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
            }`}
            title={isListening ? 'Stop Listening' : 'Speech to text note'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening && <span className="text-[10px] font-bold">Listening</span>}
          </button>

          {/* Toggles edit views */}
          <div className="flex bg-zinc-200/50 dark:bg-white/5 rounded-xl p-0.5 border border-zinc-200 dark:border-white/5 mr-2">
            <button
              onClick={() => setEditorMode('edit')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                editorMode === 'edit'
                  ? 'bg-white dark:bg-zinc-800 text-accent shadow-md'
                  : 'text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => setEditorMode('preview')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                editorMode === 'preview'
                  ? 'bg-white dark:bg-zinc-800 text-accent shadow-md'
                  : 'text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => setEditorMode('split')}
              className={`hidden lg:flex p-1.5 rounded-lg text-xs font-bold items-center gap-1 transition-all cursor-pointer ${
                editorMode === 'split'
                  ? 'bg-white dark:bg-zinc-800 text-accent shadow-md'
                  : 'text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => togglePin(activeNote.id)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              activeNote.isPinned
                ? 'bg-accent-light border border-accent-border text-accent'
                : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
            }`}
          >
            <Pin className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={() => toggleFavorite(activeNote.id)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              activeNote.isFavorite
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
            }`}
          >
            <Star className={`w-4 h-4 ${activeNote.isFavorite ? 'fill-yellow-500 dark:fill-yellow-400' : ''}`} />
          </button>
          <button
            onClick={() => toggleArchive(activeNote.id)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              activeNote.isArchived
                ? 'bg-accent-light border border-accent-border text-accent'
                : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
            }`}
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => duplicateNote(activeNote.id)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-500 dark:text-zinc-400 border border-zinc-250 dark:border-white/5 transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Import / Export Controls */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".md,.txt"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-500 dark:text-zinc-400 border border-zinc-250 dark:border-white/5 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Export Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-500 dark:text-zinc-400 border border-zinc-250 dark:border-white/5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-white/10 shadow-2xl p-1 z-20">
                <button
                  onClick={() => {
                    exportNote(activeNote, 'md');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Export as Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    exportNote(activeNote, 'txt');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Export as Plain Text (.txt)
                </button>
              </div>
            )}
          </div>

          <div className="w-[1px] h-6 bg-zinc-250 dark:bg-white/10 mx-1" />

          {/* Permanent Delete */}
          <button
            onClick={() => onOpenDeleteConfirm(activeNote)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-rose-500/10 text-zinc-550 dark:text-zinc-400 hover:text-rose-605 dark:hover:text-rose-400 border border-zinc-200 dark:border-white/5 hover:border-rose-500/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Tags Pills widgets (below title input) */}
      <div className="px-6 py-2.5 bg-zinc-100/30 dark:bg-zinc-900/10 border-b border-zinc-200 dark:border-white/5 flex flex-wrap items-center gap-1.5 select-none">
        <TagIcon className="w-3.5 h-3.5 text-zinc-400 mr-1" />
        {(activeNote.tags || []).map(tag => (
          <span 
            key={tag} 
            className="pl-2.5 pr-1.5 py-0.5 rounded-lg bg-zinc-205 dark:bg-white/5 border border-zinc-250 dark:border-white/5 text-[10px] font-bold text-zinc-650 dark:text-zinc-450 flex items-center gap-1.5 hover:text-rose-500 hover:border-rose-500/20 dark:hover:text-rose-400 transition-colors group cursor-pointer"
            onClick={() => removeNoteTag(activeNote.id, tag)}
            title="Click to remove tag"
          >
            {tag}
            <X className="w-3 h-3 text-zinc-400 group-hover:text-rose-500 dark:group-hover:text-rose-400" />
          </span>
        ))}
        {/* Simple inline tag add form */}
        <form onSubmit={handleAddTagSubmit} className="flex items-center">
          <input
            type="text"
            value={tagInputValue}
            onChange={(e) => setTagInputValue(e.target.value)}
            placeholder="#topic..."
            className="bg-transparent text-[10px] font-bold text-zinc-800 dark:text-zinc-300 outline-none border border-transparent hover:border-zinc-200 focus:border-accent-border rounded-lg px-2 py-0.5 w-16 focus:w-24 transition-all placeholder-zinc-400"
          />
        </form>
      </div>

      {/* Editor Content Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Text editor column */}
        {(editorMode === 'edit' || editorMode === 'split') && (
          <div className="flex-1 h-full flex flex-col bg-zinc-50/20 dark:bg-zinc-950/20 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Start writing in markdown... Type '/' for Notion slash blocks inserter."
              className="flex-1 w-full h-full p-8 bg-transparent text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none font-mono text-sm leading-relaxed border-none focus:ring-0 select-text"
            />
            
            {/* Notion Slash command floating dropdown menu panel */}
            <AnimatePresence>
              {showSlashMenu && (
                <motion.div
                  ref={slashMenuRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-16 left-8 max-w-[280px] w-full rounded-2xl glass-panel shadow-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-1 z-35 flex flex-col max-h-[220px] overflow-y-auto"
                >
                  <div className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 px-3 py-1.5 uppercase tracking-wider border-b border-zinc-200 dark:border-white/5">
                    Notion Slash Inserter
                  </div>
                  {getFilteredSlashItems().map((item, idx) => {
                    const isSelected = slashIndex === idx;
                    return (
                      <div
                        key={item.name}
                        onClick={() => insertSlashTemplate(item.template)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-accent-light text-accent border border-accent-border' 
                            : 'border border-transparent text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="p-2 bg-zinc-150 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/5">
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-bold">{item.name}</span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 truncate">{item.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Split line separator */}
        {editorMode === 'split' && (
          <div className="w-[1px] h-full bg-zinc-200 dark:bg-white/5" />
        )}

        {/* Markdown preview panel */}
        {(editorMode === 'preview' || editorMode === 'split') && (
          <div className="flex-1 h-full bg-transparent overflow-hidden">
            <PreviewPanel content={content} />
          </div>
        )}
      </div>

      {/* Banner Cover Selector modal menu widget */}
      <AnimatePresence>
        {showCoverSelector && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
            <div 
              onClick={() => setShowCoverSelector(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              ref={coverMenuRef}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel shadow-2xl border border-white/10 p-6 bg-zinc-900"
            >
              <button
                onClick={() => setShowCoverSelector(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-accent" />
                Select Banner Cover Background
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {coversList.map((cov) => (
                  <div
                    key={cov.name}
                    onClick={() => {
                      updateNoteCover(activeNote.id, cov.type as any, cov.value);
                      setShowCoverSelector(false);
                    }}
                    className="p-1 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-accent-border cursor-pointer transition-all flex flex-col justify-between h-20 group relative overflow-hidden"
                  >
                    {cov.type === 'gradient' && (
                      <div className="w-full h-10 rounded-lg" style={{ background: cov.value }} />
                    )}
                    {cov.type === 'color' && (
                      <div className="w-full h-10 rounded-lg" style={{ backgroundColor: cov.value }} />
                    )}
                    {cov.type === 'emoji' && (
                      <div className="w-full h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-2xl select-none">
                        {cov.value}
                      </div>
                    )}
                    {cov.type === 'unsplash' && (
                      <img src={cov.value} alt="Preview cover thumbnail" className="w-full h-10 object-cover rounded-lg" />
                    )}
                    <span className="text-[9px] font-bold text-zinc-400 group-hover:text-zinc-200 text-center mt-1 truncate">
                      {cov.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer stats bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-zinc-200 dark:border-white/5 text-[11px] text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-900/20">
        <div className="flex items-center gap-4">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
          <span>{readingTime} min read</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-650" />
          <span>Notion Slash Command (/) supported</span>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;
