import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MemoryItem, PersonItem } from '../types/reminisce';
import { getTodayDateString } from '../utils/reminisceUtils';

const MEMORIES_STORAGE_KEY = 'sb_reminisce_memories_';
const PEOPLE_STORAGE_KEY = 'sb_reminisce_people_';

function getLocalMemories(userId: string): MemoryItem[] {
  try {
    const raw = localStorage.getItem(MEMORIES_STORAGE_KEY + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalMemories(userId: string, memories: MemoryItem[]) {
  try {
    localStorage.setItem(MEMORIES_STORAGE_KEY + userId, JSON.stringify(memories));
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }
}

function getLocalPeople(userId: string): PersonItem[] {
  try {
    const raw = localStorage.getItem(PEOPLE_STORAGE_KEY + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalPeople(userId: string, people: PersonItem[]) {
  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY + userId, JSON.stringify(people));
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }
}

/**
 * Generates initial rich starter memories if a user starts with an empty slate,
 * including an anniversary match for today's date and a sample private memory.
 */
function getInitialStarterMemories(userId: string): { memories: MemoryItem[]; people: PersonItem[] } {
  const today = getTodayDateString();
  const [currentYear, mm, dd] = today.split('-');
  const prevYear = String(Number(currentYear) - 1);
  const anniversaryDate = `${prevYear}-${mm}-${dd}`;

  const initialPeople: PersonItem[] = [
    { id: 'p1', userId, name: 'Maya Lin', createdAt: Date.now() - 30 * 86400000 },
    { id: 'p2', userId, name: 'Alexander Wright', createdAt: Date.now() - 60 * 86400000 },
    { id: 'p3', userId, name: 'Elena Rostova', createdAt: Date.now() - 90 * 86400000 }
  ];

  const initialMemories: MemoryItem[] = [
    {
      id: 'm-anniversary',
      userId,
      title: 'Dawn hike to the Golden Ridge Summit with Alexander and Maya',
      notes: 'We reached the peak just as the morning sun illuminated the entire valley in liquid gold. A moment of pristine clarity and shared purpose that I will remember forever.',
      memoryDate: anniversaryDate,
      memoryTime: '06:15',
      createdAt: Date.now() - 365 * 86400000,
      mood: '🥰',
      people: ['Alexander Wright', 'Maya Lin'],
      isPrivate: false,
      isPinned: true,
      isFavorite: true
    },
    {
      id: 'm-today',
      userId,
      title: 'Launching the SECOND BRAIN Architecture and personal knowledge sanctuary',
      notes: 'Finalized the core foundations of the personal knowledge vault. Stepping into this new chapter with discipline, high aesthetic standards, and deep creative focus.',
      memoryDate: today,
      memoryTime: '13:00',
      createdAt: Date.now() - 2 * 3600000, // 2 hours ago (triggers first 24h elapsed time display)
      mood: '😄',
      people: ['Elena Rostova'],
      isPrivate: false,
      isPinned: true,
      isFavorite: true
    },
    {
      id: 'm-private',
      userId,
      title: 'Personal breakthrough reflection on life philosophy and quiet goals',
      notes: 'A private reflection on letting go of external expectations and constructing meaningful personal projects from the inside out.',
      memoryDate: today,
      memoryTime: '11:30',
      createdAt: Date.now() - 4 * 3600000,
      mood: '😀',
      people: [],
      isPrivate: true,
      isPinned: false,
      isFavorite: false
    }
  ];

  return { memories: initialMemories, people: initialPeople };
}

/**
 * Subscribes to memories for a user.
 * Tries Firestore first; falls back to localStorage if Firestore is not provisioned or offline.
 */
export function subscribeMemories(
  userId: string,
  onUpdate: (memories: MemoryItem[]) => void
): () => void {
  let localMemories = getLocalMemories(userId);

  // If first time and completely empty, populate sample memories
  if (localMemories.length === 0) {
    const { memories, people } = getInitialStarterMemories(userId);
    setLocalMemories(userId, memories);
    setLocalPeople(userId, people);
    localMemories = memories;
  }

  onUpdate(localMemories);

  if (!db || userId === 'guest_user') {
    return () => {};
  }

  try {
    const memoriesRef = collection(db, 'users', userId, 'memories');
    const q = query(memoriesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreMemories: MemoryItem[] = [];
          snapshot.forEach((docSnap) => {
            firestoreMemories.push({ id: docSnap.id, ...(docSnap.data() as Omit<MemoryItem, 'id'>) });
          });
          setLocalMemories(userId, firestoreMemories);
          onUpdate(firestoreMemories);
        } else if (localMemories.length > 0) {
          // If Firestore collection is empty, seed it with local memories
          localMemories.forEach(async (m) => {
            try {
              await setDoc(doc(db!, 'users', userId, 'memories', m.id), m);
            } catch {
              // ignore seed errors
            }
          });
        }
      },
      (error) => {
        console.warn('Firestore subscription fallback to local cache:', error);
        onUpdate(getLocalMemories(userId));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore error, using local storage for memories:', err);
    return () => {};
  }
}

/**
 * Subscribes to the people list for a user.
 */
export function subscribePeople(
  userId: string,
  onUpdate: (people: PersonItem[]) => void
): () => void {
  let localPeople = getLocalPeople(userId);
  if (localPeople.length === 0) {
    const { people } = getInitialStarterMemories(userId);
    setLocalPeople(userId, people);
    localPeople = people;
  }

  onUpdate(localPeople);

  if (!db || userId === 'guest_user') {
    return () => {};
  }

  try {
    const peopleRef = collection(db, 'users', userId, 'people');
    const q = query(peopleRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestorePeople: PersonItem[] = [];
          snapshot.forEach((docSnap) => {
            firestorePeople.push({ id: docSnap.id, ...(docSnap.data() as Omit<PersonItem, 'id'>) });
          });
          setLocalPeople(userId, firestorePeople);
          onUpdate(firestorePeople);
        } else if (localPeople.length > 0) {
          localPeople.forEach(async (p) => {
            try {
              await setDoc(doc(db!, 'users', userId, 'people', p.id), p);
            } catch {
              // ignore seed errors
            }
          });
        }
      },
      (error) => {
        console.warn('Firestore people fallback to local cache:', error);
        onUpdate(getLocalPeople(userId));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore error, using local storage for people:', err);
    return () => {};
  }
}

function sanitizeForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = value;
    } else {
      sanitized[key] = '';
    }
  }
  return sanitized;
}

export interface SaveMemoryResult {
  memory: MemoryItem;
  firestoreSynced: boolean;
  firestoreNote?: string;
}

export interface UpdateMemoryResult {
  memory: MemoryItem;
  firestoreSynced: boolean;
  firestoreNote?: string;
}

export interface DeleteMemoryResult {
  firestoreSynced: boolean;
  firestoreNote?: string;
}

/**
 * Adds a new memory with validation and Firestore sync.
 */
export async function addMemory(
  userId: string,
  memoryData: Omit<MemoryItem, 'id' | 'userId' | 'createdAt'>
): Promise<SaveMemoryResult> {
  if (!memoryData.title || !memoryData.title.trim()) {
    throw new Error('Title is required to save a memory.');
  }
  if (!memoryData.memoryDate) {
    throw new Error('Memory date is required.');
  }

  const newId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newMemory: MemoryItem = {
    ...memoryData,
    title: memoryData.title.trim(),
    notes: memoryData.notes ? memoryData.notes.trim() : '',
    memoryTime: memoryData.memoryTime || '',
    id: newId,
    userId,
    createdAt: Date.now()
  };

  // Immediate local update for instant responsiveness
  const current = getLocalMemories(userId);
  const updated = [newMemory, ...current.filter((m) => m.id !== newId)];
  setLocalMemories(userId, updated);

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  // Attempt Firestore sync
  if (db) {
    try {
      const payload = sanitizeForFirestore(newMemory);
      const firestoreDoc = doc(db, 'users', userId, 'memories', newId);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );

      await Promise.race([setDoc(firestoreDoc, payload), timeoutPromise]);
      firestoreSynced = true;
    } catch (err: any) {
      console.warn('Firestore addMemory notice:', err);
      firestoreSynced = false;
      const errMsg = err?.message || 'Permission or network issue';
      firestoreNote = `Saved to local vault. Firestore notice: ${errMsg}`;
    }
  }

  return { memory: newMemory, firestoreSynced, firestoreNote };
}

