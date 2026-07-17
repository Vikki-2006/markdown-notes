import type { Note } from '../types';

export function getWordCount(content: string): number {
  if (!content.trim()) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function getCharacterCount(content: string): number {
  return content.length;
}

export function getReadingTime(content: string): number {
  const words = getWordCount(content);
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function exportNote(note: Note, format: 'txt' | 'md') {
  const filename = `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'untitled'}.${format}`;
  const content = format === 'md' ? note.content : getPlainTextFromMarkdown(note.content);
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to strip markdown formatting for plain text export
function getPlainTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/#+\s+/g, '') // strip headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // strip links, keep text
    .replace(/[*_`~]/g, '') // strip basic style indicators
    .replace(/-\s+/g, '') // strip list bullets
    .replace(/^\s*\d+\.\s+/gm, ''); // strip ordered lists
}
