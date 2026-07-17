import React, { useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarViewProps {
  onSelectTab: (tab: 'notes' | 'dashboard' | 'calendar' | 'analytics') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onSelectTab }) => {
  const { notes, setActiveNoteId } = useNotes();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get month date parameters
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create list of days for grid
  const days = [];
  // Placeholders for previous month offset
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  // Get notes for a specific day
  const getNotesForDay = (date: Date) => {
    return notes.filter((n) => {
      const noteDate = new Date(n.createdAt);
      return (
        noteDate.getDate() === date.getDate() &&
        noteDate.getMonth() === date.getMonth() &&
        noteDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDayClick = (date: Date | null) => {
    if (date) setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleNoteClick = (id: string) => {
    setActiveNoteId(id);
    onSelectTab('notes');
  };

  const getMonthName = () => {
    return currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  };

  // Selected Day Notes
  const activeDayNotes = selectedDate ? getNotesForDay(selectedDate) : [];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 transition-colors duration-300">
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-accent" />
            Calendar View
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Browse and access notes by their creation dates.
          </p>
        </div>

        {/* Date Selector Header */}
        <div className="flex items-center gap-3 bg-zinc-150 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl p-1 shadow-sm">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-250 dark:hover:bg-white/5 transition-colors cursor-pointer text-zinc-650 dark:text-zinc-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 min-w-[120px] text-center">
            {getMonthName()}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-250 dark:hover:bg-white/5 transition-colors cursor-pointer text-zinc-650 dark:text-zinc-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Calendar Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex flex-col gap-4">
          
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;

              const notesCount = getNotesForDay(day).length;
              const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString();
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square relative rounded-xl border flex flex-col items-center justify-between p-2 cursor-pointer transition-all hover:scale-[1.03] ${
                    isSelected
                      ? 'bg-accent-light border border-accent-border text-accent shadow-md shadow-accent/5'
                      : isToday
                      ? 'bg-zinc-150 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-100 font-extrabold'
                      : 'bg-transparent border-transparent hover:bg-zinc-150/40 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <span className="text-xs font-semibold">{day.getDate()}</span>
                  
                  {/* Notes dots */}
                  {notesCount > 0 && (
                    <div className="flex gap-0.5 justify-center mt-1 flex-wrap max-w-full">
                      {Array.from({ length: Math.min(3, notesCount) }).map((_, dIdx) => (
                        <div 
                          key={dIdx} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-accent' : 'bg-accent/70'
                          }`} 
                        />
                      ))}
                      {notesCount > 3 && <span className="text-[7px] text-zinc-400 font-bold">+</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Selected Date Notes */}
        <div className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex flex-col gap-4">
          <div className="border-b border-zinc-200 dark:border-white/5 pb-3">
            <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">
              Notes for {selectedDate ? selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Selected Day'}
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {activeDayNotes.length} {activeDayNotes.length === 1 ? 'note created' : 'notes created'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[400px] pr-1">
            <AnimatePresence mode="popLayout">
              {activeDayNotes.length > 0 ? (
                activeDayNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleNoteClick(note.id)}
                    className="p-3.5 rounded-xl bg-zinc-150/40 dark:bg-white/5 hover:bg-zinc-200/50 dark:hover:bg-white/10 border border-zinc-250 dark:border-white/5 cursor-pointer transition-all hover:translate-x-1 group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-accent truncate">
                        {note.title || 'Untitled Note'}
                      </h5>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed mb-2">
                      {note.content.replace(/#+\s+/g, '').replace(/[*_`~]/g, '') || 'No content snippet.'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-zinc-550 dark:text-zinc-650 flex flex-col items-center gap-2">
                  <Calendar className="w-8 h-8 text-zinc-400 dark:text-zinc-700" />
                  <span>No notes created on this day.</span>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CalendarView;
