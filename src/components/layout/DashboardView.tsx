import React from 'react';
import { useNotes } from '../../context/NotesContext';
import type { Note } from '../../types';
import { 
  FileText, 
  Pin, 
  Star, 
  Archive, 
  Flame, 
  PenTool, 
  Clock, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardViewProps {
  onSelectTab: (tab: 'notes' | 'dashboard' | 'calendar' | 'analytics') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTab }) => {
  const { notes, setActiveNoteId } = useNotes();

  // Get current greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning ☀️';
    if (hr < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  // Stats Calculations
  const totalNotes = notes.length;
  const pinnedNotes = notes.filter(n => n.isPinned && !n.isArchived).length;
  const favoriteNotes = notes.filter(n => n.isFavorite && !n.isArchived).length;
  const archivedNotes = notes.filter(n => n.isArchived).length;

  // Words Written Today Tracker
  const todayStr = new Date().toISOString().split('T')[0];
  const wordsWrittenToday = notes.reduce((sum, n) => sum + (n.wordCountHistory?.[todayStr] || 0), 0);

  // Get Most Edited Note (longest content length or updated most)
  const getMostEditedNote = (): Note | null => {
    if (notes.length === 0) return null;
    return [...notes].sort((a, b) => b.content.length - a.content.length)[0];
  };
  const mostEditedNote = getMostEditedNote();

  // Get Recent Activity (3 recently updated notes)
  const recentNotes = [...notes]
    .filter(n => !n.isArchived)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // Get Weekly Writing Streak indicators
  const getWeeklyStreak = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const wordsOnDay = notes.reduce((sum, n) => sum + (n.wordCountHistory?.[dateStr] || 0), 0);
      days.push({
        label: d.toLocaleDateString([], { weekday: 'narrow' }),
        dateStr,
        active: wordsOnDay > 0,
        words: wordsOnDay
      });
    }
    return days;
  };
  const weeklyStreak = getWeeklyStreak();
  const streakCount = [...weeklyStreak].reverse().reduce((acc, curr) => {
    if (curr.active && acc.shouldCount) {
      acc.count += 1;
    } else {
      acc.shouldCount = false;
    }
    return acc;
  }, { count: 0, shouldCount: true }).count;

  const handleNoteClick = (id: string) => {
    setActiveNoteId(id);
    onSelectTab('notes');
  };

  const getWordCount = (str: string) => {
    if (!str.trim()) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 transition-colors duration-300">
      
      {/* Dynamic Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-zinc-200 dark:border-white/5"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-light rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Welcome back. You have written <span className="font-semibold text-accent">{wordsWrittenToday} words</span> today.
          </p>
        </div>

        <button
          onClick={() => handleNoteClick('')}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs transition-all hover:scale-[1.02] shadow-lg shadow-accent/20 self-start md:self-auto cursor-pointer"
        >
          <PenTool className="w-3.5 h-3.5" />
          Quick Write Note
        </button>
      </motion.div>

      {/* Grid: Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Notes', value: totalNotes, icon: <FileText className="w-5 h-5 text-accent" /> },
          { label: 'Pinned Notes', value: pinnedNotes, icon: <Pin className="w-5 h-5 text-indigo-500" /> },
          { label: 'Favorites', value: favoriteNotes, icon: <Star className="w-5 h-5 text-yellow-500" /> },
          { label: 'Archived', value: archivedNotes, icon: <Archive className="w-5 h-5 text-zinc-500" /> }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-5 rounded-2xl glass-panel shadow-sm flex items-center justify-between border border-zinc-200 dark:border-white/5 hover:border-accent-border transition-all hover:translate-y-[-2px]"
          >
            <div>
              <span className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">{stat.value}</h3>
            </div>
            <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Double-Col Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Writing streak visual tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                <Flame className="w-6 h-6 fill-current animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-850 dark:text-zinc-200">Writing Streak</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
                  Keep writing every day to maintain your streak!
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex gap-2">
                {weeklyStreak.map((day) => (
                  <div key={day.dateStr} className="flex flex-col items-center gap-1.5" title={`${day.words} words written`}>
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${
                        day.active 
                          ? 'bg-accent-light text-accent border border-accent-border' 
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-650 border-zinc-200 dark:border-white/5'
                      }`}
                    >
                      {day.label}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                Current Streak: <span className="font-bold text-amber-500">{streakCount} days</span>
              </span>
            </div>
          </motion.div>

          {/* Recent Activity lists */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-zinc-850 dark:text-zinc-200">Recent Activity</h4>
              <button 
                onClick={() => onSelectTab('notes')}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                View all notes <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentNotes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note.id)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-100/50 dark:bg-white/5 hover:bg-zinc-200/50 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/5 cursor-pointer transition-all hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 bg-accent-light text-accent rounded-lg border border-accent-border">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {note.title || 'Untitled Note'}
                        </h5>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {getWordCount(note.content)} words • Edited {new Date(note.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-zinc-550 dark:text-zinc-600">
                No recent notes found. Start by writing something!
              </div>
            )}
          </motion.div>

        </div>

        {/* Right Single-Col Column */}
        <div>
          {/* Most Edited Note highlight card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex flex-col justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-2 text-accent mb-3">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Featured Note</span>
              </div>
              <h4 className="text-base font-bold text-zinc-850 dark:text-zinc-200">Most Active Note</h4>
              <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1">
                The note with your most extensive content and documentation.
              </p>
            </div>

            {mostEditedNote ? (
              <div 
                onClick={() => handleNoteClick(mostEditedNote.id)}
                className="group relative p-4 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 cursor-pointer hover:border-accent-border transition-all flex flex-col justify-between h-48"
              >
                <div>
                  <h5 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-accent transition-colors truncate">
                    {mostEditedNote.title || 'Untitled Note'}
                  </h5>
                  <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-1 line-clamp-3 leading-relaxed">
                    {mostEditedNote.content.replace(/#+\s+/g, '').replace(/[*_`~]/g, '') || 'No content preview.'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-200 dark:border-white/5 pt-2.5 mt-2">
                  <span>{getWordCount(mostEditedNote.content)} words</span>
                  <span className="flex items-center gap-1 text-accent font-semibold group-hover:underline">
                    Edit Note <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/5 rounded-xl text-xs text-zinc-550 dark:text-zinc-600">
                Create a note to feature it here.
              </div>
            )}
          </motion.div>
        </div>

      </div>

    </div>
  );
};

export default DashboardView;
