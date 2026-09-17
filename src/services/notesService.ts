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
import type { NoteItem } from '../types/notes';
import { DEFAULT_CATEGORIES } from '../types/notes';
import { getTodayDateString, getCurrentTimeString } from '../utils/notesUtils';

const NOTES_STORAGE_KEY = 'sb_notes_data_';
const CATEGORIES_STORAGE_KEY = 'sb_notes_categories_';

// In-memory caches to guarantee 0 redundant Firestore reads
const notesCache = new Map<string, NoteItem[]>();
const categoriesCache = new Map<string, string[]>();
const notesFetchedUsers = new Set<string>();
const categoriesFetchedUsers = new Set<string>();

// Active subscribers for instant synchronous notification
const noteListeners = new Map<string, Set<(notes: NoteItem[]) => void>>();
const categoryListeners = new Map<string, Set<(categories: string[]) => void>>();

export function deduplicateNotes(list: NoteItem[]): NoteItem[] {
  const seen = new Set<string>();
  const result: NoteItem[] = [];
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

function notifyNoteListeners(userId: string, notes: NoteItem[]) {
  const listeners = noteListeners.get(userId);
  if (listeners) {
    const clean = deduplicateNotes(notes);
    listeners.forEach((listener) => {
      try {
        listener(clean);
      } catch (err) {
        console.warn('Note listener notice:', err);
      }
    });
  }
}

function notifyCategoryListeners(userId: string, categories: string[]) {
  const listeners = categoryListeners.get(userId);
  if (listeners) {
    listeners.forEach((listener) => {
      try {
        listener(categories);
      } catch (err) {
        console.warn('Category listener notice:', err);
      }
    });
  }
}

function getDefaultStarterNotes(userId: string): NoteItem[] {
  const now = Date.now();
  return [
    {
      id: 'note_pinned_vision',
      userId,
      title: 'Second Brain Architectural Principles & System Design',
      content:
        '<h3>Core Pillars</h3><ul><li><strong>Obsidian Luxury Aesthetic:</strong> Deep charcoal and liquid-metallic gold contrast.</li><li><strong>Strict Local Cache:</strong> Zero unnecessary cloud round-trips for instantaneous responsiveness.</li><li><strong>Atomic State:</strong> In-place item updates without duplicate card generation.</li></ul>',
      noteDate: getTodayDateString(),
      noteTime: '09:30',
      category: 'Work',
      tags: ['#Architecture', '#Important', '#Projects'],
      people: ['Alexander Wright'],
      isPinned: true,
      isFavorite: true,
      isPrivate: false,
      createdAt: now - 3600000 * 3,
      updatedAt: now - 3600000 * 3
    },
    {
      id: 'note_learning_ideas',
      userId,
      title: 'Cognitive Science & Spaced Retrieval Notes',
      content:
        '<p>Key takeaways from recent research on memory retention and conceptual synthesis:</p><blockquote>Knowledge is not a static warehouse but an interconnected web of living nodes.</blockquote><ul><li>Retrieval practice strengthens neural pathways.</li><li>Interleaving topics produces deeper long-term comprehension.</li></ul>',
      noteDate: getTodayDateString(),
      noteTime: '11:15',
      category: 'Study',
      tags: ['#Learning', '#Ideas'],
      people: ['Maya Lin'],
      isPinned: false,
      isFavorite: true,
      isPrivate: false,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1
    },
    {
      id: 'note_confidential_reflections',
      userId,
      title: 'Quarterly Strategic Aspirations & Financial Blueprint',
      content:
        '<p>Confidential personal notes outlining target runway, high-conviction initiatives, and capital allocation strategy for the upcoming fiscal quarter.</p><div class="note-checklist-item"><input type="checkbox" checked disabled /> <span>Review Q3 operating expenses</span></div><div class="note-checklist-item"><input type="checkbox" disabled /> <span>Establish private endowment reserve</span></div>',
      noteDate: getTodayDateString(),
      noteTime: '20:45',
      category: 'Finance',
      tags: ['#Important', '#Finance'],
      people: [],
      isPinned: false,
      isFavorite: false,
      isPrivate: true,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2
    },
    {
      id: 'note_weekly_habits',
      userId,
      title: 'Morning Routine & Mindfulness Framework',
      content:
        '<p>Consistency in the first 90 minutes sets the cognitive tone for the entire day.</p><ul><li>Espresso & silent contemplative journaling</li><li>Targeted deep work block before opening communication channels</li><li>Physical exertion and hydration</li></ul>',
      noteDate: getTodayDateString(),
      noteTime: '07:00',
      category: 'Personal',
      tags: ['#Ideas'],
      people: [],
      isPinned: false,
      isFavorite: false,
      isPrivate: false,
      createdAt: now - 86400000 * 4,
      updatedAt: now - 86400000 * 4
    }
  ];
}

export function getLocalNotes(userId: string): NoteItem[] {
  const cached = notesCache.get(userId);
  if (cached && cached.length > 0) {
    return cached;
  }
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY + userId);
    if (!raw) {
      const starter = getDefaultStarterNotes(userId);
      setLocalNotes(userId, starter);
      return starter;
    }
    const parsed = deduplicateNotes(JSON.parse(raw));
    notesCache.set(userId, parsed);
    return parsed;
  } catch {
    const fallback = getDefaultStarterNotes(userId);
    notesCache.set(userId, fallback);
    return fallback;
  }
}

