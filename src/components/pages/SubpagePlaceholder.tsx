import { useState } from 'react';
import { SUBPAGES, TODO_SECTIONS } from '../../data/navigation';
import type { SubpageId, TodoSectionId } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';
import { Button } from '../ui/Button';
import { Sparkles, Layers, ShieldCheck, CheckCircle2, ArrowRight, Plus } from 'lucide-react';

interface SubpagePlaceholderProps {
  activeSubpage: SubpageId;
  activeTodoSection: TodoSectionId;
  onSelectTodoSection: (section: TodoSectionId) => void;
}

export function SubpagePlaceholder({
  activeSubpage,
  activeTodoSection,
  onSelectTodoSection
}: SubpagePlaceholderProps) {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const page = SUBPAGES.find((p) => p.id === activeSubpage) || SUBPAGES[0];
  const activeTodoObj = TODO_SECTIONS.find((s) => s.id === activeTodoSection) || TODO_SECTIONS[0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '1000px',
        margin: '0 auto'
      }}
    >
      {/* If subpage is To-do, provide the tactile segmented selector for Task, Event, Goal */}
      {activeSubpage === 'todo' && (
        <section
          aria-label="To-do section selection"
          className="neu-inset"
          style={{
            padding: '0.45rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: '100%'
          }}
        >
          {TODO_SECTIONS.map((sec) => {
            const isSelected = activeTodoSection === sec.id;
            return (
              <button
                key={sec.id}
                id={`todo-section-tab-${sec.id}`}
                type="button"
                onClick={() => onSelectTodoSection(sec.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected
                    ? '1px solid var(--border-gold-strong)'
                    : '1px solid transparent',
                  background: isSelected ? 'var(--surface-raised)' : 'transparent',
                  boxShadow: isSelected ? 'var(--neu-shadow-raised-sm)' : 'none',
                  color: isSelected ? 'var(--text-gold)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'var(--neu-transition)'
                }}
              >
                <IconRenderer name={sec.iconName} size={16} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </section>
      )}

      {/* Main Subpage Hero Card in Neumorphism */}
      <section className="neu-card" style={{ padding: '2rem 2.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-control)',
                boxShadow: 'var(--neu-shadow-raised-sm)',
                border: '1.5px solid var(--border-gold-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-gold)'
              }}
            >
              <IconRenderer
                name={activeSubpage === 'todo' ? activeTodoObj.iconName : page.iconName}
                size={28}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1
                  className="font-display gold-gradient-text"
                  style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '0.04em' }}
                >
                  {activeSubpage === 'todo' ? `To-do: ${activeTodoObj.label}` : page.label}
                </h1>
              </div>
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.25rem',
                  maxWidth: '560px'
                }}
              >
                {activeSubpage === 'todo' ? activeTodoObj.description : page.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              id="subpage-hero-action-btn"
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => {
                setActionFeedback(`Created new item in ${activeSubpage === 'todo' ? activeTodoObj.label : page.label}`);
                setTimeout(() => setActionFeedback(null), 2500);
              }}
            >
              Add {activeSubpage === 'todo' ? activeTodoObj.label : page.label}
            </Button>
            <div
              className="neu-inset"
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text-gold)',
                fontWeight: 600
              }}
            >
              <ShieldCheck size={14} />
              <span>Architecture Ready</span>
            </div>
          </div>
        </div>

        {/* Tactile Foundation Demonstration Block */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* Tactile Control Inspection Panel */}
          <div
            className="neu-inset"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Sparkles size={14} /> INTERACTIVE CONTROLS
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Primary actions utilize the metallic Liquid Gold design system:
            </p>

            {/* Inset Tactile Input */}
            <input
              id="foundation-input"
              type="text"
              placeholder={`Search or quick capture for ${page.label}...`}
              className="neu-input"
              readOnly
            />

            {/* Tactile Action Button */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <Button
                id="foundation-primary-btn"
                variant="primary"
                icon={<Plus size={16} />}
                style={{ flex: 1, minWidth: '130px' }}
                onClick={() => {
                  setActionFeedback(`Primary action executed for ${activeSubpage === 'todo' ? activeTodoObj.label : page.label}`);
                  setTimeout(() => setActionFeedback(null), 2500);
                }}
              >
                Create {activeSubpage === 'todo' ? activeTodoObj.label : page.label}
              </Button>
              <Button
                id="foundation-secondary-btn"
                variant="secondary"
                style={{ flex: 1, minWidth: '130px' }}
                onClick={() => {
                  setActionFeedback(`Filtered items`);
                  setTimeout(() => setActionFeedback(null), 2000);
                }}
              >
                Filter & Sort
              </Button>
            </div>

            {actionFeedback && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '0.25rem'
                }}
              >
                <CheckCircle2 size={14} color="var(--gold-primary)" />
                <span>{actionFeedback}</span>
              </div>
            )}
          </div>

          {/* Subpage Stage Status Panel */}
          <div
            className="neu-inset"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}
          >
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Layers size={14} /> STAGE 1 FOUNDATION CONFIRMATION
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <CheckCircle2 size={15} color="var(--gold-primary)" />
                <span>Subpage route registered & responsive</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <CheckCircle2 size={15} color="var(--gold-primary)" />
                <span>Neumorphic Egyptian liquid gold theme applied</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <CheckCircle2 size={15} color="var(--gold-primary)" />
                <span>Subpage awaiting detailed functionality specs</span>
              </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}
            >
              Ready for your functional requirements whenever you are ready.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
