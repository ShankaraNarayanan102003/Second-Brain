export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  content: string; // Rich text / HTML
  noteDate: string; // YYYY-MM-DD
  noteTime: string; // HH:mm
  category: string;
  tags: string[];
  people: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
}

export type NotesTabId =
  | 'all'
  | 'categories'
  | 'tags'
  | 'pinned'
  | 'favorites'
  | 'recent';

export type NotesDateFilterType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export const DEFAULT_CATEGORIES: string[] = [
  'Personal',
  'Work',
  'Study',
  'Ideas',
  'Planning',
  'Finance',
  'Other'
];

export const SUGGESTED_TAGS: string[] = [
  '#Ideas',
  '#Important',
  '#Learning',
  '#Projects',
  '#Brainstorm',
  '#Reference',
  '#Actionable'
];
