import React, { useRef, useEffect, useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useTheme, PREDEFINED_ACCENTS } from '../../context/ThemeContext';
import type { Note, Folder, SortOption, FilterOption } from '../../types';
import { 
  Search, 
  Plus, 
  Pin, 
  Star, 
  Archive, 
  Trash2, 
  Moon, 
  Sun,
  HelpCircle, 
  ArrowUpDown, 
  FileText,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Calendar,
  Sparkles,
  Tag,
  Download,
  FolderPlus,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface SidebarProps {
  activeTab: 'notes' | 'dashboard' | 'calendar' | 'analytics';
  onSelectTab: (tab: 'notes' | 'dashboard' | 'calendar' | 'analytics') => void;
  onOpenShortcuts: () => void;
  onOpenDeleteConfirm: (note: Note) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab,
  onSelectTab,
  onOpenShortcuts, 
  onOpenDeleteConfirm 
}) => {
  const {
    notes,
    folders,
    activeNoteId,
    searchQuery,
    sortBy,
    filterBy,
    setActiveNoteId,
    setSearchQuery,
    setSortBy,
    setFilterBy,
    createNote,
    createFolder,
    deleteFolder,
    togglePin,
    toggleFavorite,
    toggleArchive,
    moveNoteToFolder,
    moveFolder,
    exportBackup
  } = useNotes();

  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const accentPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accentPickerRef.current && !accentPickerRef.current.contains(e.target as Node)) {
        setShowAccentPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Folders expansion states: { [folderId]: boolean }
  const [expandedFolders, setExpandedFolders] = useState<{ [id: string]: boolean }>(() => {
    return { 'folder-getting-started': true, 'folder-projects': true };
  });

  const toggleFolderExpanded = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Focus search input when Ctrl+F is pressed
  useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onSelectTab('notes');
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, [onSelectTab]);

  // Aggregate unique tags matching all non-archived notes
  const getUniqueTags = () => {
    const allTags = notes
      .filter(n => !n.isArchived)
      .flatMap(n => n.tags);
    return Array.from(new Set(allTags));
  };
  const uniqueTags = getUniqueTags();

  // Drag and Drop listeners
  const handleDragStart = (e: React.DragEvent, type: 'note' | 'folder', id: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      
      if (data.type === 'note') {
        moveNoteToFolder(data.id, targetFolderId);
      } else if (data.type === 'folder') {
        moveFolder(data.id, targetFolderId);
      }
    } catch (err) {
      console.error('Dnd drop failed', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Filter notes based on active tab and search query
  const getFilteredNotes = () => {
    let result = [...notes];

    // Apply Filter Tab
    if (filterBy === 'pinned') {
      result = result.filter(n => n.isPinned && !n.isArchived);
    } else if (filterBy === 'favorites') {
      result = result.filter(n => n.isFavorite && !n.isArchived);
    } else if (filterBy === 'archived') {
      result = result.filter(n => n.isArchived);
    } else {
      result = result.filter(n => !n.isArchived);
    }

    // Apply Search Query (fuzzy matches content, tags, or title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        n => 
          n.title.toLowerCase().includes(query) || 
          n.content.toLowerCase().includes(query) ||
          n.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply Sorting
    result.sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Pinned notes bubble to top if filter is 'all'
    if (filterBy === 'all' && !searchQuery.trim()) {
      result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    }

    return result;
  };

  const filteredNotes = getFilteredNotes();

  const handleNoteCardClick = (id: string) => {
    setActiveNoteId(id);
    onSelectTab('notes');
  };

  const formatNoteDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const cleanSnippet = (content: string) => {
    const plain = content
      .replace(/#+\s+/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*_`~]/g, '')
      .trim();
    return plain || 'No content preview.';
  };

  // Helper: Recursive folders node builder
  const renderFolderNode = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders[folder.id];
    const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isArchived);
    const childFolders = folders.filter(f => f.parentId === folder.id);

    return (
      <div 
        key={folder.id} 
        className="flex flex-col select-none"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, folder.id)}
      >
        {/* Folder Header Row */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          className="group flex items-center justify-between py-1.5 pr-2 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 cursor-pointer text-zinc-700 dark:text-zinc-300"
        >
          <div 
            onClick={() => toggleFolderExpanded(folder.id)}
            className="flex items-center gap-1.5 flex-1 min-w-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <FolderOpen className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="text-xs font-semibold truncate">{folder.name}</span>
          </div>

          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                const name = prompt('Enter new folder name:');
                if (name) createFolder(name, folder.id);
              }}
              title="Add subfolder"
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete folder "${folder.name}" recursively?`)) deleteFolder(folder.id);
              }}
              title="Delete folder"
              className="p-1 text-zinc-400 hover:text-rose-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Folder Children List */}
        {isExpanded && (
          <div className="flex flex-col border-l border-zinc-200 dark:border-white/5 ml-3">
            {childFolders.map(child => renderFolderNode(child, level + 1))}
            {folderNotes.map(n => (
              <div
                key={n.id}
                draggable
                onDragStart={(e) => handleDragStart(e, 'note', n.id)}
                onClick={() => handleNoteCardClick(n.id)}
                style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
                className={`py-1 pr-2 text-xs font-medium cursor-pointer truncate rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeNoteId === n.id
                    ? 'bg-accent-light text-accent'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-250/50 dark:hover:bg-white/5'
                }`}
              >
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{n.title || 'Untitled Note'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-r border-zinc-200 dark:border-white/5 flex flex-col h-full bg-zinc-50/90 dark:bg-zinc-950/60 backdrop-blur-md transition-colors duration-300">
      
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent-light border border-accent-border flex items-center justify-center text-accent font-extrabold text-lg shadow-inner">
            M
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-base tracking-tight">MD Notes</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative" ref={accentPickerRef}>
            <button
              onClick={() => setShowAccentPicker(!showAccentPicker)}
              title="Customize Accent Color"
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Palette className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showAccentPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl p-4 z-40 border border-zinc-250 dark:border-white/10 bg-white dark:bg-zinc-900"
                >
                  <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
                    Accent Color
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {Object.keys(PREDEFINED_ACCENTS).map((colorName) => {
                      const info = PREDEFINED_ACCENTS[colorName];
                      const isSelected = accentColor.toLowerCase() === colorName;
                      return (
                        <button
                          key={colorName}
                          onClick={() => {
                            setAccentColor(colorName);
                            setShowAccentPicker(false);
                          }}
                          title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                          className="w-8 h-8 rounded-full border border-zinc-300 dark:border-white/10 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 relative"
                          style={{ backgroundColor: info.accent }}
                        >
                          {isSelected && (
                            <span className="text-white drop-shadow font-bold text-xs">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-zinc-200 dark:border-white/5 pt-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-450">Custom Color</span>
                    <label className="w-8 h-8 rounded-full border border-zinc-300 dark:border-white/10 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 relative overflow-hidden"
                      style={{ background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }}
                    >
                      <input
                        type="color"
                        value={accentColor.startsWith('#') ? accentColor : '#06b6d4'}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {!Object.keys(PREDEFINED_ACCENTS).includes(accentColor.toLowerCase()) && accentColor.startsWith('#') && (
                        <span className="text-white drop-shadow font-bold text-xs z-10">✓</span>
                      )}
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Tab Navigation Docks */}
      <div className="px-4 py-2.5 grid grid-cols-4 gap-1 border-b border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-black/10">
        {[
          { id: 'dashboard', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Home' },
          { id: 'notes', icon: <FileText className="w-3.5 h-3.5" />, label: 'Notes', idAttr: 'tab-notes' },
          { id: 'calendar', icon: <Calendar className="w-3.5 h-3.5" />, label: 'Dates' },
          { id: 'analytics', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Stats' }
        ].map((tab) => (
          <button
            key={tab.id}
            id={tab.idAttr}
            onClick={() => onSelectTab(tab.id as any)}
            className={`py-1.5 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                : 'text-zinc-450 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Primary Notes workspace view */}
      {activeTab === 'notes' ? (
        <>
          {/* Action buttons & search */}
          <div className="p-4 flex flex-col gap-2.5 border-b border-zinc-200 dark:border-white/5">
            <div className="flex gap-2">
              <button
                onClick={() => createNote()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-accent/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Note
              </button>
              <button
                onClick={() => {
                  const name = prompt('Folder Name:');
                  if (name) createFolder(name, null);
                }}
                title="New Folder"
                className="p-2.5 rounded-xl bg-zinc-200/50 dark:bg-white/5 border border-zinc-250 dark:border-white/5 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-850 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Fuzzy Search... (Ctrl+F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-zinc-200/50 dark:bg-white/5 hover:bg-zinc-200/80 dark:hover:bg-white/[0.07] focus:bg-white dark:focus:bg-white/10 border border-zinc-200 dark:border-white/5 focus:border-accent-border text-zinc-800 dark:text-zinc-200 placeholder-zinc-450 dark:placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Folder trees block */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
            className="px-2 py-3 border-b border-zinc-200 dark:border-white/5 max-h-[220px] overflow-y-auto"
          >
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-3 pb-1.5 uppercase tracking-wider">
              Folders
            </div>
            {folders.filter(f => f.parentId === null).map(folder => renderFolderNode(folder))}
          </div>

          {/* Filter subtabs */}
          <div className="px-4 py-2 flex gap-1 border-b border-zinc-200 dark:border-white/5 overflow-x-auto">
            {(['all', 'pinned', 'favorites', 'archived'] as FilterOption[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterBy(tab)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  filterBy === tab
                    ? 'bg-accent-light text-accent border border-accent-border'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-250/50 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sorting row */}
          <div className="px-4 py-1.5 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 text-[10px] text-zinc-500">
            <span className="font-semibold text-zinc-400">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            </span>
            <div className="relative flex items-center gap-1 cursor-pointer group">
              <ArrowUpDown className="w-3 h-3 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200 outline-none cursor-pointer pr-1 appearance-none relative z-10 font-bold"
              >
                <option value="updated" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">Recently Updated</option>
                <option value="created" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">Created Date</option>
                <option value="alphabetical" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Notes list cards */}
          <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
            <LayoutGroup>
              <AnimatePresence initial={false}>
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layoutId={note.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group relative p-3 rounded-xl cursor-pointer border transition-all ${
                      activeNoteId === note.id
                        ? 'bg-accent/5 border border-accent-border text-zinc-800 dark:text-zinc-100 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                    onClick={() => handleNoteCardClick(note.id)}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, 'note', note.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-xs truncate pr-1">
                        {note.title.trim() || 'Untitled Note'}
                      </h4>
                      <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                          className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 ${
                            note.isPinned ? 'text-accent' : 'text-zinc-400 hover:text-zinc-700'
                          }`}
                        >
                          <Pin className="w-3 h-3 fill-current" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id); }}
                          className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 ${
                            note.isFavorite ? 'text-yellow-500 dark:text-yellow-400' : 'text-zinc-400 hover:text-zinc-700'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${note.isFavorite ? 'fill-yellow-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleArchive(note.id); }}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-755 transition-colors"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenDeleteConfirm(note); }}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate mb-1 leading-normal">
                      {cleanSnippet(note.content)}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-zinc-450">
                      <span>{formatNoteDate(note.updatedAt)}</span>
                      <div className="flex items-center gap-1">
                        {note.isPinned && <Pin className="w-2.5 h-2.5 text-accent fill-current" />}
                        {note.isFavorite && <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </LayoutGroup>
          </div>

          {/* Tags Cloud Widget at bottom */}
          {uniqueTags.length > 0 && (
            <div className="p-3 border-t border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-black/10">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3 h-3" /> Filter by Tags
              </span>
              <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto">
                {uniqueTags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => setSearchQuery(searchQuery.includes(tag) ? '' : tag)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                      searchQuery.includes(tag)
                        ? 'bg-accent-light text-accent border border-accent-border'
                        : 'bg-zinc-200 dark:bg-white/5 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* JSON Backup Button */}
          <div className="p-3 border-t border-zinc-200 dark:border-white/5 flex gap-2">
            <button
              onClick={exportBackup}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer border border-zinc-300 dark:border-white/5"
            >
              <Download className="w-3.5 h-3.5" />
              Backup database
            </button>
          </div>
        </>
      ) : (
        /* Navigation fallback indicators when non-notes tab is loaded */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-450">
          <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-800 mb-2" />
          <span className="text-xs font-semibold">Active view: {activeTab}</span>
          <button 
            onClick={() => onSelectTab('notes')}
            className="mt-4 text-xs font-bold text-accent hover:underline cursor-pointer"
          >
            Go to Notes Workspace
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
