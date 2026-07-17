export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // For nested folders
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  folderId: string | null; // Associated folder
  tags: string[]; // List of tags (e.g. ['#React', '#Projects'])
  coverType: 'none' | 'gradient' | 'color' | 'unsplash' | 'emoji';
  coverValue: string; // CSS style gradient, solid color hex, emoji char, or Unsplash URL
  wordCountHistory?: { [dateStr: string]: number }; // History of word counts e.g. { "2026-07-17": 320 }
}

export type SortOption = 'updated' | 'created' | 'alphabetical';
export type FilterOption = 'all' | 'favorites' | 'archived' | 'pinned';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export type ThemeOption = 'light' | 'dark';
