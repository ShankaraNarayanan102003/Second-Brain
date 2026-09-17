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

export interface MoodCategory {
  label: string;
  emojis: string[];
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    label: 'Happy / Joyful',
    emojis: ['😀', '😄', '🥰']
  },
  {
    label: 'Sad / Down',
    emojis: ['😢', '😔', '😞']
  },
  {
    label: 'Angry / Frustrated',
    emojis: ['😤', '😡']
  },
  {
    label: 'Tired / Sleepy',
    emojis: ['😴', '🥱', '😪']
  },
  {
    label: 'Confused / Neutral',
    emojis: ['😕', '😐', '🙄']
  }
];

export const ALL_MOOD_EMOJIS = MOOD_CATEGORIES.flatMap((c) => c.emojis);

export type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
export type TimelineSortOrder = 'newest' | 'oldest';
export type ReminisceTabId =
  | 'all'
  | 'favorites'
  | 'anniversaries'
  | 'timeline'
  | 'mood'
  | 'people';