/**
 * Updates an existing memory with validation and Firestore sync.
 */
export async function updateMemory(
  userId: string,
  memoryId: string,
  updates: Partial<Omit<MemoryItem, 'id' | 'userId' | 'createdAt'>>
): Promise<UpdateMemoryResult> {
  const current = getLocalMemories(userId);
  const existing = current.find((m) => m.id === memoryId);
  if (!existing) {
    throw new Error(`Memory with ID ${memoryId} not found.`);
  }

  const updatedMemory: MemoryItem = {
    ...existing,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    notes: updates.notes !== undefined ? (updates.notes ? updates.notes.trim() : '') : existing.notes,
    memoryTime: updates.memoryTime !== undefined ? updates.memoryTime : existing.memoryTime
  };

  const updatedList = current.map((m) => (m.id === memoryId ? updatedMemory : m));
  setLocalMemories(userId, updatedList);

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  if (db) {
    try {
      const payload = sanitizeForFirestore(updates);
      const firestoreDoc = doc(db, 'users', userId, 'memories', memoryId);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );

      await Promise.race([updateDoc(firestoreDoc, payload), timeoutPromise]);
      firestoreSynced = true;
    } catch (err: any) {
      console.warn('Firestore updateMemory notice:', err);
      firestoreSynced = false;
      const errMsg = err?.message || 'Permission or network issue';
      firestoreNote = `Updated locally. Firestore notice: ${errMsg}`;
    }
  }

  return { memory: updatedMemory, firestoreSynced, firestoreNote };
}

