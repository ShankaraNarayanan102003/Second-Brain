import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <>
      <button
        id="reminisce-floating-add-btn"
        type="button"
        onClick={onClick}
        aria-label="Add memory"
        className="reminisce-fab neu-btn-gold"
      >
        <Plus size={26} strokeWidth={2.8} />
      </button>

      <style>{`
        .reminisce-fab {
          position: fixed;
          bottom: 2.25rem;
          right: 2.25rem;
          width: 58px;
          height: 58px;
          border-radius: 50% !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 40;
          cursor: pointer;
          outline: none;
          background: var(--liquid-gold-gradient) !important;
          color: var(--liquid-gold-text) !important;
          border: 1.5px solid var(--liquid-gold-border) !important;
          box-shadow: var(--liquid-gold-shadow) !important;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, filter 0.2s ease;
        }

        .reminisce-fab:hover {
          transform: translateY(-3px) scale(1.05);
          background: var(--liquid-gold-gradient-hover) !important;
          box-shadow: var(--liquid-gold-shadow-hover) !important;
          filter: brightness(1.04);
        }

        .reminisce-fab:active {
          transform: translateY(1px) scale(0.96);
          background: var(--liquid-gold-gradient-active) !important;
          box-shadow: var(--liquid-gold-shadow-active) !important;
        }

        @media (max-width: 768px) {
          .reminisce-fab {
            bottom: calc(76px + env(safe-area-inset-bottom, 12px));
            right: 1.25rem;
            width: 52px;
            height: 52px;
          }
        }
      `}</style>
    </>
  );
}
