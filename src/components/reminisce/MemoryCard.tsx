import { useState } from 'react';
import type { MemoryItem } from '../../types/reminisce';
import {
  formatMemoryTime,
  parseMemoryDateParts
} from '../../utils/reminisceUtils';
import {
  Heart,
  Pin,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  User
} from 'lucide-react';

export interface MemoryCardProps {
  key?: string;
  memory: MemoryItem;
  isRevealed: boolean;
  onToggleReveal: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onTogglePrivate: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onEdit: (memory: MemoryItem) => void;
}

/**
 * COMPACT CARD — VARIATION 1: DATE RAIL ON THE LEFT
 * 
 * Layout:
 * ┌─────────────────────────────────────────────────┐
 * │  DATE RAIL  │  MOOD + TIME          PINNED      │
 * │             │                                  │
 * │             │  MEMORY TITLE                    │
 * │             │  Memory content                  │
 * │             │                                  │
 * │             │  PEOPLE                           │
 * │             │                                  │
 * │             │  LIKE  PRIVATE  PIN  EDIT         │
 * └─────────────────────────────────────────────────┘
 */
export function MemoryCard({
  memory,
  isRevealed,
  onToggleReveal,
  onToggleFavorite,
  onTogglePrivate,
  onTogglePin,
  onEdit
}: MemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPrivateHidden = memory.isPrivate && !isRevealed;
  const { month, day, year } = parseMemoryDateParts(memory.memoryDate);

  // Formatted 12-hour memory time (e.g. "2:24 AM")
  const formattedTime = memory.memoryTime ? formatMemoryTime(memory.memoryTime) : '';

  // People association logic
  const peopleList = memory.people || [];
  const maxDisplayPeople = 2;
  const visiblePeople = peopleList.slice(0, maxDisplayPeople);
  const remainingPeopleCount = peopleList.length - maxDisplayPeople;

  // Content preview and truncation
  const contentText = memory.notes || '';
  const isLongContent = contentText.length > 150;
  const displayContent = isLongContent && !isExpanded
    ? contentText.slice(0, 150).trim() + '...'
    : contentText;

  return (
    <article
      id={`memory-card-${memory.id}`}
      className={`neu-card reminisce-compact-card ${memory.isPinned ? 'is-pinned' : ''}`}
    >
      {/* 2. DATE RAIL — LEFT SIDE */}
      <div
        className="reminisce-date-rail"
        aria-label={`Date: ${month} ${day}, ${year}`}
      >
        <span className="reminisce-date-rail-month">{month}</span>
        <span className="reminisce-date-rail-day">{day}</span>
        <span className="reminisce-date-rail-year">{year}</span>
      </div>

      {/* MAIN CONTENT AREA — RIGHT SIDE */}
      <div className="reminisce-card-main">
        {/* 3. TOP METADATA ROW: MOOD + TIME, PINNED BADGE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            width: '100%',
            minWidth: 0
          }}
        >
          {/* Left: Mood Emoji + Memory Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
            {/* Mood Emoji Container: Small rounded square */}
            <div
              className="neu-inset"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                flexShrink: 0,
                border: '1px solid var(--border-gold-subtle)',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
              }}
              title={`Mood: ${memory.mood}`}
              aria-label={`Mood: ${memory.mood}`}
            >
              <span>{memory.mood}</span>
            </div>

            {/* Memory Time */}
            {formattedTime && (
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {formattedTime}
              </span>
            )}
          </div>

          {/* Right: Badges (Private indicator + Pinned floating badge) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            {memory.isPrivate && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.18rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  letterSpacing: '0.04em'
                }}
                title="Confidential memory"
              >
                <Lock size={10} /> PRIVATE
              </span>
            )}

            {/* Pinned Badge (Hidden if not pinned) */}
            {memory.isPinned && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.18rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-gold)',
                  backgroundColor: 'rgba(212, 175, 55, 0.14)',
                  border: '1px solid var(--border-gold-subtle)',
                  letterSpacing: '0.04em'
                }}
                title="Pinned memory"
              >
                <Pin size={10} color="var(--gold-primary)" /> PINNED
              </span>
            )}
          </div>
        </div>

        {/* 4. MEMORY TITLE */}
        <h3
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.38,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            margin: 0
          }}
        >
          {memory.title}
        </h3>

        {/* 5. MEMORY CONTENT */}
        {isPrivateHidden ? (
          <div
            className="neu-inset"
            style={{
              padding: '0.75rem 1rem',
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
              <Lock size={14} color="var(--text-gold)" />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Confidential memory
              </span>
            </div>

            {/* Aura Gold Liquid Reveal Button */}
            <div className="aura aura-gold">
              <div className="card bg-base-100">
                <div className="card-body">
                  <button
                    id={`memory-reveal-btn-${memory.id}`}
                    type="button"
                    onClick={() => onToggleReveal(memory.id)}
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
                  >
                    <Eye size={13} color="var(--gold-primary)" />
                    <span>Reveal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {contentText && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  margin: 0
                }}
              >
                {displayContent}
                {isLongContent && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      marginLeft: '0.35rem',
                      padding: 0,
                      outline: 'none',
                      textDecoration: 'underline'
                    }}
                  >
                    {isExpanded ? 'less' : 'more'}
                  </button>
                )}
              </p>
            )}

            {/* Aura Gold Liquid Hide Button */}
            {memory.isPrivate && isRevealed && (
              <div className="aura aura-gold" style={{ marginTop: '0.45rem' }}>
                <div className="card bg-base-100">
                  <div className="card-body">
                    <button
                      id={`memory-hide-btn-${memory.id}`}
                      type="button"
                      onClick={() => onToggleReveal(memory.id)}
                      className="neu-btn"
                      style={{
                        padding: '0.25rem 0.65rem',
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
                    >
                      <EyeOff size={13} color="var(--gold-primary)" />
                      <span>Hide</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. PEOPLE SECTION (Hidden if no people associated) */}
        {peopleList.length > 0 && !isPrivateHidden && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexWrap: 'wrap',
              marginTop: '0.25rem'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--gold-primary)',
                marginRight: '0.15rem'
              }}
              title="Associated People"
            >
              <User size={12} />
            </span>

            {visiblePeople.map((person) => (
              <span
                key={person}
                className="neu-inset"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap'
                }}
              >
                {person}
              </span>
            ))}

            {remainingPeopleCount > 0 && (
              <span
                className="neu-inset"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--text-gold)',
                  fontWeight: 700,
                  border: '1px solid var(--border-gold-subtle)'
                }}
                title={peopleList.slice(maxDisplayPeople).join(', ')}
              >
                +{remainingPeopleCount}
              </span>
            )}
          </div>
        )}

        {/* 7. FLOATING ACTION BUTTONS: favorites then public/private then pin then edit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            marginTop: 'auto',
            paddingTop: '0.4rem'
          }}
        >
          {/* 1st: Favorites (Like) */}
          <button
            id={`memory-fav-btn-${memory.id}`}
            type="button"
            onClick={() => onToggleFavorite(memory.id, memory.isFavorite)}
            className={`reminisce-fab-btn ${memory.isFavorite ? 'is-active' : ''}`}
            title={memory.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            aria-label={memory.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          >
            <Heart
              size={14}
              fill={memory.isFavorite ? 'var(--gold-primary)' : 'none'}
              color={memory.isFavorite ? 'var(--gold-primary)' : 'var(--text-secondary)'}
              strokeWidth={memory.isFavorite ? 2.5 : 2}
            />
          </button>

          {/* 2nd: Public / Private */}
          <button
            id={`memory-private-btn-${memory.id}`}
            type="button"
            onClick={() => onTogglePrivate(memory.id, memory.isPrivate)}
            className={`reminisce-fab-btn ${memory.isPrivate ? 'is-active' : ''}`}
            title={memory.isPrivate ? 'Make memory public' : 'Make memory private'}
            aria-label={memory.isPrivate ? 'Make memory public' : 'Make memory private'}
          >
            <Lock
              size={13}
              color={memory.isPrivate ? 'var(--gold-primary)' : 'var(--text-secondary)'}
            />
          </button>

          {/* 3rd: Pin */}
          <button
            id={`memory-pin-btn-${memory.id}`}
            type="button"
            onClick={() => onTogglePin(memory.id, memory.isPinned)}
            className={`reminisce-fab-btn ${memory.isPinned ? 'is-active' : ''}`}
            title={memory.isPinned ? 'Unpin memory' : 'Pin memory to top'}
            aria-label={memory.isPinned ? 'Unpin memory' : 'Pin memory to top'}
          >
            <Pin
              size={13}
              color={memory.isPinned ? 'var(--gold-primary)' : 'var(--text-secondary)'}
            />
          </button>

          {/* 4th: Edit */}
          <button
            id={`memory-edit-btn-${memory.id}`}
            type="button"
            onClick={() => onEdit(memory)}
            className="reminisce-fab-btn"
            title="Edit memory"
            aria-label="Edit memory"
          >
            <Edit3 size={13} color="var(--text-secondary)" />
          </button>
        </div>
      </div>
    </article>
  );
}
