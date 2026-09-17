export interface MemoryItem {
  id: string;
  userId: string;
  title: string;
  notes: string;
  memoryDate: string; // YYYY-MM-DD
  memoryTime?: string; // HH:mm
  createdAt: number; // Timestamp in ms
  mood: string; // Emoji e.g. '😀'
  people: string[]; // List of person names
  isPrivate: boolean;
  isPinned: boolean;
  isFavorite: boolean;
}

export interface PersonItem {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
}

export interface MoodDefinition {
  name: string;
  emoji: string;
}

export const FIVE_MOODS: MoodDefinition[] = [
  { name: 'Happy', emoji: '🥰' },
  { name: 'Sad', emoji: '😢' },
  { name: 'Anger', emoji: '😤' },
  { name: 'Love', emoji: '💜' },
  { name: 'Surprise', emoji: '🤯' }
];

export const ALL_MOOD_EMOJIS = FIVE_MOODS.map((m) => m.emoji);

export type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
export type TimelineSortOrder = 'newest' | 'oldest';
export type ReminisceTabId =
  | 'all'
  | 'favorites'
  | 'anniversaries'
  | 'timeline'
  | 'mood'
  | 'people';
