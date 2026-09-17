import { useState, useEffect, type FormEvent } from 'react';
import type { MemoryItem, PersonItem } from '../../types/reminisce';
import { ALL_MOOD_EMOJIS } from '../../types/reminisce';
import {
  getTodayDateString,
  getCurrentTimeString
} from '../../utils/reminisceUtils';
import {
  X,
  Calendar,
  Clock,
  User,
  Plus,
  Lock,
  Pin,
  Heart,
  Trash2,
  Check,
  AlertTriangle
} from 'lucide-react';

interface MemoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<MemoryItem, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  editingMemory?: MemoryItem | null;
  existingPeople: PersonItem[];
  onAddNewPerson: (name: string) => Promise<PersonItem>;
}

export function MemoryFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingMemory,
  existingPeople,
  onAddNewPerson
}: MemoryFormModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [memoryDate, setMemoryDate] = useState(getTodayDateString());
  const [memoryTime, setMemoryTime] = useState(getCurrentTimeString());
  const [mood, setMood] = useState('😀');
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // New person inline addition state
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [personError, setPersonError] = useState('');

  // Validation & saving state
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title);
      setNotes(editingMemory.notes);
      setMemoryDate(editingMemory.memoryDate);
      setMemoryTime(editingMemory.memoryTime || getCurrentTimeString());
      setMood(editingMemory.mood || '😀');
      setSelectedPeople(editingMemory.people || []);
      setIsPrivate(editingMemory.isPrivate);
      setIsPinned(editingMemory.isPinned);
      setIsFavorite(editingMemory.isFavorite);
    } else {
      setTitle('');
      setNotes('');
      setMemoryDate(getTodayDateString());
      setMemoryTime(getCurrentTimeString());
      setMood('😀');
      setSelectedPeople([]);
      setIsPrivate(false);
      setIsPinned(false);
      setIsFavorite(false);
    }
    setValidationError('');
    setIsAddingPerson(false);
    setNewPersonName('');
    setPersonError('');
    setShowDeleteConfirm(false);
  }, [editingMemory, isOpen]);

  if (!isOpen) return null;

  const handleTogglePerson = (name: string) => {
    setSelectedPeople((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) {
      setPersonError('Please enter a name');
      return;
    }
    try {
      const created = await onAddNewPerson(newPersonName.trim());
      setSelectedPeople((prev) => (prev.includes(created.name) ? prev : [...prev, created.name]));
      setNewPersonName('');
      setIsAddingPerson(false);
      setPersonError('');
    } catch {
      setPersonError('Could not add person');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a title for your memory.');
      return;
    }
    if (!memoryDate) {
      setValidationError('Please select a memory date.');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        notes: notes.trim(),
        memoryDate,
        memoryTime,
        mood,
        people: selectedPeople,
        isPrivate,
        isPinned,
        isFavorite
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving memory:', err);
      setValidationError(err?.message || 'Failed to save memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingMemory || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(editingMemory.id);
      onClose();
    } catch (err: any) {
      console.error('Error deleting memory:', err);
      setValidationError(err?.message || 'Failed to delete memory.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="neu-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--neu-shadow-raised-lg), 0 20px 40px rgba(0,0,0,0.5)',
          border: '1.5px solid var(--border-gold-strong)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-control)',
                boxShadow: 'var(--neu-shadow-raised-sm)',
                border: '1px solid var(--border-gold-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem'
              }}
            >
              {mood}
            </div>
            <div>
              <h2
                className="font-display"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.04em'
                }}
              >
                {editingMemory ? 'Edit Memory' : 'Add Memory'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Preserve a meaningful moment in your Second Brain sanctuary.
              </span>
            </div>
          </div>

          <button
            id="close-memory-modal-btn"
            type="button"
            onClick={onClose}
            className="neu-icon-btn"
            style={{ width: '36px', height: '36px' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {validationError && (
            <div
              className="neu-inset"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                color: '#EF4444',
                fontSize: '0.8125rem',
                border: '1px solid rgba(239, 68, 68, 0.4)'
              }}
            >
              {validationError}
            </div>
          )}

          {/* Date and Time Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* Date Input */}
            <div>
              <label
                htmlFor="memory-date-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem'
                }}
              >
                <Calendar size={14} color="var(--gold-primary)" /> Date
              </label>
              <input
                id="memory-date-input"
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                required
                className="neu-input"
                style={{ cursor: 'pointer' }}
              />
            </div>

            {/* Time Input */}
            <div>
              <label
                htmlFor="memory-time-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem'
                }}
              >
                <Clock size={14} color="var(--gold-primary)" /> Time
              </label>
              <input
                id="memory-time-input"
                type="time"
                value={memoryTime}
                onChange={(e) => setMemoryTime(e.target.value)}
                className="neu-input"
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Title Input (Full Title, no truncation) */}
          <div>
            <label
              htmlFor="memory-title-input"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem'
              }}
            >
              Title <span style={{ color: 'var(--text-gold)' }}>*</span>
            </label>
            <input
              id="memory-title-input"
              type="text"
              placeholder="A descriptive heading for this moment..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="neu-input"
              style={{ fontSize: '1rem' }}
            />
          </div>

          {/* Notes Multiline Input */}
          <div>
            <label
              htmlFor="memory-notes-input"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem'
              }}
            >
              Notes & Reflections
            </label>
            <textarea
              id="memory-notes-input"
              rows={4}
              placeholder="What happened? How did it feel? Capture the atmosphere, thoughts, and memories..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="neu-input"
              style={{ resize: 'vertical', lineHeight: 1.55 }}
            />
          </div>

          {/* Mood Selection: Apple iOS emojis only, NO category names, NO counts */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}
            >
              Select Mood
            </label>
            <div
              className="neu-inset"
              style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.625rem',
                alignItems: 'center'
              }}
            >
              {ALL_MOOD_EMOJIS.map((emojiChar) => {
                const isSelected = mood === emojiChar;
                return (
                  <button
                    key={emojiChar}
                    type="button"
                    onClick={() => setMood(emojiChar)}
                    className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                    style={{
                      width: '44px',
                      height: '44px',
                      padding: 0,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                      border: isSelected
                        ? '2px solid var(--border-gold-strong)'
                        : '1px solid var(--border-subtle)',
                      boxShadow: isSelected
                        ? 'var(--neu-shadow-recessed-sm), 0 0 10px rgba(212, 175, 55, 0.4)'
                        : 'var(--neu-shadow-raised-sm)',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.18s ease'
                    }}
                    aria-label={`Select mood ${emojiChar}`}
                  >
                    <span>{emojiChar}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* People Section: Dropdown / multi-select with inline (+) add person */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              >
                <User size={14} color="var(--gold-primary)" /> Connected People
              </label>

              {!isAddingPerson && (
                <button
                  type="button"
                  onClick={() => setIsAddingPerson(true)}
                  className="neu-btn"
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={13} /> Add Person
                </button>
              )}
            </div>

            {/* Inline Person Creator */}
            {isAddingPerson && (
              <div
                className="neu-inset"
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}
              >
                <input
                  type="text"
                  placeholder="Enter person's full name..."
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="neu-input"
                  style={{ flex: 1, minWidth: '160px', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreatePerson}
                  className="neu-btn neu-btn-gold"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                >
                  Save Person
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPerson(false);
                    setNewPersonName('');
                    setPersonError('');
                  }}
                  className="neu-btn neu-btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
                {personError && (
                  <span style={{ width: '100%', fontSize: '0.75rem', color: '#EF4444' }}>
                    {personError}
                  </span>
                )}
              </div>
            )}

            {/* Existing People Selection Chips */}
            <div
              className="neu-inset"
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                minHeight: '48px',
                alignItems: 'center'
              }}
            >
              {existingPeople.length === 0 && !isAddingPerson ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  No people added yet. Click &quot;Add Person&quot; above to create one.
                </span>
              ) : (
                existingPeople.map((person) => {
                  const isSelected = selectedPeople.includes(person.name);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleTogglePerson(person.name)}
                      className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        gap: '0.35rem'
                      }}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{person.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Privacy, Pin, and Favorite Toggle Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            {/* Privacy Toggle */}
            <button
              id="form-privacy-toggle"
              type="button"
              onClick={() => setIsPrivate((p) => !p)}
              className={`neu-btn ${isPrivate ? 'active' : ''}`}
              style={{
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                fontSize: '0.8125rem',
                borderColor: isPrivate ? 'var(--border-gold-strong)' : 'var(--border-subtle)'
              }}
            >
              <Lock size={15} color={isPrivate ? 'var(--gold-primary)' : 'currentColor'} />
              <span>{isPrivate ? 'Private (Hidden)' : 'Public Memory'}</span>
            </button>

            {/* Pin Toggle */}
            <button
              id="form-pin-toggle"
              type="button"
              onClick={() => setIsPinned((p) => !p)}
              className={`neu-btn ${isPinned ? 'active' : ''}`}
              style={{
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                fontSize: '0.8125rem',
                borderColor: isPinned ? 'var(--border-gold-strong)' : 'var(--border-subtle)'
              }}
            >
              <Pin size={15} color={isPinned ? 'var(--gold-primary)' : 'currentColor'} />
              <span>{isPinned ? 'Pinned to Top' : 'Not Pinned'}</span>
            </button>

            {/* Favorite Toggle */}
            <button
              id="form-favorite-toggle"
              type="button"
              onClick={() => setIsFavorite((f) => !f)}
              className={`neu-btn ${isFavorite ? 'active' : ''}`}
              style={{
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                fontSize: '0.8125rem',
                borderColor: isFavorite ? 'var(--border-gold-strong)' : 'var(--border-subtle)'
              }}
            >
              <Heart
                size={15}
                fill={isFavorite ? 'var(--gold-primary)' : 'none'}
                color={isFavorite ? 'var(--gold-primary)' : 'currentColor'}
              />
              <span>{isFavorite ? 'Favorite Memory' : 'Add to Favorites'}</span>
            </button>
          </div>

          {/* In-Modal Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div
              className="neu-inset"
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444' }}>
                <AlertTriangle size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Confirm Memory Deletion
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete this memory? This action cannot be undone.
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.75rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="neu-btn neu-btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-memory-btn"
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="neu-btn neu-btn-danger"
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Memory'}
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions Footer: Save, Cancel, and Delete (in edit mode) */}
          <div
            style={{
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            {editingMemory && onDelete ? (
              <button
                id="delete-memory-btn"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || showDeleteConfirm}
                className="neu-btn neu-btn-danger"
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.8125rem'
                }}
              >
                <Trash2 size={15} />
                <span>Delete Memory</span>
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                id="cancel-memory-btn"
                type="button"
                onClick={onClose}
                className="neu-btn neu-btn-secondary"
                style={{ padding: '0.65rem 1.25rem' }}
              >
                Cancel
              </button>

              <button
                id="save-memory-btn"
                type="submit"
                disabled={isSubmitting}
                className="neu-btn neu-btn-gold"
                style={{ padding: '0.65rem 1.5rem' }}
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingMemory
                  ? 'Save Changes'
                  : 'Save Memory'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
