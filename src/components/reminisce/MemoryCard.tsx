import { useState } from 'react';
import type { MemoryItem } from '../../types/reminisce';
import {
  formatMemoryDate,
  formatMemoryTime,
  getElapsedTimeDisplay
} from '../../utils/reminisceUtils';
import {
  Heart,
  Pin,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Calendar,
  Clock,
  User,
  Sparkles
} from 'lucide-react';

export interface MemoryCardProps {
  key?: string;
  memory: MemoryItem;
  isRevealed: boolean;
  onToggleReveal: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onEdit: (memory: MemoryItem) => void;
}

export function MemoryCard({
  memory,
  isRevealed,
  onToggleReveal,
  onToggleFavorite,
  onEdit
}: MemoryCardProps) {
  const [favoriteHover, setFavoriteHover] = useState(false);
  const elapsedTime = getElapsedTimeDisplay(memory.memoryDate, memory.createdAt);
  const isPrivateHidden = memory.isPrivate && !isRevealed;

  return (
    <article
      id={`memory-card-${memory.id}`}
      className="neu-card"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        border: memory.isPinned
          ? '1.5px solid var(--border-gold-strong)'
          : 'var(--surface-card-border)',
        position: 'relative'
      }}
    >
      {/* Top Meta Bar: Badges, Mood, and Quick Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Mood Emoji */}
          <div
            className="neu-inset"
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-gold-subtle)',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
            }}
            title="Recorded Mood"
          >
            {memory.mood}
          </div>

          {/* Date & Time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              <Calendar size={13} color="var(--gold-primary)" />
              <span>{formatMemoryDate(memory.memoryDate)}</span>
            </div>

            {memory.memoryTime && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                <Clock size={12} />
                <span>{formatMemoryTime(memory.memoryTime)}</span>
              </div>
            )}
          </div>

          {/* Pinned Badge */}
          {memory.isPinned && (
            <span
              className="neu-inset"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-gold)',
                letterSpacing: '0.04em'
              }}
            >
              <Pin size={11} /> PINNED
            </span>
          )}

          {/* Privacy Badge */}
          {memory.isPrivate && (
            <span
              className="neu-inset"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em'
              }}
            >
              <Lock size={11} /> PRIVATE
            </span>
          )}
        </div>

        {/* Right Actions: Favorite & Edit Icon Entry Point */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Favorite Button */}
          <button
            id={`memory-fav-btn-${memory.id}`}
            type="button"
            onClick={() => onToggleFavorite(memory.id, memory.isFavorite)}
            onMouseEnter={() => setFavoriteHover(true)}
            onMouseLeave={() => setFavoriteHover(false)}
            className="neu-icon-btn"
            style={{
              width: '36px',
              height: '36px',
              color: memory.isFavorite
                ? 'var(--gold-primary)'
                : favoriteHover
                ? 'var(--text-gold)'
                : 'var(--text-muted)'
            }}
            title={memory.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            aria-label={memory.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          >
            <Heart
              size={16}
              fill={memory.isFavorite ? 'var(--gold-primary)' : 'none'}
              strokeWidth={memory.isFavorite ? 2.5 : 2}
            />
          </button>

          {/* Edit Icon Button (Only entry point for editing) */}
          <button
            id={`memory-edit-btn-${memory.id}`}
            type="button"
            onClick={() => onEdit(memory)}
            className="neu-icon-btn"
            style={{ width: '36px', height: '36px' }}
            title="Edit memory"
            aria-label="Edit memory"
          >
            <Edit3 size={15} />
          </button>
        </div>
      </div>

      {/* Elapsed Time Banner (Shown ONLY during first 24h of creation for today's memory) */}
      {elapsedTime && (
        <div
          className="neu-inset"
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--text-gold)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            width: 'fit-content'
          }}
        >
          <Sparkles size={13} color="var(--gold-primary)" />
          <span>{elapsedTime}</span>
        </div>
      )}

      {/* Content Area with Privacy Masking */}
      {isPrivateHidden ? (
        <div
          className="neu-inset"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            textAlign: 'center',
            backgroundColor: 'var(--surface-control)',
            border: '1px dashed var(--border-gold-subtle)'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-gold)',
              boxShadow: 'var(--neu-shadow-raised-sm)'
            }}
          >
            <Lock size={18} />
          </div>
          <div>
            <h4
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.15rem'
              }}
            >
              Private Memory Hidden
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              This memory is marked as confidential. Click below to reveal its contents.
            </p>
          </div>
          <button
            id={`memory-reveal-btn-${memory.id}`}
            type="button"
            onClick={() => onToggleReveal(memory.id)}
            className="neu-btn"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8125rem',
              gap: '0.4rem'
            }}
          >
            <Eye size={14} />
            <span>Reveal Memory</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Full Title (Never truncated with ellipses; wraps naturally across lines) */}
          <h3
            style={{
              fontSize: '1.1875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.45,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}
          >
            {memory.title}
          </h3>

          {/* Notes Paragraph */}
          {memory.notes && (
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {memory.notes}
            </p>
          )}

          {/* If private and revealed, allow hiding it again */}
          {memory.isPrivate && isRevealed && (
            <div style={{ paddingTop: '0.25rem' }}>
              <button
                id={`memory-hide-btn-${memory.id}`}
                type="button"
                onClick={() => onToggleReveal(memory.id)}
                className="neu-btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  gap: '0.35rem',
                  color: 'var(--text-muted)'
                }}
              >
                <EyeOff size={13} />
                <span>Hide private details</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* People Tagged Badges */}
      {memory.people && memory.people.length > 0 && !isPrivateHidden && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <User size={12} /> People:
          </span>
          {memory.people.map((personName) => (
            <span
              key={personName}
              className="neu-inset"
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                border: '1px solid var(--border-subtle)'
              }}
            >
              {personName}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