export function setLocalNotes(userId: string, notes: NoteItem[]) {
  const clean = deduplicateNotes(notes);
  notesCache.set(userId, clean);
  try {
    localStorage.setItem(NOTES_STORAGE_KEY + userId, JSON.stringify(clean));
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }
}

export function getLocalCategories(userId: string): string[] {
  const cached = categoriesCache.get(userId);
  if (cached && cached.length > 0) {
    return cached;
  }
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY + userId);
    if (!raw) {
      setLocalCategories(userId, DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed: string[] = JSON.parse(raw);
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
    categoriesCache.set(userId, combined);
    return combined;
  } catch {
    categoriesCache.set(userId, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
}

export function setLocalCategories(userId: string, categories: string[]) {
  const clean = Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)));
  categoriesCache.set(userId, clean);
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY + userId, JSON.stringify(clean));
  } catch (err) {
    console.warn('Local storage category write warning:', err);
  }
}

/**
 * Optimized notes subscription that MINIMIZES FIRESTORE READS.
 * - Serves in-memory / local cache immediately (0 ms, 0 Firestore reads).
 * - Avoids continuous real-time listeners (onSnapshot) to preserve free tier quotas.
 * - Fetches from Firestore only ONCE per session per user.
 * - Filtering, tab switching, and card mutations consume ZERO additional Firestore reads.
 */
export function subscribeNotes(
  userId: string,
  onUpdate: (notes: NoteItem[]) => void
): () => void {
  if (!noteListeners.has(userId)) {
    noteListeners.set(userId, new Set());
  }
  noteListeners.get(userId)!.add(onUpdate);

  // Serve current cache immediately
  const localNotes = getLocalNotes(userId);
  onUpdate(localNotes);

  if (!db || userId === 'guest_user' || notesFetchedUsers.has(userId)) {
    return () => {
      noteListeners.get(userId)?.delete(onUpdate);
    };
  }

  notesFetchedUsers.add(userId);

  (async () => {
    try {
      const notesRef = collection(db, 'users', userId, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const firestoreNotes: NoteItem[] = [];
        const seen = new Set<string>();
        snapshot.forEach((docSnap) => {
          if (!seen.has(docSnap.id)) {
            seen.add(docSnap.id);
            const data = docSnap.data();
            firestoreNotes.push({
              id: docSnap.id,
              userId,
              title: data.title || '',
              content: data.content || '',
              noteDate: data.noteDate || getTodayDateString(),
              noteTime: data.noteTime || getCurrentTimeString(),
              category: data.category || 'Other',
              tags: Array.isArray(data.tags) ? data.tags : [],
              people: Array.isArray(data.people) ? data.people : [],
              isFavorite: Boolean(data.isFavorite),
              isPinned: Boolean(data.isPinned),
              isPrivate: Boolean(data.isPrivate),
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
              updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now()
            });
          }
        });

        const deduplicated = deduplicateNotes(firestoreNotes);
        setLocalNotes(userId, deduplicated);
        notifyNoteListeners(userId, deduplicated);
      }
    } catch (err) {
      console.warn('Firestore initial notes fetch notice:', err);
    }
  })();

  return () => {
    noteListeners.get(userId)?.delete(onUpdate);
  };
}

