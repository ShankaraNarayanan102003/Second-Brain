import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, AlertTriangle, Check, Folder } from 'lucide-react';
import type { NoteItem } from '../../types/notes';
import { DEFAULT_CATEGORIES } from '../../types/notes';

interface CategoryManagerModalProps {
  categories: string[];
  notes: NoteItem[];
  onClose: () => void;
  onAddCategory: (name: string) => Promise<any>;
  onUpdateCategory: (oldName: string, newName: string) => Promise<any>;
  onDeleteCategory: (categoryName: string, reassignTo?: string) => Promise<any>;
}

export function CategoryManagerModal({
  categories,
  notes,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: CategoryManagerModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [reassignCategory, setReassignCategory] = useState<string>('Other');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Count notes using the category being deleted
  const affectedNotes = deletingCat ? notes.filter((n) => n.category === deletingCat) : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('A category with this name already exists.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onAddCategory(trimmed);
      setNewCatName('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: string) => {
    setEditingCat(cat);
    setEditCatName(cat);
    setErrorMsg(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCat) return;
    const trimmed = editCatName.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }
    if (
      trimmed.toLowerCase() !== editingCat.toLowerCase() &&
      categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
    ) {
      setErrorMsg('A category with this name already exists.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onUpdateCategory(editingCat, trimmed);
      setEditingCat(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCat) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onDeleteCategory(deletingCat, reassignCategory);
      setDeletingCat(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="neu-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
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
            <Folder size={18} color="var(--gold-primary)" />
            <h2
              id="category-manager-title"
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0
              }}
            >
              Manage Categories
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close category manager"
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

        {/* Content */}
        <div
          style={{
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Add Category Form */}
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name..."
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-control)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCatName.trim()}
              className="neu-btn neu-btn-gold"
              style={{
                padding: '0.65rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                gap: '0.35rem'
              }}
            >
              <Plus size={15} />
              <span>Add</span>
            </button>
          </form>

          {errorMsg && (
            <div
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Delete Warning Dialog if active */}
          {deletingCat && (
            <div
              className="neu-inset"
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-control)',
                border: '1px solid var(--border-gold-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <AlertTriangle size={18} color="var(--gold-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Delete category "{deletingCat}"?
                  </span>
                  {affectedNotes.length > 0 ? (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>{affectedNotes.length}</strong> note{affectedNotes.length > 1 ? 's are' : ' is'} currently in this category. Deleting will not delete your notes. Select where to move them:
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      No notes are using this category. Are you sure you want to remove it?
                    </span>
                  )}
                </div>
              </div>

              {affectedNotes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Move notes to:</label>
                  <select
                    value={reassignCategory}
                    onChange={(e) => setReassignCategory(e.target.value)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  >
                    {categories
                      .filter((c) => c !== deletingCat)
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  style={{
                    padding: '0.45rem 0.85rem',
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
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.45rem 0.85rem',
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

          {/* Category List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Available Categories ({categories.length})
            </span>

            {categories.map((cat) => {
              const noteCount = notes.filter((n) => n.category === cat).length;
              const isEditing = editingCat === cat;

              return (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-base)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingCat(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-control)',
                          border: '1px solid var(--border-gold-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8125rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--gold-primary)',
                          color: '#12151B',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCat(null)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {cat}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--surface-control)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: 'var(--radius-pill)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          title={`Edit ${cat}`}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-control)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCat(cat)}
                          title={`Delete ${cat}`}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-control)',
                            border: '1px solid var(--border-subtle)',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
