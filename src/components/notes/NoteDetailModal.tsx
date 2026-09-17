import React, { useRef } from 'react';
import {
  X,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Pin,
  Heart,
  Lock,
  Tag,
  User,
  Share2
} from 'lucide-react';
import type { NoteItem } from '../../types/notes';
import { formatMemoryDate, formatMemoryTime } from '../../utils/notesUtils';

interface NoteDetailModalProps {
  note: NoteItem | null;
  onClose: () => void;
  onEdit: (note: NoteItem) => void;
  onDelete?: (note: NoteItem) => void;
  onToggleChecklist?: (noteId: string, updatedContent: string) => void;
}

export function NoteDetailModal({ note, onClose, onEdit, onDelete, onToggleChecklist }: NoteDetailModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  if (!note) return null;

  const formattedDate = formatMemoryDate(note.noteDate);
  const formattedTime = formatMemoryTime(note.noteTime);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const cb = target as HTMLInputElement;
      const isChecked = cb.checked;
      if (isChecked) {
        cb.setAttribute('checked', 'checked');
      } else {
        cb.removeAttribute('checked');
      }
      const itemRow = cb.closest('.note-checklist-item') || cb.parentElement;
      if (itemRow) {
        itemRow.setAttribute('data-checked', isChecked ? 'true' : 'false');
        const textSpan = itemRow.querySelector('.note-checklist-text') as HTMLElement;
        if (textSpan) {
          if (isChecked) {
            textSpan.style.textDecoration = 'line-through';
            textSpan.style.opacity = '0.6';
          } else {
            textSpan.style.textDecoration = 'none';
            textSpan.style.opacity = '1';
          }
        }
      }
      if (contentRef.current && onToggleChecklist) {
        onToggleChecklist(note.id, contentRef.current.innerHTML);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
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
          maxWidth: '680px',
          maxHeight: '90vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-gold)',
                backgroundColor: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid var(--border-gold-subtle)',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-pill)'
              }}
            >
              {note.category || 'General'}
            </span>

            {note.isPinned && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-gold)',
                  backgroundColor: 'rgba(212, 175, 55, 0.16)',
                  border: '1px solid var(--border-gold-subtle)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-pill)'
                }}
              >
                <Pin size={10} color="var(--gold-primary)" /> PINNED
              </span>
            )}

            {note.isPrivate && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-pill)'
                }}
              >
                <Lock size={10} /> PRIVATE
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(note);
                }}
                title="Delete note"
                aria-label="Delete note"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#EF4444',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className="neu-btn neu-btn-gold"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <Pencil size={13} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              aria-label="Close note view"
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
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* Note Title */}
          <h2
            id="note-detail-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              wordBreak: 'break-word',
              margin: 0
            }}
          >
            {note.title}
          </h2>

          {/* Date & Time Rail */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} color="var(--gold-primary)" />
              <span>{formattedDate}</span>
            </div>
            {formattedTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={13} color="var(--text-muted)" />
                <span>{formattedTime}</span>
              </div>
            )}
          </div>

          {/* Formatted Content */}
          <div
            ref={contentRef}
            onClick={handleContentClick}
            className="notes-content-display"
            dangerouslySetInnerHTML={{ __html: note.content || '<p><em>No content</em></p>' }}
            style={{
              fontSize: '0.9375rem',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
              minHeight: '120px',
              cursor: 'default'
            }}
          />

          {/* People & Tags Footer */}
          {(note.tags?.length > 0 || note.people?.length > 0) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              {note.people?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Linked People:
                  </span>
                  {note.people.map((person) => (
                    <span
                      key={person}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-gold)',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid var(--border-gold-subtle)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <User size={11} color="var(--gold-primary)" />
                      {person}
                    </span>
                  ))}
                </div>
              )}

              {note.tags?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Tags:
                  </span>
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--surface-control)',
                        border: '1px solid var(--border-subtle)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <Tag size={11} color="var(--gold-primary)" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