/**
 * Subscribes to custom categories list for the user.
 */
export function subscribeCategories(
  userId: string,
  onUpdate: (categories: string[]) => void
): () => void {
  if (!categoryListeners.has(userId)) {
    categoryListeners.set(userId, new Set());
  }
  categoryListeners.get(userId)!.add(onUpdate);

  const localCategories = getLocalCategories(userId);
  onUpdate(localCategories);

  if (!db || userId === 'guest_user' || categoriesFetchedUsers.has(userId)) {
    return () => {
      categoryListeners.get(userId)?.delete(onUpdate);
    };
  }

  categoriesFetchedUsers.add(userId);

  (async () => {
    try {
      const catDocRef = doc(db, 'users', userId, 'meta', 'notes_categories');
      const catSnap = await getDocs(query(collection(db, 'users', userId, 'meta')));
      catSnap.forEach((d) => {
        if (d.id === 'notes_categories') {
          const list = d.data().list;
          if (Array.isArray(list)) {
            const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...list]));
            setLocalCategories(userId, combined);
            notifyCategoryListeners(userId, combined);
          }
        }
      });
    } catch (err) {
      console.warn('Firestore categories fetch notice:', err);
    }
  })();

  return () => {
    categoryListeners.get(userId)?.delete(onUpdate);
  };
}

export interface SaveNoteResult {
  note: NoteItem;
  firestoreSynced: boolean;
  firestoreNote?: string;
}

export interface UpdateNoteResult {
  note: NoteItem;
  firestoreSynced: boolean;
  firestoreNote?: string;
}

export interface DeleteNoteResult {
  firestoreSynced: boolean;
  firestoreNote?: string;
}

/**
 * Adds a new note with clean schema and Firestore sync.
 * - Single document stored in 'users/{userId}/notes/{id}'.
 * - No derived collections or duplicate copies.
 * - Optimistic local update with 0 read overhead.
 */
