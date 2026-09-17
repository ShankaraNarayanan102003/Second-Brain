import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MemoryItem, PersonItem } from '../types/reminisce';

const MEMORIES_STORAGE_KEY = 'sb_reminisce_memories_';
const PEOPLE_STORAGE_KEY = 'sb_reminisce_people_';

// In-memory shared caches to prevent repeated Firestore reads across tab switches,
// filters, and component re-renders
const memoryCache = new Map<string, MemoryItem[]>();
const peopleCache = new Map<string, PersonItem[]>();
const memoriesFetchedUsers = new Set<string>();
const peopleFetchedUsers = new Set<string>();

// Active local subscribers for immediate synchronous notifications
const memoryListeners = new Map<string, Set<(memories: MemoryItem[]) => void>>();
const peopleListeners = new Map<string, Set<(people: PersonItem[]) => void>>();

export function deduplicateMemories(list: MemoryItem[]): MemoryItem[] {
  const seen = new Set<string>();
  const result: MemoryItem[] = [];
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

function notifyMemoryListeners(userId: string, memories: MemoryItem[]) {
  const listeners = memoryListeners.get(userId);
  if (listeners) {
    const deduplicated = deduplicateMemories(memories);
    listeners.forEach((listener) => {
      try {
        listener(deduplicated);
      } catch (err) {
        console.warn('Memory listener error:', err);
      }
    });
  }
}

function notifyPeopleListeners(userId: string, people: PersonItem[]) {
  const listeners = peopleListeners.get(userId);
  if (listeners) {
    listeners.forEach((listener) => {
      try {
        listener(people);
      } catch (err) {
        console.warn('People listener error:', err);
      }
    });
  }
}

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

export function getLocalMemories(userId: string): MemoryItem[] {
  const cached = memoryCache.get(userId);
  if (cached && cached.length > 0) {
    return cached;
  }
  try {
    const raw = localStorage.getItem(MEMORIES_STORAGE_KEY + userId);
    if (!raw) {
      const starter = getDefaultStarterMemories(userId);
      setLocalMemories(userId, starter);
      return starter;
    }
    const parsed = deduplicateMemories(JSON.parse(raw));
    memoryCache.set(userId, parsed);
    return parsed;
  } catch {
    const fallback = getDefaultStarterMemories(userId);
    memoryCache.set(userId, fallback);
    return fallback;
  }
}

export function setLocalMemories(userId: string, memories: MemoryItem[]) {
  const clean = deduplicateMemories(memories);
  memoryCache.set(userId, clean);
  try {
    localStorage.setItem(MEMORIES_STORAGE_KEY + userId, JSON.stringify(clean));
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }
}

export function getLocalPeople(userId: string): PersonItem[] {
  const cached = peopleCache.get(userId);
  if (cached && cached.length > 0) {
    return cached;
  }
  try {
    const raw = localStorage.getItem(PEOPLE_STORAGE_KEY + userId);
    if (!raw) {
      const starter = getDefaultStarterPeople(userId);
      setLocalPeople(userId, starter);
      return starter;
    }
    const parsed = JSON.parse(raw);
    peopleCache.set(userId, parsed);
    return parsed;
  } catch {
    const fallback = getDefaultStarterPeople(userId);
    peopleCache.set(userId, fallback);
    return fallback;
  }
}

export function setLocalPeople(userId: string, people: PersonItem[]) {
  peopleCache.set(userId, people);
  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY + userId, JSON.stringify(people));
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }
}

/**
 * Optimized memory subscription that MINIMIZES FIRESTORE READS.
 * - Serves in-memory / local cache immediately (0 ms, 0 Firestore reads).
 * - Avoids continuous real-time listeners (onSnapshot) that incur reads on every change or write.
 * - Fetches from Firestore only ONCE per session per user.
 * - Tab switches, filter changes, and mutations consume ZERO additional Firestore reads.
 */
