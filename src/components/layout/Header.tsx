import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, LogOut, Menu, User, Mail, ShieldCheck } from 'lucide-react';
import type { SubpageId } from '../../types';
import { SUBPAGES } from '../../data/navigation';

interface HeaderProps {
  activeSubpage: SubpageId;
  onOpenMobileMenu: () => void;
}

export function Header({ activeSubpage, onOpenMobileMenu }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOutUser, isGuest } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentConfig = SUBPAGES.find((p) => p.id === activeSubpage) || SUBPAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const displayName = user?.displayName || (isGuest ? 'Guest Architect' : 'User');
  const userEmail = user?.email || (isGuest ? 'guest@secondbrain.local' : 'No email registered');

  return (
    <header className="app-header" id="app-header">
      {/* Left: Mobile Menu Button + Page Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          id="mobile-menu-toggle-btn"
          type="button"
          onClick={onOpenMobileMenu}
          className="neu-icon-btn"
          style={{ display: 'none' }}
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h2
              className="font-display"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em'
              }}
            >
              {currentConfig.label}
            </h2>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: 'var(--surface-control)',
                border: '1px solid var(--border-gold-subtle)',
                color: 'var(--text-gold)',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
            >
              FOUNDATION
            </span>
          </div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              marginTop: '0.1rem',
              display: 'none'
            }}
            className="header-subtext"
          >
            {currentConfig.description}
          </p>
        </div>
      </div>

      {/* Right: Controls & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Light / Dark Mode Toggle */}
        <button
          id="header-theme-toggle"
          type="button"
          onClick={toggleTheme}
          className="neu-icon-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Account / Sign Out Profile Anchor (Avatar Only in Header Bar) */}
        <div
          ref={dropdownRef}
          id="header-profile-anchor"
          className="header-profile-wrapper"
          style={{ position: 'relative' }}
        >
          {/* Avatar-Only Clickable Button */}
          <button
            id="header-user-avatar-btn"
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label="Toggle user profile and account details"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            className="neu-icon-btn"
            title={`${displayName} - Click to view account details`}
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'pointer',
              border: isDropdownOpen
                ? '1.5px solid var(--border-gold-strong)'
                : '1.5px solid var(--border-gold-subtle)',
              boxShadow: isDropdownOpen
                ? 'var(--liquid-gold-shadow)'
                : 'var(--neu-shadow-raised-sm)',
              transform: isDropdownOpen ? 'translateY(1px)' : undefined,
              transition: 'var(--neu-transition)'
            }}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--liquid-gold-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#12151B',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                {displayName ? displayName.charAt(0).toUpperCase() : <User size={18} />}
              </div>
            )}
          </button>

          {/* Popover Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div
              id="header-user-dropdown-menu"
              className="neu-card"
              role="dialog"
              aria-label="User Account Information"
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '280px',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface-card)',
                boxShadow: 'var(--neu-shadow-raised-lg), var(--gold-glow)',
                border: '1px solid var(--border-gold-subtle)',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                animation: 'headerDropdownFade 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* User Identity Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: 'var(--neu-shadow-raised-sm)',
                    border: '1.5px solid var(--border-gold-strong)'
                  }}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--liquid-gold-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#12151B',
                        fontWeight: 700,
                        fontSize: '1.125rem'
                      }}
                    >
                      {displayName ? displayName.charAt(0).toUpperCase() : <User size={22} />}
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  {/* Full Name */}
                  <div
                    id="profile-dropdown-fullname"
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={displayName}
                  >
                    {displayName}
                  </div>

                  {/* Email ID */}
                  <div
                    id="profile-dropdown-email"
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title={userEmail}
                  >
                    <Mail size={12} style={{ flexShrink: 0, color: 'var(--gold-primary)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Status Well */}
              <div
                className="neu-inset"
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'var(--text-gold)',
                    fontWeight: 600
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isGuest ? '#F59E0B' : '#10B981'
                    }}
                  />
                  {isGuest ? 'Guest Session' : 'Authenticated'}
                </span>
              </div>

              {/* Dedicated Logout Button */}
              <button
                id="header-signout-btn"
                type="button"
                onClick={async () => {
                  setIsDropdownOpen(false);
                  await signOutUser();
                }}
                className="neu-btn neu-btn-gold"
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes headerDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (min-width: 640px) {
          .header-subtext {
            display: block !important;
          }
        }
        @media (max-width: 768px) {
          #mobile-menu-toggle-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
