import { useState } from 'react';
import type { MemoryItem } from '../../types/reminisce';
import {
  formatMemoryDate,
  formatMemoryTime,
  getElapsedTimeDisplay
} from '../../utils/reminisceUtils';
import {
  Calendar,
  Clock,
  Heart,
  Edit3,
  Pin,
  Lock,
  Eye,
  User,
  Sparkles
} from 'lucide-react';

interface MemoryTimelineViewProps {
  memories: MemoryItem[];
  revealedMemoryIds: Set<string>;
  onToggleReveal: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onEdit: (memory: MemoryItem) => void;
}

export function MemoryTimelineView({
  memories,
  revealedMemoryIds,
  onToggleReveal,
  onToggleFavorite,
  onEdit
}: MemoryTimelineViewProps) {
  const [favoriteHoverId, setFavoriteHoverId] = useState<string | null>(null);

  if (memories.length === 0) {
    return null;
  }

  return (
    <div className="reminisce-timeline-container" style={{ position: 'relative', width: '100%', padding: '1.5rem 0' }}>
      {/* Central spine line (Desktop: 50% center, Mobile: left 24px) */}
      <div className="timeline-spine-line" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
        {memories.map((memory, index) => {
          const isEven = index % 2 === 0;
          const isRevealed = revealedMemoryIds.has(memory.id);
          const isPrivateHidden = memory.isPrivate && !isRevealed;
          const elapsedTime = getElapsedTimeDisplay(memory.memoryDate, memory.createdAt);
          const isFavHover = favoriteHoverId === memory.id;

          return (
            <div
              key={memory.id}
              className={`timeline-row ${isEven ? 'timeline-row-left' : 'timeline-row-right'}`}
            >
              {/* Snapped Mood Icon Node on the Vertical Spine */}
              <div
                className="timeline-node-marker neu-inset"
                title={`Mood: ${memory.mood}`}
                style={{
                  border: memory.isPinned
                    ? '2px solid var(--border-gold-strong)'
                    : '1.5px solid var(--border-gold-subtle)'
                }}
              >
                <span>{memory.mood}</span>
              </div>

              {/* Memory Timeline Card Content */}
              <div className="timeline-card-wrapper">
                <article
                  id={`timeline-card-${memory.id}`}
                  className="neu-card"
                  style={{
                    padding: '1.25rem',
                    border: memory.isPinned
                      ? '1.5px solid var(--border-gold-strong)'
                      : 'var(--surface-card-border)',
                    boxShadow: memory.isPinned
                      ? 'var(--neu-shadow-raised-md), 0 0 16px rgba(212, 175, 55, 0.25)'
                      : 'var(--neu-shadow-raised-md)'
                  }}
                >
                  {/* Top Bar: Date, Time, Badges, and Action Icons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.625rem',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
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
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <Clock size={12} />
                          <span>{formatMemoryTime(memory.memoryTime)}</span>
                        </div>
                      )}

                      {memory.isPinned && (
                        <span
                          className="neu-inset"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: 'var(--text-gold)',
                            letterSpacing: '0.04em'
                          }}
                        >
                          <Pin size={10} /> PINNED
                        </span>
                      )}

                      {memory.isPrivate && (
                        <span
                          className="neu-inset"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)'
                          }}
                        >
                          <Lock size={10} /> PRIVATE
                        </span>
                      )}
                    </div>

                    {/* Actions: Favorite & Edit Icon Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        id={`timeline-fav-btn-${memory.id}`}
                        type="button"
                        onClick={() => onToggleFavorite(memory.id, memory.isFavorite)}
                        onMouseEnter={() => setFavoriteHoverId(memory.id)}
                        onMouseLeave={() => setFavoriteHoverId(null)}
                        className="neu-icon-btn"
                        style={{
                          width: '34px',
                          height: '34px',
                          color: memory.isFavorite
                            ? 'var(--gold-primary)'
                            : isFavHover
                            ? 'var(--text-gold)'
                            : 'var(--text-muted)'
                        }}
                        title={memory.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                        aria-label={memory.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                      >
                        <Heart
                          size={15}
                          fill={memory.isFavorite ? 'var(--gold-primary)' : 'none'}
                          strokeWidth={memory.isFavorite ? 2.5 : 2}
                        />
                      </button>

                      <button
                        id={`timeline-edit-btn-${memory.id}`}
                        type="button"
                        onClick={() => onEdit(memory)}
                        className="neu-icon-btn"
                        style={{ width: '34px', height: '34px' }}
                        title="Edit memory"
                        aria-label="Edit memory"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Elapsed Time Banner if eligible */}
                  {elapsedTime && (
                    <div
                      className="neu-inset"
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        color: 'var(--text-gold)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <Sparkles size={12} color="var(--gold-primary)" />
                      <span>{elapsedTime}</span>
                    </div>
                  )}

                  {/* Title (Full Title, never truncated, natural wrapping) */}
                  <h3
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      marginBottom: '0.625rem'
                    }}
                  >
                    {memory.title}
                  </h3>

                  {/* Content / Notes Area with privacy protection */}
                  {isPrivateHidden ? (
                    <div
                      className="neu-inset"
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px dashed var(--border-gold-subtle)'
                      }}
                    >
                      <Lock size={16} color="var(--gold-primary)" />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Confidential memory hidden
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleReveal(memory.id)}
                        className="neu-btn"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', gap: '0.35rem' }}
                      >
                        <Eye size={13} /> Reveal
                      </button>
                    </div>
                  ) : (
                    memory.notes && (
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          marginBottom: '0.75rem'
                        }}
                      >
                        {memory.notes}
                      </p>
                    )
                  )}

                  {/* Connected People Pills */}
                  {memory.people && memory.people.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '0.625rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)'
                      }}
                    >
                      <User size={12} color="var(--gold-primary)" />
                      {memory.people.map((personName) => (
                        <span
                          key={personName}
                          className="neu-inset"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-pill)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {personName}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded Styles for the Responsive Vertical Timeline */}
      <style>{`
        .timeline-spine-line {
          position: absolute;
          left: 50%;
          top: 1rem;
          bottom: 1rem;
          width: 3px;
          background: linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-dark) 50%, var(--gold-primary) 100%);
          transform: translateX(-50%);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
          border-radius: 2px;
          z-index: 1;
        }

        .timeline-row {
          position: relative;
          display: flex;
          width: 100%;
          align-items: flex-start;
          z-index: 2;
        }

        .timeline-node-marker {
          position: absolute;
          left: 50%;
          top: 1rem;
          transform: translateX(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--surface-raised);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          z-index: 3;
          box-shadow: var(--neu-shadow-raised-sm), 0 0 12px rgba(212, 175, 55, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
        }

        .timeline-card-wrapper {
          width: 45%;
        }

        .timeline-row-left {
          justify-content: flex-start;
        }

        .timeline-row-right {
          justify-content: flex-end;
        }

        /* Mobile / Compact Single Column View */
        @media (max-width: 768px) {
          .timeline-spine-line {
            left: 22px;
            transform: none;
          }

          .timeline-row {
            justify-content: flex-start !important;
            padding-left: 54px;
          }

          .timeline-node-marker {
            left: 22px;
            transform: translateX(-50%);
            width: 36px;
            height: 36px;
            font-size: 1.15rem;
            top: 0.85rem;
          }

          .timeline-card-wrapper {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
