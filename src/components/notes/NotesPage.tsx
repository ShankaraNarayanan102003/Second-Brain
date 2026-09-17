import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Folder,
  Tag as TagIcon,
  Pin,
  Heart,
  Clock,
  X,
  RotateCcw,
  Sparkles,
  Lock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type {
  NoteItem,
  NotesTabId,
  NotesDateFilterType
} from '../../types/notes';
import {
  subscribeNotes,
  addNote,
  updateNote,
  deleteNote,
  subscribeCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  deduplicateNotes
} from '../../services/notesService';
import { subscribePeople, addPerson } from '../../services/reminisceService';
import type { PersonItem } from '../../types/reminisce';
import { NoteCard } from './NoteCard';
import { NoteFormModal } from './NoteFormModal';
import { NoteDetailModal } from './NoteDetailModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import {
  isDateInCurrentWeek,
  isDateInCurrentMonth,
  isDateInCurrentYear,
  getTodayDateString
} from '../../utils/notesUtils';

interface ToastState {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

export function NotesPage() {
  const { user } = useAuth();
  const userId = user?.uid || 'guest_user';

  // Data state
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [people, setPeople] = useState<PersonItem[]>([]);

  // Organization & filter state
  const [activeTab, setActiveTab] = useState<NotesTabId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<NotesDateFilterType>('all');

  // Privacy state (session only - resets on page leave)
  const [revealedNoteIds, setRevealedNoteIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // 1. Subscribe to notes, categories, and shared people data
  useEffect(() => {
    const unsubNotes = subscribeNotes(userId, (data) => {
      setNotes(deduplicateNotes(data));
    });

    const unsubCategories = subscribeCategories(userId, (catData) => {
      setCategories(catData);
    });

    const unsubPeople = subscribePeople(userId, (peopleData) => {
      setPeople(peopleData);
    });

    return () => {
      unsubNotes();
      unsubCategories();
      unsubPeople();
    };
  }, [userId]);

  // Handle privacy toggling in-session (0 Firestore reads/writes)
  const handleToggleReveal = (id: string) => {
    setRevealedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Quick favorite toggle (targeted single property update)
  const handleToggleFavorite = async (id: string, current: boolean) => {
    try {
      const res = await updateNote(userId, id, { isFavorite: !current });
      setNotes((prev) => deduplicateNotes(prev.map((n) => (n.id === id ? res.note : n))));
    } catch (err) {
      console.warn('Favorite toggle warning:', err);
    }
  };

  // Quick pin toggle (targeted single property update)
  const handleTogglePin = async (id: string, current: boolean) => {
    try {
      const res = await updateNote(userId, id, { isPinned: !current });
      setNotes((prev) => deduplicateNotes(prev.map((n) => (n.id === id ? res.note : n))));
    } catch (err) {
      console.warn('Pin toggle warning:', err);
    }
  };

  // Quick privacy toggle (targeted single property update)
  const handleTogglePrivate = async (id: string, current: boolean) => {
    try {
      const res = await updateNote(userId, id, { isPrivate: !current });
      setNotes((prev) => deduplicateNotes(prev.map((n) => (n.id === id ? res.note : n))));
    } catch (err) {
      console.warn('Privacy toggle warning:', err);
    }
  };

  // Quick checklist item toggle in note view
  const handleToggleChecklistInNote = async (id: string, updatedContent: string) => {
    try {
      const res = await updateNote(userId, id, { content: updatedContent });
      setNotes((prev) => deduplicateNotes(prev.map((n) => (n.id === id ? res.note : n))));
      if (viewingNote?.id === id) {
        setViewingNote(res.note);
      }
    } catch (err) {
      console.warn('Checklist update warning:', err);
    }
  };

  // Save (create or update)
  const handleSaveNote = async (
    data: Omit<NoteItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (editingNote) {
        const res = await updateNote(userId, editingNote.id, data);
        setNotes((prev) => deduplicateNotes(prev.map((n) => (n.id === editingNote.id ? res.note : n))));
        showToast(
          'Note updated successfully!',
          res.firestoreSynced
            ? 'Synchronized with Cloud Firestore.'
            : res.firestoreNote,
          'success'
        );
      } else {
        const res = await addNote(userId, data);
        setNotes((prev) => deduplicateNotes([res.note, ...prev.filter((n) => n.id !== res.note.id)]));
        showToast(
          'Note created successfully!',
          res.firestoreSynced
            ? 'Synchronized with Cloud Firestore.'
            : res.firestoreNote,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Failed to save note', err?.message || 'Database error occurred.', 'error');
      throw err;
    }
  };

  // Request deletion (opens confirmation dialog)
  const handleRequestDeleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) {
      setNoteToDelete(target);
    }
  };

  // Confirmed delete execution
  const handleConfirmDeleteNote = async () => {
    if (!noteToDelete) return;
    const targetId = noteToDelete.id;
    const targetTitle = noteToDelete.title || 'Untitled Note';
    setIsDeletingNote(true);

    try {
      const res = await deleteNote(userId, targetId);
      // Delete only the selected note document, remove from local frontend state immediately
      setNotes((prev) => deduplicateNotes(prev.filter((n) => n.id !== targetId)));
      if (viewingNote?.id === targetId) setViewingNote(null);
      if (editingNote?.id === targetId) {
        setEditingNote(null);
        setIsFormModalOpen(false);
      }
      setNoteToDelete(null);
      showToast(
        'Note deleted',
        res.firestoreSynced
          ? `"${targetTitle}" was permanently removed.`
          : res.firestoreNote,
        'info'
      );
    } catch (err: any) {
      showToast('Failed to delete note', err?.message || 'Database error occurred.', 'error');
    } finally {
      setIsDeletingNote(false);
    }
  };

  // Add person (shared with Reminisce)
  const handleAddNewPerson = async (name: string) => {
    const person = await addPerson(userId, name);
    setPeople((prev) => {
      if (prev.some((p) => p.name.toLowerCase() === person.name.toLowerCase())) return prev;
      return [...prev, person].sort((a, b) => a.name.localeCompare(b.name));
    });
    return person;
  };

  // Extract all unique tags present across notes for the Tags tab & filter
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    for (const note of notes) {
      if (Array.isArray(note.tags)) {
        for (const t of note.tags) {
          if (t && t.trim()) set.add(t.trim());
        }
      }
    }
    return Array.from(set).sort();
  }, [notes]);