/**
 * Deletes a memory from local cache and Firestore.
 */
export async function deleteMemory(userId: string, memoryId: string): Promise<DeleteMemoryResult> {
  const current = getLocalMemories(userId);
  const updated = current.filter((m) => m.id !== memoryId);
  setLocalMemories(userId, updated);

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  if (db) {
    try {
      const firestoreDoc = doc(db, 'users', userId, 'memories', memoryId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );

      await Promise.race([deleteDoc(firestoreDoc), timeoutPromise]);
      firestoreSynced = true;
    } catch (err: any) {
      console.warn('Firestore deleteMemory notice:', err);
      firestoreSynced = false;
      const errMsg = err?.message || 'Permission or network issue';
      firestoreNote = `Deleted locally. Firestore notice: ${errMsg}`;
    }
  }

  return { firestoreSynced, firestoreNote };
}

/**
 * Adds a new person to the reusable people list.
 */
export async function addPerson(userId: string, name: string): Promise<PersonItem> {
  const trimmed = name.trim();
  const current = getLocalPeople(userId);
  const existing = current.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const newPerson: PersonItem = {
    id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    name: trimmed,
    createdAt: Date.now()
  };

  const updated = [...current, newPerson].sort((a, b) => a.name.localeCompare(b.name));
  setLocalPeople(userId, updated);

  if (db) {
    try {
      const payload = sanitizeForFirestore(newPerson);
      await setDoc(doc(db, 'users', userId, 'people', newPerson.id), payload);
    } catch (err) {
      console.warn('Firestore addPerson queued locally:', err);
    }
  }

  return newPerson;
}