export async function addNote(
  userId: string,
  noteData: Omit<NoteItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SaveNoteResult> {
  if (!noteData.title || !noteData.title.trim()) {
    throw new Error('Title is required to save a note.');
  }

  const now = Date.now();
  const newId = `note_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const newNote: NoteItem = {
    id: newId,
    userId,
    title: noteData.title.trim(),
    content: noteData.content || '',
    noteDate: noteData.noteDate || getTodayDateString(),
    noteTime: noteData.noteTime || getCurrentTimeString(),
    category: noteData.category ? noteData.category.trim() : 'Other',
    tags: Array.isArray(noteData.tags) ? noteData.tags : [],
    people: Array.isArray(noteData.people) ? noteData.people : [],
    isFavorite: Boolean(noteData.isFavorite),
    isPinned: Boolean(noteData.isPinned),
    isPrivate: Boolean(noteData.isPrivate),
    createdAt: now,
    updatedAt: now
  };

  // Immediate local update
  const current = getLocalNotes(userId);
  const updated = deduplicateNotes([newNote, ...current.filter((n) => n.id !== newId)]);
  setLocalNotes(userId, updated);
  notifyNoteListeners(userId, updated);

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  if (db && userId !== 'guest_user') {
    try {
      const payload = {
        title: newNote.title,
        content: newNote.content,
        noteDate: newNote.noteDate,
        noteTime: newNote.noteTime,
        category: newNote.category,
        tags: newNote.tags,
        people: newNote.people,
        isFavorite: newNote.isFavorite,
        isPinned: newNote.isPinned,
        isPrivate: newNote.isPrivate,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt
      };
      const firestoreDoc = doc(db, 'users', userId, 'notes', newId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );

      await Promise.race([setDoc(firestoreDoc, payload), timeoutPromise]);
      firestoreSynced = true;
    } catch (err: any) {
      console.warn('Firestore addNote notice:', err);
      firestoreSynced = false;
      const errMsg = err?.message || 'Permission or network issue';
      firestoreNote = `Saved to local vault. Firestore notice: ${errMsg}`;
    }
  }

  return { note: newNote, firestoreSynced, firestoreNote };
}

/**
 * TARGETED NOTE UPDATES:
 * - Like -> updates ONLY isFavorite.
 * - Pin -> updates ONLY isPinned.
 * - Private -> updates ONLY isPrivate.
 * - Edit -> computes targeted diff and updates ONLY fields that actually changed + updatedAt.
 * - If no fields changed, skips Firestore write completely (0 writes).
 * - Replaces note in local state by ID; never duplicates or appends.
 * - Consumes 0 Firestore reads.
 */
export async function updateNote(
  userId: string,
  noteId: string,
  updates: Partial<Omit<NoteItem, 'id' | 'userId' | 'createdAt'>>
): Promise<UpdateNoteResult> {
  const current = getLocalNotes(userId);
  const existing = current.find((n) => n.id === noteId);
  if (!existing) {
    throw new Error(`Note with ID ${noteId} not found.`);
  }

  const now = Date.now();
  const updatedNote: NoteItem = {
    ...existing,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    content: updates.content !== undefined ? updates.content : existing.content,
    updatedAt: now
  };

  // In-place replacement by ID
  const updatedList = deduplicateNotes(
    current.map((n) => (n.id === noteId ? updatedNote : n))
  );
  setLocalNotes(userId, updatedList);
  notifyNoteListeners(userId, updatedList);

  // Compute targeted diff
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
    } else if (existingVal !== value) {
      diffPayload[key] = value;
    }
  }

  // If no fields actually changed, save write quota
  if (Object.keys(diffPayload).length === 0) {
    return { note: updatedNote, firestoreSynced: true, firestoreNote: 'No changed fields.' };
  }

  // Always update updatedAt on actual edits
  diffPayload.updatedAt = now;

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  if (db && userId !== 'guest_user') {
    try {
      const firestoreDoc = doc(db, 'users', userId, 'notes', noteId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );

      await Promise.race([updateDoc(firestoreDoc, diffPayload), timeoutPromise]);
      firestoreSynced = true;
    } catch (err: any) {
      console.warn('Firestore updateNote notice:', err);
      firestoreSynced = false;
      const errMsg = err?.message || 'Permission or network issue';
      firestoreNote = `Updated locally. Firestore notice: ${errMsg}`;
    }
  }

  return { note: updatedNote, firestoreSynced, firestoreNote };
}

/**
 * Deletes note document from local state and Firestore.
 */
export async function deleteNote(userId: string, noteId: string): Promise<DeleteNoteResult> {
  const current = getLocalNotes(userId);
  const updated = deduplicateNotes(current.filter((n) => n.id !== noteId));
  setLocalNotes(userId, updated);
  notifyNoteListeners(userId, updated);

  let firestoreSynced = false;
  let firestoreNote: string | undefined;

  if (db && userId !== 'guest_user') {
    try {
      const firestoreDoc = doc(db, 'users', userId, 'notes', noteId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
      );

      await Promise.race([deleteDoc(firestoreDoc), timeoutPromise]);
      firestoreSynced = true;
    } catch (err: any) {
      console.warn('Firestore deleteNote notice:', err);
      firestoreSynced = false;
      const errMsg = err?.message || 'Permission or network issue';
      firestoreNote = `Deleted locally. Firestore notice: ${errMsg}`;
    }
  }

  return { firestoreSynced, firestoreNote };
}

/**
 * Adds a new custom category.
 */
export async function addCategory(userId: string, categoryName: string): Promise<string[]> {
  const trimmed = categoryName.trim();
  if (!trimmed) return getLocalCategories(userId);

  const current = getLocalCategories(userId);
  if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }

  const updated = [...current, trimmed];
  setLocalCategories(userId, updated);
  notifyCategoryListeners(userId, updated);

  if (db && userId !== 'guest_user') {
    try {
      const catDocRef = doc(db, 'users', userId, 'meta', 'notes_categories');
      await setDoc(catDocRef, { list: updated });
    } catch (err) {
      console.warn('Firestore category sync notice:', err);
    }
  }

  return updated;
}

/**
 * Renames an existing category and safely updates all affected notes.
 */
export async function updateCategory(
  userId: string,
  oldName: string,
  newName: string
): Promise<{ categories: string[]; affectedNotesCount: number }> {
  const trimmedNew = newName.trim();
  if (!trimmedNew || oldName === trimmedNew) {
    return { categories: getLocalCategories(userId), affectedNotesCount: 0 };
  }

  const categories = getLocalCategories(userId);
  const updatedCategories = categories.map((c) => (c === oldName ? trimmedNew : c));
  setLocalCategories(userId, updatedCategories);
  notifyCategoryListeners(userId, updatedCategories);

  // Update affected notes in-place
  const notes = getLocalNotes(userId);
  let affectedCount = 0;
  const updatedNotes = notes.map((note) => {
    if (note.category === oldName) {
      affectedCount++;
      return { ...note, category: trimmedNew, updatedAt: Date.now() };
    }
    return note;
  });

  if (affectedCount > 0) {
    setLocalNotes(userId, updatedNotes);
    notifyNoteListeners(userId, updatedNotes);
  }

  // Sync to Firestore
  if (db && userId !== 'guest_user') {
    try {
      const catDocRef = doc(db, 'users', userId, 'meta', 'notes_categories');
      await setDoc(catDocRef, { list: updatedCategories });

      // Update affected notes in Firestore
      for (const note of notes) {
        if (note.category === oldName) {
          const docRef = doc(db, 'users', userId, 'notes', note.id);
          updateDoc(docRef, { category: trimmedNew, updatedAt: Date.now() }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Firestore updateCategory notice:', err);
    }
  }

  return { categories: updatedCategories, affectedNotesCount: affectedCount };
}

/**
 * Safely deletes a category:
 * - Checks which notes use it.
 * - Clears the category (or moves to reassignTo) on affected notes.
 * - Does not delete notes.
 */
export async function deleteCategory(
  userId: string,
  categoryName: string,
  reassignTo: string = 'Other'
): Promise<{ categories: string[]; affectedNotesCount: number }> {
  const categories = getLocalCategories(userId);
  const updatedCategories = categories.filter((c) => c !== categoryName);
  setLocalCategories(userId, updatedCategories);
  notifyCategoryListeners(userId, updatedCategories);

  // Update affected notes in-place
  const notes = getLocalNotes(userId);
  let affectedCount = 0;
  const updatedNotes = notes.map((note) => {
    if (note.category === categoryName) {
      affectedCount++;
      return { ...note, category: reassignTo, updatedAt: Date.now() };
    }
    return note;
  });

  if (affectedCount > 0) {
    setLocalNotes(userId, updatedNotes);
    notifyNoteListeners(userId, updatedNotes);
  }

  // Sync to Firestore
  if (db && userId !== 'guest_user') {
    try {
      const catDocRef = doc(db, 'users', userId, 'meta', 'notes_categories');
      await setDoc(catDocRef, { list: updatedCategories });

      for (const note of notes) {
        if (note.category === categoryName) {
          const docRef = doc(db, 'users', userId, 'notes', note.id);
          updateDoc(docRef, { category: reassignTo, updatedAt: Date.now() }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Firestore deleteCategory notice:', err);
    }
  }

  return { categories: updatedCategories, affectedNotesCount: affectedCount };
}