export function subscribeMemories(
  userId: string,
  onUpdate: (memories: MemoryItem[]) => void
): () => void {
  // Register listener for instantaneous local updates
  if (!memoryListeners.has(userId)) {
    memoryListeners.set(userId, new Set());
  }
  memoryListeners.get(userId)!.add(onUpdate);

  // Serve current in-memory / local cached memories immediately
  const localMemories = getLocalMemories(userId);
  onUpdate(localMemories);

  // If already fetched from Firestore in this session or db unavailable, no Firestore read needed
  if (!db || userId === 'guest_user' || memoriesFetchedUsers.has(userId)) {
    return () => {
      memoryListeners.get(userId)?.delete(onUpdate);
    };
  }

  // Single-read fetch only once per user session
  memoriesFetchedUsers.add(userId);

  (async () => {
    try {
      const memoriesRef = collection(db, 'users', userId, 'memories');
      const q = query(memoriesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const firestoreMemories: MemoryItem[] = [];
        const seenIds = new Set<string>();
        snapshot.forEach((docSnap) => {
          if (!seenIds.has(docSnap.id)) {
            seenIds.add(docSnap.id);
            const data = docSnap.data();
            firestoreMemories.push({
              id: docSnap.id,
              userId,
              title: data.title || '',
              notes: data.notes || '',
              memoryDate: data.memoryDate || '',
              memoryTime: data.memoryTime || '',
              mood: data.mood || '🥰',
              people: Array.isArray(data.people) ? data.people : [],
              isPrivate: Boolean(data.isPrivate),
              isPinned: Boolean(data.isPinned),
              isFavorite: Boolean(data.isFavorite),
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now()
            });
          }
        });

        const deduplicated = deduplicateMemories(firestoreMemories);
        setLocalMemories(userId, deduplicated);
        notifyMemoryListeners(userId, deduplicated);
      }
    } catch (error) {
      console.warn('Firestore initial fetch notice (retaining local cache):', error);
    }
  })();

  return () => {
    memoryListeners.get(userId)?.delete(onUpdate);
  };
}

/**
 * Optimized people subscription that MINIMIZES FIRESTORE READS.
 * - Serves cached people immediately.
 * - Fetches from Firestore only ONCE per session per user.
 */
