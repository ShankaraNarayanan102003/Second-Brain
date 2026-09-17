import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Calendar,
  Clock,
  Pin,
  Heart,
  Lock,
  Tag,
  User,
  Plus,
  AlertTriangle,
  FolderPlus
} from 'lucide-react';
import type { NoteItem } from '../../types/notes';
import { SUGGESTED_TAGS } from '../../types/notes';
import { RichTextEditor } from './RichTextEditor';
import { NotesTimePicker } from './NotesTimePicker';
import {
  getTodayDateString,
  getCurrentTimeString,
  normalizeTag
} from '../../utils/notesUtils';
import { PersonItem } from '../../types/reminisce';

interface NoteFormModalProps {
  initialNote: NoteItem | null;
  categories: string[];
  peopleList: PersonItem[];
  onClose: () => void;
  onSave: (data: Omit<NoteItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onDelete?: (id: string) => void | Promise<any>;
  onOpenCategoryManager: () => void;
  onAddNewPerson: (name: string) => Promise<PersonItem>;
}

export function NoteFormModal({
  initialNote,
  categories,
  peopleList,
  onClose,
  onSave,
  onDelete,
  onOpenCategoryManager,
  onAddNewPerson
}: NoteFormModalProps) {
  const isEditing = Boolean(initialNote);

  // Form State
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [noteDate, setNoteDate] = useState(initialNote?.noteDate || getTodayDateString());
  const [noteTime, setNoteTime] = useState(initialNote?.noteTime || getCurrentTimeString());
  const [category, setCategory] = useState(
    initialNote?.category || (categories[0] || 'Personal')
  );
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [people, setPeople] = useState<string[]>(initialNote?.people || []);
  const [newPersonInput, setNewPersonInput] = useState('');
  const [showPersonInput, setShowPersonInput] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialNote?.isFavorite || false);
  const [isPinned, setIsPinned] = useState(initialNote?.isPinned || false);
  const [isPrivate, setIsPrivate] = useState(initialNote?.isPrivate || false);

  // Validation & UI State
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mark dirty
  useEffect(() => {
    if (
      title !== (initialNote?.title || '') ||
      content !== (initialNote?.content || '') ||
      noteDate !== (initialNote?.noteDate || getTodayDateString()) ||
      noteTime !== (initialNote?.noteTime || getCurrentTimeString()) ||
      category !== (initialNote?.category || (categories[0] || 'Personal'))
    ) {
      setHasUnsavedChanges(true);
    }
  }, [title, content, noteDate, noteTime, category, initialNote, categories]);