  // Derived filtered notes (0 Firestore reads, pure client-side derivation)
  const filteredNotes = useMemo(() => {
    let list = [...notes];
    const today = getTodayDateString();

    // 1. Tab-based view filter
    if (activeTab === 'pinned') {
      list = list.filter((n) => n.isPinned);
    } else if (activeTab === 'favorites') {
      list = list.filter((n) => n.isFavorite);
    } else if (activeTab === 'recent') {
      // Sort strictly by updatedAt desc
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    // 2. Search query filter (by title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((n) => n.title.toLowerCase().includes(q));
    }

    // 3. Category filter
    if (selectedCategory) {
      list = list.filter((n) => n.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 4. Tag filter
    if (selectedTag) {
      list = list.filter(
        (n) => Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    // 5. Date filter
    if (selectedDateFilter === 'today') {
      list = list.filter((n) => n.noteDate === today);
    } else if (selectedDateFilter === 'week') {
      list = list.filter((n) => isDateInCurrentWeek(n.noteDate));
    } else if (selectedDateFilter === 'month') {
      list = list.filter((n) => isDateInCurrentMonth(n.noteDate));
    } else if (selectedDateFilter === 'year') {
      list = list.filter((n) => isDateInCurrentYear(n.noteDate));
    }

    // Default sorting for non-recent tabs: pinned notes first, then newest createdAt
    if (activeTab !== 'recent') {
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    }

    return list;
  }, [notes, activeTab, searchQuery, selectedCategory, selectedTag, selectedDateFilter]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCategory ||
    selectedTag ||
    selectedDateFilter !== 'all'
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedDateFilter('all');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 0.5rem 6rem 0.5rem'
      }}
    >
      {/* 1. PAGE HEADER */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--neu-shadow-raised-md)'
        }}
      >
        {/* Title Row + Create Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h1
              className="gold-gradient-text font-display"
              style={{
                fontSize: '1.75rem',
                margin: 0,
                letterSpacing: '0.04em'
              }}
            >
              NOTES
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0
              }}
            >
              Capture conceptual knowledge, structured ideas, and strategic insights.
            </p>
          </div>

          <button
            id="notes-header-add-btn"
            type="button"
            onClick={() => {
              setEditingNote(null);
              setIsFormModalOpen(true);
            }}
            className="neu-btn neu-btn-gold"
            style={{
              padding: '0.65rem 1.4rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              gap: '0.45rem'
            }}
          >
            <Plus size={16} />
            <span>Add Note</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem'
          }}
        >
          {/* Search Input */}
          <div
            className="neu-inset"
            style={{
              flex: '1 1 240px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 0.85rem',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Search size={15} color="var(--gold-primary)" />
            <input
              id="notes-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Select */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-control)',
              border: selectedCategory
                ? '1px solid var(--border-gold-strong)'
                : '1px solid var(--border-subtle)',
              color: selectedCategory ? 'var(--text-gold)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: selectedCategory ? 700 : 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Tag Filter Select */}
          {allUniqueTags.length > 0 && (
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-control)',
                border: selectedTag
                  ? '1px solid var(--border-gold-strong)'
                  : '1px solid var(--border-subtle)',
                color: selectedTag ? 'var(--text-gold)' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: selectedTag ? 700 : 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Tags</option>
              {allUniqueTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Date Filter Select */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value as NotesDateFilterType)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-control)',
              border: selectedDateFilter !== 'all'
                ? '1px solid var(--border-gold-strong)'
                : '1px solid var(--border-subtle)',
              color: selectedDateFilter !== 'all' ? 'var(--text-gold)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: selectedDateFilter !== 'all' ? 700 : 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Clear Filters Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="neu-btn"
              style={{
                padding: '0.55rem 0.85rem',
                fontSize: '0.8125rem',
                gap: '0.35rem',
                color: 'var(--text-gold)'
              }}
            >
              <RotateCcw size={13} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. TAB-BASED NAVIGATION BAR */}
      <nav
        id="notes-tabs-nav"
        className="neu-inset"
        aria-label="Notes tabs"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.375rem',
          borderRadius: 'var(--radius-md)',
          gap: '0.375rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {[
          { id: 'all' as NotesTabId, label: 'All Notes', icon: Sparkles },
          { id: 'categories' as NotesTabId, label: 'Categories', icon: Folder },
          { id: 'tags' as NotesTabId, label: 'Tags', icon: TagIcon },
          { id: 'pinned' as NotesTabId, label: 'Pinned', icon: Pin },
          { id: 'favorites' as NotesTabId, label: 'Favorites', icon: Heart },
          { id: 'recent' as NotesTabId, label: 'Recent', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`notes-tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'neu-btn-gold' : 'neu-btn'}
              style={{
                flex: '1 1 0px',
                minWidth: '120px',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                border: isActive
                  ? '1.5px solid var(--border-gold-strong)'
                  : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. CATEGORIES FILTER BAR (When Categories tab is selected) */}
      {activeTab === 'categories' && (
        <div
          className="neu-card"
          style={{
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Filter by Category
            </span>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-gold)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              + Manage Categories
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: !selectedCategory ? 700 : 500,
                backgroundColor: !selectedCategory
                  ? 'rgba(212, 175, 55, 0.2)'
                  : 'var(--surface-control)',
                border: !selectedCategory
                  ? '1px solid var(--border-gold-strong)'
                  : '1px solid var(--border-subtle)',
                color: !selectedCategory ? 'var(--text-gold)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              All Categories
            </button>
            {categories.map((c) => {
              const isSelected = selectedCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : c)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected
                      ? 'rgba(212, 175, 55, 0.2)'
                      : 'var(--surface-control)',
                    border: isSelected
                      ? '1px solid var(--border-gold-strong)'
                      : '1px solid var(--border-subtle)',
                    color: isSelected ? 'var(--text-gold)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAGS FILTER BAR (When Tags tab is selected) */}
      {activeTab === 'tags' && (
        <div
          className="neu-card"
          style={{
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Filter by Tag ({allUniqueTags.length})
          </span>

          {allUniqueTags.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              No tags found. Add tags like #Ideas or #Important to your notes.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.75rem',
                  fontWeight: !selectedTag ? 700 : 500,
                  backgroundColor: !selectedTag
                    ? 'rgba(212, 175, 55, 0.2)'
                    : 'var(--surface-control)',
                  border: !selectedTag
                    ? '1px solid var(--border-gold-strong)'
                    : '1px solid var(--border-subtle)',
                  color: !selectedTag ? 'var(--text-gold)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                All Tags
              </button>
              {allUniqueTags.map((t) => {
                const isSelected = selectedTag === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : t)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      backgroundColor: isSelected
                        ? 'rgba(212, 175, 55, 0.2)'
                        : 'var(--surface-control)',
                      border: isSelected
                        ? '1px solid var(--border-gold-strong)'
                        : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--text-gold)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. ACTIVE FILTERS SUMMARY BAR */}
      {hasActiveFilters && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid var(--border-gold-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-gold)' }}>
              Filtered Results ({filteredNotes.length}):
            </span>
            {searchQuery && (
              <span style={filterBadgeStyle}>Title: "{searchQuery}"</span>
            )}
            {selectedCategory && (
              <span style={filterBadgeStyle}>Category: {selectedCategory}</span>
            )}
            {selectedTag && (
              <span style={filterBadgeStyle}>Tag: {selectedTag}</span>
            )}
            {selectedDateFilter !== 'all' && (
              <span style={filterBadgeStyle}>Date: {selectedDateFilter}</span>
            )}
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-gold)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 6. MAIN CONTENT STAGE */}
      {filteredNotes.length === 0 ? (
        <div
          className="neu-card"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-control)',
              border: '1px solid var(--border-gold-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={24} color="var(--gold-primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
              {hasActiveFilters ? 'No notes matched your filters' : 'No notes found'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px' }}>
              {hasActiveFilters
                ? 'Try clearing active filters or searching with different terms.'
                : 'Begin building your second brain repository by capturing your first note.'}
            </p>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="neu-btn neu-btn-gold"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600 }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setIsFormModalOpen(true);
              }}
              className="neu-btn neu-btn-gold"
              style={{ padding: '0.55rem 1.35rem', fontSize: '0.8125rem', fontWeight: 700, gap: '0.4rem' }}
            >
              <Plus size={15} />
              <span>Create Note</span>
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isRevealed={revealedNoteIds.has(note.id)}
              onToggleReveal={handleToggleReveal}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onTogglePrivate={handleTogglePrivate}
              onEdit={(n) => {
                setEditingNote(n);
                setIsFormModalOpen(true);
              }}
              onDelete={handleRequestDeleteNote}
              onOpen={(n) => setViewingNote(n)}
            />
          ))}
        </div>
      )}

      {/* 7. CUSTOM FLOATING ADD BUTTON */}
      <button
        id="notes-floating-add-btn"
        type="button"
        onClick={() => {
          setEditingNote(null);
          setIsFormModalOpen(true);
        }}
        className="neu-btn-gold"
        title="Add Note"
        aria-label="Add new note"
        style={{
          position: 'fixed',
          right: '1.5rem',
          bottom: '5.25rem', // Elevated above mobile navigation bar
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          zIndex: 80,
          boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4), var(--neu-shadow-raised-lg)',
          cursor: 'pointer',
          border: '1px solid var(--liquid-gold-border)'
        }}
      >
        <Plus size={26} color="#12151B" strokeWidth={2.5} />
      </button>

      {/* 8. MODALS */}
      {/* Note Form Modal (Create or Edit) */}
      {isFormModalOpen && (
        <NoteFormModal
          initialNote={editingNote}
          categories={categories}
          peopleList={people}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          onDelete={editingNote ? (id) => handleRequestDeleteNote(id) : undefined}
          onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          onAddNewPerson={handleAddNewPerson}
        />
      )}

      {/* Note Detail Modal */}
      {viewingNote && (
        <NoteDetailModal
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={(note) => {
            setViewingNote(null);
            setEditingNote(note);
            setIsFormModalOpen(true);
          }}
          onDelete={(note) => {
            setViewingNote(null);
            setNoteToDelete(note);
          }}
          onToggleChecklist={handleToggleChecklistInNote}
        />
      )}

      {/* Note Delete Confirmation Dialog */}
      {noteToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-delete-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 10, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingNote) {
              setNoteToDelete(null);
            }
          }}
        >
          <div
            className="neu-card"
            style={{
              width: '100%',
              maxWidth: '430px',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: 'var(--neu-shadow-raised-lg), 0 0 25px rgba(239, 68, 68, 0.15)',
              overflow: 'hidden',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={20} color="#EF4444" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0, flex: 1 }}>
                <h3
                  id="note-delete-dialog-title"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}
                >
                  Delete this note?
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: '1.45'
                  }}
                >
                  Are you sure you want to permanently delete{' '}
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-gold)',
                      wordBreak: 'break-word'
                    }}
                  >
                    "{noteToDelete.title || 'Untitled Note'}"
                  </span>
                  ?
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-control)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>This action cannot be undone. Only this note document will be deleted.</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                disabled={isDeletingNote}
                style={{
                  padding: '0.6rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isDeletingNote ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteNote}
                disabled={isDeletingNote}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#EF4444',
                  border: '1px solid #DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: isDeletingNote ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)'
                }}
              >
                {isDeletingNote ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          categories={categories}
          notes={notes}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={async (name) => {
            const updated = await addCategory(userId, name);
            showToast('Category created', `Added "${name}"`, 'success');
            return updated;
          }}
          onUpdateCategory={async (oldName, newName) => {
            const res = await updateCategory(userId, oldName, newName);
            showToast('Category updated', `Renamed "${oldName}" to "${newName}"`, 'success');
            return res;
          }}
          onDeleteCategory={async (name, reassign) => {
            const res = await deleteCategory(userId, name, reassign);
            showToast('Category deleted', `Removed "${name}" and updated affected notes`, 'info');
            return res;
          }}
        />
      )}

      {/* 9. TOAST NOTIFICATIONS */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            width: '90%',
            maxWidth: '420px',
            pointerEvents: 'none'
          }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="neu-card"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-raised)',
                border:
                  toast.type === 'error'
                    ? '1px solid #EF4444'
                    : '1px solid var(--border-gold-strong)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)'
              }}
            >
              {toast.type === 'error' ? (
                <AlertCircle size={17} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <CheckCircle2 size={17} color="var(--gold-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {toast.title}
                </span>
                {toast.description && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {toast.description}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const filterBadgeStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--surface-control)',
  padding: '0.15rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-subtle)'
};