export function subscribePeople(
  userId: string,
  onUpdate: (people: PersonItem[]) => void
): () => void {
  if (!peopleListeners.has(userId)) {
    peopleListeners.set(userId, new Set());
  }
  peopleListeners.get(userId)!.add(onUpdate);

  const localPeople = getLocalPeople(userId);
  onUpdate(localPeople);

  if (!db || userId === 'guest_user' || peopleFetchedUsers.has(userId)) {
    return () => {
      peopleListeners.get(userId)?.delete(onUpdate);
    };
  }

  peopleFetchedUsers.add(userId);

  (async () => {
    try {
      const peopleRef = collection(db, 'users', userId, 'people');
      const q = query(peopleRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const firestorePeople: PersonItem[] = [];
        const seen = new Set<string>();
        snapshot.forEach((docSnap) => {
          if (!seen.has(docSnap.id)) {
            seen.add(docSnap.id);
            const data = docSnap.data();
            firestorePeople.push({
              id: docSnap.id,
              userId,
              name: data.name || '',
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now()
            });
          }
        });
        setLocalPeople(userId, firestorePeople);
        notifyPeopleListeners(userId, firestorePeople);
      }
    } catch (error) {
      console.warn('Firestore people fetch notice:', error);
    }
  })();

  return () => {
    peopleListeners.get(userId)?.delete(onUpdate);
  };
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
 * Adds a new memory with minimal stored data:
 * - Only required schema fields stored in 'users/{userId}/memories/{id}'.
 * - No duplicate copies for Favorites, Mood, Anniversaries, Timeline, or counts.
 * - Optimistic local update with zero Firestore read overhead.
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
    id: newId,
    userId,
    title: memoryData.title.trim(),
    notes: memoryData.notes ? memoryData.notes.trim() : '',
    memoryDate: memoryData.memoryDate,
    memoryTime: memoryData.memoryTime || '',
    mood: memoryData.mood || '🥰',
    people: memoryData.people || [],
    isPrivate: Boolean(memoryData.isPrivate),
    isPinned: Boolean(memoryData.isPinned),
    isFavorite: Boolean(memoryData.isFavorite),
    createdAt: Date.now()
  };

  // Immediate local update
  const current = getLocalMemories(userId);
  const updated = deduplicateMemories([newMemory, ...current.filter((m) => m.id !== newId)]);
  setLocalMemories(userId, updated);
  notifyMemoryListeners(userId, updated);

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  // Single targeted document write to Firestore
  if (db && userId !== 'guest_user') {
    try {
      const payload = {
        title: newMemory.title,
        notes: newMemory.notes,
        memoryDate: newMemory.memoryDate,
        memoryTime: newMemory.memoryTime,
        mood: newMemory.mood,
        people: newMemory.people,
        isPrivate: newMemory.isPrivate,
        isPinned: newMemory.isPinned,
        isFavorite: newMemory.isFavorite,
        createdAt: newMemory.createdAt
      };
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
 * TARGETED MEMORY UPDATES TO MINIMIZE FIRESTORE WRITES:
 * - Like -> updates ONLY isFavorite.
 * - Pin -> updates ONLY isPinned.
 * - Private -> updates ONLY isPrivate.
 * - Edit -> computes targeted diff and updates ONLY fields that actually changed.
 * - If no fields changed, skips Firestore write completely (0 writes).
 * - Replaces memory in local state by ID; never duplicates or appends.
 * - Consumes 0 Firestore reads.
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

  // In-place replacement by ID
  const updatedList = deduplicateMemories(
    current.map((m) => (m.id === memoryId ? updatedMemory : m))
  );
  setLocalMemories(userId, updatedList);
  notifyMemoryListeners(userId, updatedList);

  // Compute targeted diff for Firestore: only send changed fields
  const diffPayload: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const existingVal = (existing as any)[key];
    if (Array.isArray(value)) {
      const existingArray = Array.isArray(existingVal) ? existingVal : [];
      const isSame =
        existingArray.length === value.length &&
        existingArray.every((v: any, i: number) => v === value[i]);
      if (!isSame) {
        diffPayload[key] = value;
      }
    } else if (key === 'title' && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== existingVal) {
        diffPayload.title = trimmed;
      }
    } else if (key === 'notes' && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== existingVal) {
        diffPayload.notes = trimmed;
      }
    } else if (existingVal !== value) {
      diffPayload[key] = value;
    }
  }

  // If no fields actually changed, save 100% of write quota
  if (Object.keys(diffPayload).length === 0) {
    return { memory: updatedMemory, firestoreSynced: true, firestoreNote: 'No changed fields.' };
  }

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  if (db && userId !== 'guest_user') {
    try {
      const firestoreDoc = doc(db, 'users', userId, 'memories', memoryId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );

      // Targeted single-field or changed-fields-only write
      await Promise.race([updateDoc(firestoreDoc, diffPayload), timeoutPromise]);
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
 * Deletes memory document from local state and Firestore.
 * - Removes memory by ID from local collection.
 * - Single targeted deleteDoc call.
 * - Consumes 0 Firestore reads.
 */
export async function deleteMemory(userId: string, memoryId: string): Promise<DeleteMemoryResult> {
  const current = getLocalMemories(userId);
  const updated = deduplicateMemories(current.filter((m) => m.id !== memoryId));
  setLocalMemories(userId, updated);
  notifyMemoryListeners(userId, updated);

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  if (db && userId !== 'guest_user') {
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
 * Adds a new person to the reusable people list:
 * - Checks if person already exists (case-insensitive) to prevent duplicate records and writes.
 * - Stores minimal schema in 'users/{userId}/people/{id}'.
 * - Consumes 0 Firestore reads.
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
  notifyPeopleListeners(userId, updated);

  if (db && userId !== 'guest_user') {
    try {
      const payload = {
        name: newPerson.name,
        createdAt: newPerson.createdAt
      };
      await setDoc(doc(db, 'users', userId, 'people', newPerson.id), payload);
    } catch (err) {
      console.warn('Firestore addPerson queued locally:', err);
    }
  }

  return newPerson;
}