  const handleClose = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to exit?')) {
      return;
    }
    onClose();
  };

  const handleAddTag = (tagToAdd: string) => {
    const normalized = normalizeTag(tagToAdd);
    if (!normalized) return;
    if (!tags.some((t) => t.toLowerCase() === normalized.toLowerCase())) {
      setTags([...tags, normalized]);
      setHasUnsavedChanges(true);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  const handleTogglePerson = (personName: string) => {
    if (people.includes(personName)) {
      setPeople(people.filter((p) => p !== personName));
    } else {
      setPeople([...people, personName]);
    }
    setHasUnsavedChanges(true);
  };

  const handleCreateNewPerson = async () => {
    const trimmed = newPersonInput.trim();
    if (!trimmed) return;
    try {
      const added = await onAddNewPerson(trimmed);
      if (!people.includes(added.name)) {
        setPeople([...people, added.name]);
      }
      setNewPersonInput('');
      setShowPersonInput(false);
      setHasUnsavedChanges(true);
    } catch (err) {
      console.warn('Error adding person:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required. Please enter a heading for your note.');
      return;
    }

    try {
      setIsSaving(true);
      setTitleError(null);
      await onSave({
        title: title.trim(),
        content,
        noteDate,
        noteTime,
        category,
        tags,
        people,
        isFavorite,
        isPinned,
        isPrivate
      });
      setHasUnsavedChanges(false);
      onClose();
    } catch (err: any) {
      setTitleError(err?.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialNote || !onDelete) return;
    try {
      setIsSaving(true);
      await onDelete(initialNote.id);
      onClose();
    } catch (err: any) {
      setTitleError(err?.message || 'Failed to delete note.');
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-form-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="neu-card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-gold-subtle)',
          boxShadow: 'var(--neu-shadow-raised-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-base)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2
              id="note-form-modal-title"
              className="gold-gradient-text"
              style={{
                fontSize: '1.125rem',
                letterSpacing: '0.03em',
                margin: 0
              }}
            >
              {isEditing ? 'EDIT NOTE' : 'NEW SECOND BRAIN NOTE'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close note editor"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-control)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            gap: '1.15rem'
          }}
        >
          {/* Validation Banner */}
          {titleError && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{titleError}</span>
            </div>
          )}

          {/* Title Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label
              htmlFor="note-title-input"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-gold)',
                letterSpacing: '0.02em'
              }}
            >
              NOTE HEADING *
            </label>
            <input
              id="note-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="e.g. Cognitive Biases in Decision Making"
              required
              autoFocus
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-control)',
                border: titleError
                  ? '1px solid #EF4444'
                  : '1px solid var(--border-gold-subtle)',
                boxShadow: 'var(--neu-shadow-recessed-sm)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Date, Time & Category Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {/* Date Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label
                htmlFor="note-date-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}
              >
                <Calendar size={13} color="var(--gold-primary)" /> Date
              </label>
              <input
                id="note-date-input"
                type="date"
                value={noteDate}
                onChange={(e) => {
                  setNoteDate(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                required
                className="neu-input"
                style={{
                  cursor: 'pointer',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
            </div>

            {/* Time Picker (Reminisce-style Liquid Gold Modern Time Picker) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label
                htmlFor="note-time-picker"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}
              >
                Time
              </label>
              <NotesTimePicker
                id="note-time-picker"
                value={noteTime}
                onChange={(t) => {
                  setNoteTime(t);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            {/* Category Select + Manage Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="note-category-select"
                  style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  Category
                </label>
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.6875rem',
                    color: 'var(--text-gold)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <FolderPlus size={11} />
                  <span>Manage</span>
                </button>
              </div>

              <select
                id="note-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-control)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rich-Text Writing Area with Visible Formatting Toolbar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-gold)',
                letterSpacing: '0.02em'
              }}
            >
              RICH TEXT NOTE WRITING AREA
            </label>
            <RichTextEditor
              value={content}
              onChange={(html) => {
                setContent(html);
                setHasUnsavedChanges(true);
              }}
              minHeight="220px"
            />
          </div>

          {/* Tags Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Tags (e.g. #Ideas, #Projects)
            </label>

            {/* Input to add tag */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
                placeholder="Type tag and press Enter (e.g. #Strategy)..."
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-control)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="neu-btn"
                style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  gap: '0.25rem'
                }}
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>

            {/* Suggested Tags */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Suggestions:</span>
              {SUGGESTED_TAGS.map((stag) => (
                <button
                  key={stag}
                  type="button"
                  onClick={() => handleAddTag(stag)}
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: tags.includes(stag)
                      ? 'rgba(212, 175, 55, 0.2)'
                      : 'var(--surface-base)',
                    border: tags.includes(stag)
                      ? '1px solid var(--border-gold-subtle)'
                      : '1px solid var(--border-subtle)',
                    color: tags.includes(stag) ? 'var(--text-gold)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {stag}
                </button>
              ))}
            </div>

            {/* Selected Tags Chips */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                {tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      border: '1px solid var(--border-gold-subtle)',
                      color: 'var(--text-gold)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    <Tag size={10} />
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-gold)',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: 0
                      }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* People Linking Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Linked People
              </label>
              <button
                type="button"
                onClick={() => setShowPersonInput(!showPersonInput)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.6875rem',
                  color: 'var(--text-gold)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <Plus size={11} />
                <span>Add Person</span>
              </button>
            </div>

            {/* Add person input */}
            {showPersonInput && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  value={newPersonInput}
                  onChange={(e) => setNewPersonInput(e.target.value)}
                  placeholder="Person name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateNewPerson();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-control)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateNewPerson}
                  className="neu-btn"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Save
                </button>
              </div>
            )}

            {/* People chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {peopleList.map((p) => {
                const isLinked = people.includes(p.name);
                return (
                  <button
                    key={p.id || p.name}
                    type="button"
                    onClick={() => handleTogglePerson(p.name)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isLinked
                        ? 'rgba(212, 175, 55, 0.16)'
                        : 'var(--surface-control)',
                      border: isLinked
                        ? '1px solid var(--border-gold-subtle)'
                        : '1px solid var(--border-subtle)',
                      color: isLinked ? 'var(--text-gold)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: isLinked ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <User size={11} color={isLinked ? 'var(--gold-primary)' : 'var(--text-muted)'} />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Toggles: Favorite, Pin, Privacy */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.65rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            {/* Favorite Toggle */}
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isFavorite
                  ? 'rgba(244, 63, 94, 0.12)'
                  : 'var(--surface-control)',
                border: isFavorite
                  ? '1px solid rgba(244, 63, 94, 0.35)'
                  : '1px solid var(--border-subtle)',
                color: isFavorite ? '#F43F5E' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Heart size={14} fill={isFavorite ? '#F43F5E' : 'none'} />
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isPinned
                  ? 'rgba(212, 175, 55, 0.16)'
                  : 'var(--surface-control)',
                border: isPinned
                  ? '1px solid var(--border-gold-subtle)'
                  : '1px solid var(--border-subtle)',
                color: isPinned ? 'var(--text-gold)' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Pin size={14} fill={isPinned ? 'var(--gold-primary)' : 'none'} />
              <span>{isPinned ? 'Pinned to Top' : 'Pin Note'}</span>
            </button>

            {/* Privacy Toggle */}
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isPrivate
                  ? 'rgba(212, 175, 55, 0.14)'
                  : 'var(--surface-control)',
                border: isPrivate
                  ? '1px solid var(--border-gold-subtle)'
                  : '1px solid var(--border-subtle)',
                color: isPrivate ? 'var(--text-gold)' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Lock size={14} />
              <span>{isPrivate ? 'Confidential' : 'Public'}</span>
            </button>
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div
              className="neu-inset"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} color="#EF4444" />
                <span style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}>
                  Permanently delete this note?
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#EF4444',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: 'auto'
            }}
          >
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (initialNote) onDelete(initialNote.id);
                }}
                title="Delete note"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#EF4444',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="neu-btn neu-btn-gold"
                style={{
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  gap: '0.45rem'
                }}
              >
                <Save size={15} />
                <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Note'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
