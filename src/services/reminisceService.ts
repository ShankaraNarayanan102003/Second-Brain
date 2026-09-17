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

function getDefaultStarterMemories(userId: string): MemoryItem[] {
  const now = Date.now();
  return [
    {
      id: 'mem_pinned_late_night',
      userId,
      title: 'Late Night Thoughts',
      notes: 'Sometimes the quietest moments say the most.',
      mood: '🥰',
      memoryDate: '2026-09-17',
      memoryTime: '02:24',
      people: [],
      isPinned: true,
      isFavorite: true,
      isPrivate: false,
      createdAt: now - 3600000 * 2
    },
    {
      id: 'mem_multiple_people',
      userId,
      title: 'Architecture & Second Brain Strategy',
      notes: 'Deep dive into spatial memory systems and personal knowledge graphing over coffee.',
      mood: '🤯',
      memoryDate: '2026-09-16',
      memoryTime: '14:30',
      people: ['Alexander Wright', 'Maya Lin', 'David Chen'],
      isPinned: false,
      isFavorite: false,
      isPrivate: false,
      createdAt: now - 86400000 * 1
    },
    {
      id: 'mem_private_reflection',
      userId,
      title: 'Deep Personal Journal & Aspirations',
      notes: 'Private contemplation on focus, personal boundaries, and building enduring creative habits for the coming year.',
      mood: '💜',
      memoryDate: '2026-09-15',
      memoryTime: '21:15',
      people: [],
      isPinned: false,
      isFavorite: true,
      isPrivate: true,
      createdAt: now - 86400000 * 2
    },
    {
      id: 'mem_long_title_content',
      userId,
      title: 'Reflecting on the Architectural Milestones and Long-Term Vision for the Second Brain Knowledge Vault',
      notes: 'Today marked a pivotal shift in how we synthesize fleeting ideas into persistent insights. By organizing thoughts across structured memory nodes and anchoring daily reflections in a dedicated date rail, the cognitive load diminishes dramatically. Every small reflection compound over weeks and months into an irreplaceable archive of growth.',
      mood: '🥰',
      memoryDate: '2026-09-12',
      memoryTime: '10:05',
      people: ['Alexander Wright', 'Elena Vance'],
      isPinned: false,
      isFavorite: false,
      isPrivate: false,
      createdAt: now - 86400000 * 5
    },
    {
      id: 'mem_normal_solo',
      userId,
      title: 'Quiet Morning Espresso & Reading',
      notes: 'The morning light cast warm shadows across the desk while finishing the final chapters of architectural philosophy.',
      mood: '🥰',
      memoryDate: '2026-09-08',
      memoryTime: '07:45',
      people: [],
      isPinned: false,
      isFavorite: false,
      isPrivate: false,
      createdAt: now - 86400000 * 9
    },
    {
      id: 'mem_anger_breakthrough',
      userId,
      title: 'Overcoming Deployment Setbacks',
      notes: 'Frustrating synchronization errors took hours to isolate, but discovering the underlying race condition made the perseverance worthwhile.',
      mood: '😤',
      memoryDate: '2026-08-30',
      memoryTime: '18:20',
      people: ['Maya Lin'],
      isPinned: false,
      isFavorite: false,
      isPrivate: false,
      createdAt: now - 86400000 * 18
    }
  ];
}

function getDefaultStarterPeople(userId: string): PersonItem[] {
  const now = Date.now();
  return [
    { id: 'p_alex', userId, name: 'Alexander Wright', createdAt: now - 10000 },
    { id: 'p_david', userId, name: 'David Chen', createdAt: now - 20000 },
    { id: 'p_elena', userId, name: 'Elena Vance', createdAt: now - 30000 },
    { id: 'p_maya', userId, name: 'Maya Lin', createdAt: now - 40000 }
  ];
}

function getLocalMemories(userId: string): MemoryItem[] {
  try {
    const raw = localStorage.getItem(MEMORIES_STORAGE_KEY + userId);
    if (!raw) {
      const starter = getDefaultStarterMemories(userId);
      setLocalMemories(userId, starter);
      return starter;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultStarterMemories(userId);
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
    if (!raw) {
      const starter = getDefaultStarterPeople(userId);
      setLocalPeople(userId, starter);
      return starter;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultStarterPeople(userId);
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
 * Subscribes to memories for a user.
 * Connects directly to Cloud Firestore collection 'users/{userId}/memories',
 * using localStorage as an offline caching layer.
 */
export function subscribeMemories(
  userId: string,
  onUpdate: (memories: MemoryItem[]) => void
): () => void {
  const localMemories = getLocalMemories(userId);
  onUpdate(localMemories);

  if (!db) {
    return () => {};
  }

  try {
    const memoriesRef = collection(db, 'users', userId, 'memories');
    const q = query(memoriesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          const local = getLocalMemories(userId);
          if (local.length > 0) {
            onUpdate(local);
            return;
          }
        }
        const firestoreMemories: MemoryItem[] = [];
        const seenIds = new Set<string>();
        snapshot.forEach((docSnap) => {
          if (!seenIds.has(docSnap.id)) {
            seenIds.add(docSnap.id);
            firestoreMemories.push({ id: docSnap.id, ...(docSnap.data() as Omit<MemoryItem, 'id'>) });
          }
        });
        setLocalMemories(userId, firestoreMemories);
        onUpdate(firestoreMemories);
      },
      (error) => {
        console.warn('Firestore subscription notice (using local cache):', error);
        onUpdate(getLocalMemories(userId));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore memory subscription error:', err);
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
  const localPeople = getLocalPeople(userId);
  onUpdate(localPeople);

  if (!db) {
    return () => {};
  }

  try {
    const peopleRef = collection(db, 'users', userId, 'people');
    const q = query(peopleRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestorePeople: PersonItem[] = [];
        snapshot.forEach((docSnap) => {
          firestorePeople.push({ id: docSnap.id, ...(docSnap.data() as Omit<PersonItem, 'id'>) });
        });
        setLocalPeople(userId, firestorePeople);
        onUpdate(firestorePeople);
      },
      (error) => {
        console.warn('Firestore people subscription notice:', error);
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

  const seen = new Set<string>();
  const updatedList: MemoryItem[] = [];
  for (const m of current) {
    const item = m.id === memoryId ? updatedMemory : m;
    if (!seen.has(item.id)) {
      seen.add(item.id);
      updatedList.push(item);
    }
  }
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

