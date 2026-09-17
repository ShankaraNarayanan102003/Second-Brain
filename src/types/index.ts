export type SubpageId = 
  | 'home'
  | 'calendar'
  | 'reminisce'
  | 'quotes'
  | 'notes'
  | 'habits'
  | 'finances'
  | 'todo';

export type TodoSectionId = 'task' | 'event' | 'goal';

export type ThemeMode = 'dark' | 'light';

export interface SubpageConfig {
  id: SubpageId;
  label: string;
  description: string;
  iconName: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}
