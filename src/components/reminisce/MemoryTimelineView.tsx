import type { MemoryItem } from '../../types/reminisce';
import {
  formatMemoryDate,
  formatMemoryTime
} from '../../utils/reminisceUtils';
import {
  Heart,
  Pin,
  Lock,
  Eye,
  Edit3,
  Clock
} from 'lucide-react';

export interface MemoryTimelineViewProps {
  memories: MemoryItem[];
  revealedMemoryIds: Set<string>;
  onToggleReveal: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onTogglePrivate?: (id: string, current: boolean) => void;
  onTogglePin?: (id: string, current: boolean) => void;
  onEdit: (memory: MemoryItem) => void;
}

export function MemoryTimelineView({
  memories,
  revealedMemoryIds,
  onToggleReveal,
  onToggleFavorite,
  onEdit
}: MemoryTimelineViewProps) {
  return (
    <div className="timeline-variation-3-root" style={{ width: '100%', position: 'relative' }}>
      {/* Empty State when no database memories exist */}
      {memories.length === 0 ? (
        <div
          className="neu-inset"
          style={{
            padding: '3rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '520px',
            margin: '1.5rem auto'
          }}
        >
          <Clock size={28} color="var(--gold-primary)" />
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>
            No memories found in the database.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            Memories you record will automatically appear here in the centered timeline.
          </p>
        </div>
      ) : (
        /* The Timeline Container with native responsive adaptability based on device screen */
        <div
          className="timeline-viewport-wrapper"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '960px',
            margin: '1.25rem auto 0',
            boxSizing: 'border-box'
          }}
        >
          {/* Vertical Gold Timeline Line */}
          <div className="v3-timeline-central-spine" />

          {/* List of Alternating Cards from the Database */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {memories.map((memory, index) => {
              const isLeft = index % 2 === 0;
              const isRevealed = revealedMemoryIds.has(memory.id);
              const isPrivateHidden = memory.isPrivate && !isRevealed;
              const formattedDate = formatMemoryDate(memory.memoryDate);
              const formattedTime = memory.memoryTime ? formatMemoryTime(memory.memoryTime) : '';

              return (
                <div
                  key={memory.id}
                  className={`v3-timeline-row ${isLeft ? 'v3-row-left' : 'v3-row-right'}`}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    marginBottom: '2.5rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Circular Gold Dot on Timeline */}
                  <div
                    className="v3-timeline-dot"
                    title={`Memory: ${memory.title}`}
                  />

                  {/* Horizontal Connector Stem from Card to Timeline Dot */}
                  <div className={`v3-connector-stem ${isLeft ? 'v3-stem-left' : 'v3-stem-right'}`} />

                  {/* Card Container */}
                  <div className="v3-card-wrapper">
                    <article
                      id={`timeline-card-${memory.id}`}
                      className={`neu-card v3-timeline-card ${memory.isPinned ? 'is-pinned' : ''}`}
                      style={{
                        backgroundColor: 'var(--surface-card, #13171E)',
                        borderRadius: '16px',
                        border: memory.isPinned
                          ? '1.5px solid var(--border-gold-strong, rgba(247, 225, 136, 0.55))'
                          : '1px solid var(--border-gold-subtle, rgba(212, 175, 55, 0.22))',
                        boxShadow: memory.isPinned
                          ? 'var(--neu-shadow-raised-md), 0 0 18px rgba(212, 175, 55, 0.18)'
                          : 'var(--neu-shadow-raised-md), 0 0 12px rgba(212, 175, 55, 0.08)',
                        padding: '1.15rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        position: 'relative',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Top Metadata Row (Mood Emoji, Date, Time, Pinned Badge) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          minWidth: 0
                        }}
                      >
                        {/* Left: Mood Emoji Container + Date & Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                          {/* Mood Emoji in small rounded container */}
                          {memory.mood && (
                            <div
                              className="neu-inset"
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                flexShrink: 0,
                                backgroundColor: 'var(--surface-control, #12151B)',
                                border: '1px solid rgba(212, 175, 55, 0.28)',
                                boxShadow: 'inset 1px 1px 3px rgba(0, 0, 0, 0.6)',
                                fontFamily:
                                  '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
                              }}
                              title={`Mood: ${memory.mood}`}
                              aria-label={`Mood: ${memory.mood}`}
                            >
                              <span>{memory.mood}</span>
                            </div>
                          )}

                          {/* Date & Time */}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: 'var(--text-primary, #EDEFEF)',
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {formattedDate}
                            </span>
                            {formattedTime && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  color: 'var(--text-secondary, #9DA6B2)',
                                  lineHeight: 1.2,
                                  marginTop: '0.15rem'
                                }}
                              >
                                {formattedTime}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pinned & Private Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          {memory.isPinned && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                                border: '1px solid rgba(247, 225, 136, 0.5)',
                                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
                                color: 'var(--text-gold, #F7E188)',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                letterSpacing: '0.05em'
                              }}
                              title="Pinned Memory"
                            >
                              <Pin size={11} color="var(--gold-primary, #D4AF37)" />
                              <span>PINNED</span>
                            </div>
                          )}

                          {memory.isPrivate && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(18, 21, 27, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-muted, #5C6573)',
                                fontSize: '0.6875rem',
                                fontWeight: 600
                              }}
                              title="Private Memory"
                            >
                              <Lock size={10} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prominent Title */}
                      <h3
                        style={{
                          fontSize: '1.0625rem',
                          fontWeight: 700,
                          color: 'var(--text-primary, #EDEFEF)',
                          lineHeight: 1.35,
                          margin: 0,
                          wordBreak: 'break-word'
                        }}
                      >
                        {memory.title}
                      </h3>

                      {/* Memory Content */}
                      {isPrivateHidden ? (
                        <div
                          className="neu-inset"
                          style={{
                            padding: '0.85rem',
                            borderRadius: '10px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: '1px dashed rgba(212, 175, 55, 0.25)'
                          }}
                        >
                          <Lock size={15} color="var(--gold-primary)" />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            Confidential memory hidden
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleReveal(memory.id)}
                            className="neu-btn"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                          >
                            <Eye size={12} /> Reveal
                          </button>
                        </div>
                      ) : (
                        memory.notes && (
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: 'var(--text-secondary, #9DA6B2)',
                              lineHeight: 1.55,
                              margin: 0,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {memory.notes}
                          </p>
                        )
                      )}

                      {/* Bottom Row: Like & Edit (Bottom-Left) + People (Bottom-Right) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          marginTop: '0.35rem',
                          paddingTop: '0.65rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          flexWrap: 'wrap'
                        }}
                      >
                        {/* Two small circular floating action buttons at bottom-left */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {/* Like Floating Action Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(memory.id, memory.isFavorite);
                            }}
                            aria-label={memory.isFavorite ? 'Unlike memory' : 'Like memory'}
                            title={memory.isFavorite ? 'Favorited' : 'Like memory'}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--surface-control, #12151B)',
                              border: memory.isFavorite
                                ? '1px solid rgba(247, 225, 136, 0.65)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: memory.isFavorite
                                ? '0 0 12px rgba(212, 175, 55, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                                : '0 3px 8px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.06)',
                              color: memory.isFavorite
                                ? 'var(--gold-primary, #D4AF37)'
                                : 'var(--text-secondary, #9DA6B2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              padding: 0
                            }}
                          >
                            <Heart
                              size={14}
                              fill={memory.isFavorite ? 'var(--gold-primary, #D4AF37)' : 'none'}
                              strokeWidth={memory.isFavorite ? 2.5 : 2}
                            />
                          </button>

                          {/* Edit Floating Action Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(memory);
                            }}
                            aria-label="Edit memory"
                            title="Edit memory"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--surface-control, #12151B)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary, #9DA6B2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              padding: 0
                            }}
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>

                        {/* Associated People */}
                        {memory.people && memory.people.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            {memory.people.slice(0, 2).map((personName) => {
                              const initials = personName
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase();
                              return (
                                <div
                                  key={personName}
                                  className="neu-inset"
                                  title={personName}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.15rem 0.5rem 0.15rem 0.25rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary, #9DA6B2)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    maxWidth: '135px'
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                      border: '1px solid rgba(212, 175, 55, 0.4)',
                                      color: 'var(--text-gold, #F7E188)',
                                      fontSize: '0.5625rem',
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    {initials}
                                  </span>
                                  <span
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {personName}
                                  </span>
                                </div>
                              );
                            })}

                            {memory.people.length > 2 && (
                              <span
                                className="neu-inset"
                                title={memory.people.slice(2).join(', ')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  color: 'var(--text-gold, #F7E188)',
                                  border: '1px solid rgba(212, 175, 55, 0.3)'
                                }}
                              >
                                +{memory.people.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded CSS for Centered Timeline with Responsive Breakpoints */}
      <style>{`
        /* Central Gold Timeline Line (Centered on Desktop & Tablet) */
        .v3-timeline-central-spine {
          position: absolute;
          left: 50%;
          top: 0.5rem;
          bottom: 0.5rem;
          width: 2.5px;
          transform: translateX(-50%);
          background: linear-gradient(
            180deg,
            rgba(212, 175, 55, 0.15) 0%,
            #D4AF37 12%,
            #F7E188 50%,
            #D4AF37 88%,
            rgba(212, 175, 55, 0.15) 100%
          );
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.35);
          border-radius: 2px;
          z-index: 1;
        }

        /* Timeline Dot: Centered on Desktop & Tablet */
        .v3-timeline-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFF4C2 0%, #D4AF37 50%, #9A7218 100%);
          border: 2px solid #0B0D10;
          box-shadow: 0 0 10px rgba(247, 225, 136, 0.75), 0 0 4px rgba(212, 175, 55, 0.4);
          z-index: 4;
        }

        .v3-row-left {
          justify-content: flex-start;
        }

        .v3-row-right {
          justify-content: flex-end;
        }

        /* Desktop: alternating cards with 36px offset from center */
        .v3-card-wrapper {
          width: calc(50% - 36px);
          position: relative;
          z-index: 2;
        }

        .v3-stem-left {
          position: absolute;
          left: calc(50% - 36px);
          width: 36px;
          top: 50%;
          height: 2px;
          transform: translateY(-50%);
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.3), #D4AF37);
          z-index: 2;
        }

        .v3-stem-right {
          position: absolute;
          left: 50%;
          width: 36px;
          top: 50%;
          height: 2px;
          transform: translateY(-50%);
          background: linear-gradient(90deg, #D4AF37, rgba(212, 175, 55, 0.3));
          z-index: 2;
        }

        .v3-timeline-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--neu-shadow-raised-lg), 0 0 16px rgba(212, 175, 55, 0.16) !important;
        }

        /* Tablet Breakpoint (768px - 1023px): Centered timeline with narrower gap */
        @media (max-width: 1023px) and (min-width: 768px) {
          .v3-card-wrapper {
            width: calc(50% - 24px);
          }
          .v3-stem-left {
            left: calc(50% - 24px);
            width: 24px;
          }
          .v3-stem-right {
            left: 50%;
            width: 24px;
          }
          .v3-timeline-card {
            padding: 1rem !important;
          }
        }

        /* Mobile Breakpoint (<768px): Timeline line on LEFT (20px), all cards on RIGHT */
        @media (max-width: 767px) {
          .v3-timeline-central-spine {
            left: 20px !important;
            transform: none !important;
          }

          .v3-timeline-row {
            justify-content: flex-start !important;
            padding-left: 44px !important;
            margin-bottom: 1.75rem !important;
          }

          .v3-timeline-dot {
            left: 20px !important;
            transform: translate(-50%, -50%) !important;
          }

          .v3-stem-left,
          .v3-stem-right {
            left: 20px !important;
            width: 24px !important;
            background: linear-gradient(90deg, #D4AF37, rgba(212, 175, 55, 0.3)) !important;
          }

          .v3-card-wrapper {
            width: 100% !important;
          }

          .v3-timeline-card {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
