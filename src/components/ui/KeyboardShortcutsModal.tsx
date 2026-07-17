import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    { keys: ['Ctrl', 'K'], action: 'Open VS-Code style Command Palette' },
    { keys: ['Ctrl', 'N'], action: 'Create a new note instantly' },
    { keys: ['Ctrl', 'S'], action: 'Save current active note manually' },
    { keys: ['Ctrl', 'F'], action: 'Focus sidebar note search input' },
    { keys: ['Ctrl', 'Shift', 'D'], action: 'Duplicate currently selected note' },
    { keys: ['Ctrl', 'Shift', 'A'], action: 'Archive / Restore selected note' },
    { keys: ['Esc'], action: 'Close all open menus and dialog modals' },
    { keys: ['Delete'], action: 'Delete note (if editor is not active)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel shadow-2xl border border-white/10 p-6 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex gap-3 items-center mb-6">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-550 dark:text-cyan-400 border border-cyan-500/20">
                <Keyboard className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Keyboard Shortcuts</h3>
            </div>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-colors"
                >
                  <span className="text-xs text-zinc-750 dark:text-zinc-300 font-medium">{shortcut.action}</span>
                  <div className="flex gap-1 items-center flex-shrink-0">
                    {shortcut.keys.map((key, keyIdx) => (
                      <React.Fragment key={keyIdx}>
                        {keyIdx > 0 && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">+</span>}
                        <kbd className="px-2 py-0.5 text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 rounded-lg border-b-2 border-zinc-400 dark:border-zinc-950 font-mono shadow-md">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 py-2.5 text-sm font-medium rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-350 dark:hover:bg-zinc-700 text-zinc-855 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors border border-zinc-300 dark:border-white/5 cursor-pointer"
            >
              Close Cheatsheet
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;
