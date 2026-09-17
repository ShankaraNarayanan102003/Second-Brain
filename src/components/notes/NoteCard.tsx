import React from 'react';
import {
  Pin,
  Heart,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Tag,
  User,
  Pencil,
  Trash2
} from 'lucide-react';
import type { NoteItem } from '../../types/notes';
import { formatMemoryDate, formatMemoryTime, stripHtmlToText, formatRelativeTime } from '../../utils/notesUtils';

interface NoteCardProps {
  key?: string;
  note: NoteItem;
  isRevealed: boolean;
  onToggleReveal: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onTogglePrivate: (id: string, current: boolean) => void;
  onEdit: (note: NoteItem) => void;
  onDelete: (id: string) => void;
  onOpen: (note: NoteItem) => void;
}

export function NoteCard({
  note,
  isRevealed,
  onToggleReveal,
  onToggleFavorite,
  onTogglePin,
  onTogglePrivate,
  onEdit,
  onDelete,
  onOpen
}: NoteCardProps) {
  const isPrivateHidden = note.isPrivate && !isRevealed;
  const formattedDate = formatMemoryDate(note.noteDate);
  const formattedTime = formatMemoryTime(note.noteTime);
  const rawPreview = stripHtmlToText(note.content);
  const previewText = rawPreview.length > 200 ? `${rawPreview.substring(0, 200)}...` : rawPreview;

  return (
    <article
      id={`note-card-${note.id}`}
      className="neu-card"
      onClick={() => onOpen(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            onOpen(note);
          }
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface-card)',
        border: note.isPinned
          ? '1px solid var(--border-gold-strong)'
          : '1px solid var(--border-subtle)',
        boxShadow: note.isPinned
          ? '0 0 16px rgba(212, 175, 55, 0.16), var(--neu-shadow-raised-md)'
          : 'var(--neu-shadow-raised-md)',
        transition: 'var(--neu-transition)',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      {/* 1. TOP ROW: CATEGORY + DATE/TIME + PINNED & PRIVATE STATUS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Category Chip */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-gold)',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid var(--border-gold-subtle)',
              padding: '0.18rem 0.65rem',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            {note.category || 'General'}
          </span>

          {/* Date & Time */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}
          >
            <Calendar size={12} color="var(--gold-primary)" />
            <span>{formattedDate}</span>
            {formattedTime && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <Clock size={12} color="var(--text-muted)" />
                <span>{formattedTime}</span>
              </>
            )}
          </div>
        </div>

        {/* Status Indicators: Pinned & Private */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                padding: '0.18rem 0.55rem',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.04em'
              }}
              title="Pinned Note"
            >
              <Pin size={11} color="var(--gold-primary)" /> PINNED
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
                padding: '0.18rem 0.5rem',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.04em'
              }}
              title="Private Note"
            >
              <Lock size={11} /> PRIVATE
            </span>
          )}
        </div>
      </div>

      {/* 2. FULL NOTE TITLE (No truncation, wraps naturally) */}
      <h3
        onClick={() => onOpen(note)}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: '1.4',
          margin: 0,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          cursor: 'pointer',
          transition: 'color 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-gold)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
      >
        {note.title}
      </h3>

      {/* 3. NOTE CONTENT / PREVIEW */}
      {isPrivateHidden ? (
        <div
          className="neu-inset"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            backgroundColor: 'var(--surface-control)',
            border: '1px dashed var(--border-gold-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <Lock size={15} color="var(--text-gold)" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Confidential note content
            </span>
          </div>

          {/* Aura Gold Liquid Reveal Button */}
          <div className="aura aura-gold">
            <div className="card bg-base-100">
              <div className="card-body">
                <button
                  id={`note-reveal-btn-${note.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReveal(note.id);
                  }}
                  className="neu-btn"
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    gap: '0.35rem',
                    borderRadius: 'calc(var(--radius-sm, 8px) - 1.5px)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-gold)',
                    fontWeight: 600,
                    border: 'none',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                  aria-label={`Reveal confidential note ${note.title}`}
                >
                  <Eye size={13} color="var(--gold-primary)" />
                  <span>Reveal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {previewText ? (
            <p
              onClick={() => onOpen(note)}
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.55',
                margin: 0,
                wordBreak: 'break-word',
                cursor: 'pointer'
              }}
            >
              {previewText}
            </p>
          ) : (
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No text content
            </span>
          )}

          {/* If private and revealed, allow hiding again */}
          {note.isPrivate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleReveal(note.id);
              }}
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.2rem 0'
              }}
              aria-label="Hide confidential content"
            >
              <EyeOff size={11} /> Hide again
            </button>
          )}
        </div>
      )}

      {/* 4. TAGS & LINKED PEOPLE */}
      {(note.tags?.length > 0 || note.people?.length > 0) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.35rem',
            paddingTop: '0.35rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          {/* Tags */}
          {note.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-control)',
                border: '1px solid var(--border-subtle)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <Tag size={10} color="var(--gold-primary)" />
              {tag}
            </span>
          ))}

          {/* People */}
          {note.people.map((person) => (
            <span
              key={person}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-gold)',
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid var(--border-gold-subtle)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <User size={10} color="var(--gold-primary)" />
              {person}
            </span>
          ))}
        </div>
      )}

      {/* 5. CARD ACTIONS BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto'
        }}
      >
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          Updated {formatRelativeTime(note.updatedAt)}
        </span>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(note.id, note.isFavorite);
            }}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={note.isFavorite ? 'Favorited' : 'Not favorited'}
            style={{
              ...actionBtnStyle,
              color: note.isFavorite ? '#F43F5E' : 'var(--text-muted)',
              backgroundColor: note.isFavorite ? 'rgba(244, 63, 94, 0.12)' : 'var(--surface-control)',
              borderColor: note.isFavorite ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)'
            }}
          >
            <Heart size={14} fill={note.isFavorite ? '#F43F5E' : 'none'} />
          </button>

          {/* Pin Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id, note.isPinned);
            }}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
            aria-label={note.isPinned ? 'Pinned' : 'Not pinned'}
            style={{
              ...actionBtnStyle,
              color: note.isPinned ? 'var(--text-gold)' : 'var(--text-muted)',
              backgroundColor: note.isPinned ? 'rgba(212, 175, 55, 0.15)' : 'var(--surface-control)',
              borderColor: note.isPinned ? 'var(--border-gold-subtle)' : 'var(--border-subtle)'
            }}
          >
            <Pin size={14} fill={note.isPinned ? 'var(--gold-primary)' : 'none'} />
          </button>

          {/* Privacy Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePrivate(note.id, note.isPrivate);
            }}
            title={note.isPrivate ? 'Make public' : 'Make private'}
            aria-label={note.isPrivate ? 'Private' : 'Public'}
            style={{
              ...actionBtnStyle,
              color: note.isPrivate ? 'var(--text-gold)' : 'var(--text-muted)'
            }}
          >
            <Lock size={14} />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            title="Edit Note"
            aria-label="Edit note"
            style={actionBtnStyle}
          >
            <Pencil size={14} />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            title="Delete Note"
            aria-label="Delete note"
            style={{
              ...actionBtnStyle,
              color: '#EF4444'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

const actionBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: 'var(--radius-sm, 8px)',
  backgroundColor: 'var(--surface-control)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};
