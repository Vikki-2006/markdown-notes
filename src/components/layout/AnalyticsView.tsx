import React from 'react';
import { useNotes } from '../../context/NotesContext';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  FileText, 
  Flame, 
  BookOpen, 
  Activity 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AnalyticsView: React.FC = () => {
  const { notes } = useNotes();

  // Helper: Get word count of note content
  const getWordCount = (str: string): number => {
    if (!str.trim()) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  };

  // Compile last 7 days of writing statistics for charts
  const getChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const wordsWritten = notes.reduce((sum, n) => sum + (n.wordCountHistory?.[dateStr] || 0), 0);
      
      data.push({
        date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        words: wordsWritten
      });
    }
    return data;
  };
  const chartData = getChartData();

  // 1. Calculations: words today
  const todayStr = new Date().toISOString().split('T')[0];
  const wordsToday = notes.reduce((sum, n) => sum + (n.wordCountHistory?.[todayStr] || 0), 0);

  // 2. Calculations: words this week (sum of last 7 days)
  const wordsThisWeek = chartData.reduce((sum, item) => sum + item.words, 0);

  // 3. Calculations: words this month (sum of last 30 days)
  const getWordsThisMonth = () => {
    const now = new Date();
    let sum = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      sum += notes.reduce((acc, n) => acc + (n.wordCountHistory?.[dateStr] || 0), 0);
    }
    return sum;
  };
  const wordsThisMonth = getWordsThisMonth();

  // 4. Longest Note Details
  const getLongestNote = () => {
    if (notes.length === 0) return { title: 'None', words: 0 };
    const sorted = [...notes].sort((a, b) => getWordCount(b.content) - getWordCount(a.content));
    return {
      title: sorted[0].title || 'Untitled Note',
      words: getWordCount(sorted[0].content)
    };
  };
  const longestNote = getLongestNote();

  // 5. Average Reading Time (average word count / 200)
  const getAverageReadingTime = () => {
    if (notes.length === 0) return 0;
    const totalWords = notes.reduce((sum, n) => sum + getWordCount(n.content), 0);
    const avgWords = totalWords / notes.length;
    return Math.max(1, Math.ceil(avgWords / 200));
  };
  const avgReadingTime = getAverageReadingTime();

  // 6. Streak counter
  const getWritingStreak = () => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const wordsOnDay = notes.reduce((sum, n) => sum + (n.wordCountHistory?.[dateStr] || 0), 0);
      if (wordsOnDay > 0) {
        streak++;
      } else {
        break; // break streak on first inactive day
      }
    }
    return streak;
  };
  const currentStreak = getWritingStreak();

  // Custom tooltips matching dark cyan glass panels
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-zinc-900/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
          <p className="text-xs font-semibold text-accent mt-1">
            {payload[0].value} words written
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 transition-colors duration-300">
      
      {/* Header Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          Writing Analytics
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Detailed metrics, word goals, reading statistics, and writing chart logs.
        </p>
      </div>

      {/* Grid: Metric highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Streak Counter Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex items-center gap-4"
        >
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Flame className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Streak</span>
            <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </h3>
            <p className="text-[10px] text-zinc-450 mt-0.5">Continuous days of writing</p>
          </div>
        </motion.div>

        {/* Avg Reading Time */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex items-center gap-4"
        >
          <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Avg. Reading Time</span>
            <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">
              {avgReadingTime} {avgReadingTime === 1 ? 'min' : 'mins'}
            </h3>
            <p className="text-[10px] text-zinc-450 mt-0.5">Estimated per note doc</p>
          </div>
        </motion.div>

        {/* Longest Note */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex items-center gap-4"
        >
          <div className="p-3.5 bg-accent-light text-accent rounded-xl border border-accent-border">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Longest Note</span>
            <h3 className="text-sm font-bold text-zinc-805 dark:text-zinc-200 truncate mt-0.5" title={longestNote.title}>
              {longestNote.title}
            </h3>
            <p className="text-[10px] text-zinc-450 mt-0.5">{longestNote.words} words total</p>
          </div>
        </motion.div>

      </div>

      {/* Analytics Chart Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column (2/3 width) */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Writing Performance
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Word counts generated over the last 7 days</p>
            </div>
          </div>

          <div className="w-full h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-border)', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="words" 
                  stroke="var(--accent)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWords)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Counts Logs Grid */}
        <div className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-white/5 flex flex-col justify-between gap-5">
          <div className="border-b border-zinc-200 dark:border-white/5 pb-3">
            <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Writing Output Stats</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">Aggregated words logs breakdown</p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: 'Words Today', value: wordsToday, percentage: wordsToday > 0 ? 100 : 0, color: 'bg-accent' },
              { label: 'Words This Week', value: wordsThisWeek, percentage: Math.min(100, (wordsThisWeek / 1500) * 100), color: 'bg-indigo-500', goal: '1.5k goal' },
              { label: 'Words This Month', value: wordsThisMonth, percentage: Math.min(100, (wordsThisMonth / 6000) * 100), color: 'bg-purple-500', goal: '6k goal' }
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-450 dark:text-zinc-400">{item.label}</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {item.value} {item.goal && <span className="text-[9px] text-zinc-500 font-normal">/ {item.goal}</span>}
                  </span>
                </div>
                {/* Progress bar line */}
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${Math.max(5, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-zinc-500 leading-relaxed bg-zinc-150/50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 p-3.5 rounded-xl mt-2">
            💡 **Tip**: Create nested folders and use tags to group document items, allowing faster filtering across your charts!
          </div>

        </div>

      </div>

    </div>
  );
};

export default AnalyticsView;
