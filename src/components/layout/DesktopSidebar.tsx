import { SUBPAGES, TODO_SECTIONS } from '../../data/navigation';
import type { SubpageId, TodoSectionId } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';
import { ShieldCheck, ChevronRight } from 'lucide-react';

interface DesktopSidebarProps {
  activeSubpage: SubpageId;
  onSelectSubpage: (id: SubpageId) => void;
  activeTodoSection: TodoSectionId;
  onSelectTodoSection: (section: TodoSectionId) => void;
}

export function DesktopSidebar({
  activeSubpage,
  onSelectSubpage,
  activeTodoSection,
  onSelectTodoSection
}: DesktopSidebarProps) {
  return (
    <aside className="desktop-sidebar" id="desktop-sidebar">
      {/* Brand & Logo Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          paddingBottom: '1.5rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-control)',
            boxShadow: 'var(--neu-shadow-raised-sm)',
            border: '1.5px solid var(--border-gold-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src="/icon.svg" alt="Second Brain Emblem" width={28} height={28} />
        </div>
        <div>
          <h1
            className="font-display gold-gradient-text"
            style={{
              fontSize: '1.0625rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              lineHeight: 1.1
            }}
          >
            SECOND BRAIN
          </h1>
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em'
            }}
          >
            Personal Architecture
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav
        aria-label="Primary application navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          flex: 1
        }}
      >
        {SUBPAGES.map((page) => {
          const isActive = activeSubpage === page.id;
          return (
            <div key={page.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                id={`nav-item-${page.id}`}
                type="button"
                onClick={() => onSelectSubpage(page.id)}
                className={`neu-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  style={{
                    color: isActive ? 'var(--text-gold)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <IconRenderer name={page.iconName} size={18} />
                </div>
                <span style={{ flex: 1 }}>{page.label}</span>
                {isActive && (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--liquid-gold-gradient)',
                      boxShadow: 'var(--gold-glow)'
                    }}
                  />
                )}
              </button>

              {/* Nested Sub-sections for To-do */}
              {page.id === 'todo' && isActive && (
                <div
                  style={{
                    marginLeft: '1.5rem',
                    paddingLeft: '0.75rem',
                    marginTop: '0.35rem',
                    marginBottom: '0.35rem',
                    borderLeft: '2px solid var(--border-gold-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  {TODO_SECTIONS.map((sec) => {
                    const isSecActive = activeTodoSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        id={`todo-subnav-${sec.id}`}
                        type="button"
                        onClick={() => onSelectTodoSection(sec.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          fontWeight: isSecActive ? 600 : 500,
                          cursor: 'pointer',
                          background: isSecActive ? 'var(--surface-raised)' : 'transparent',
                          color: isSecActive ? 'var(--text-gold)' : 'var(--text-secondary)',
                          border: isSecActive
                            ? '1px solid var(--border-gold-subtle)'
                            : '1px solid transparent',
                          boxShadow: isSecActive ? 'var(--neu-shadow-raised-sm)' : 'none',
                          fontFamily: 'var(--font-body)',
                          textAlign: 'left',
                          transition: 'var(--neu-transition)'
                        }}
                      >
                        <IconRenderer name={sec.iconName} size={14} />
                        <span>{sec.label}</span>
                        {isSecActive && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Firebase Connection Status */}
      <div
        className="neu-inset"
        style={{
          marginTop: 'auto',
          padding: '0.75rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}
      >
        <ShieldCheck size={16} color="var(--gold-primary)" />
        <div style={{ fontSize: '0.6875rem', lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Firebase Connected</div>
          <div style={{ color: 'var(--text-muted)' }}>shan-second-brain</div>
        </div>
      </div>
    </aside>
  );
}
