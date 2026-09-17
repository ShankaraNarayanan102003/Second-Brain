import { useState } from 'react';
import { SUBPAGES, TODO_SECTIONS } from '../../data/navigation';
import type { SubpageId, TodoSectionId } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { IconRenderer } from '../ui/IconRenderer';
import { Menu, X, ChevronRight, ShieldCheck, LogOut, Mail, User } from 'lucide-react';

interface MobileNavProps {
  activeSubpage: SubpageId;
  onSelectSubpage: (id: SubpageId) => void;
  activeTodoSection: TodoSectionId;
  onSelectTodoSection: (section: TodoSectionId) => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
}

// 4 main navigation tabs requested by user + 5th Profile tab
const MOBILE_NAV_TABS: { id: SubpageId; label: string; iconName: string }[] = [
  { id: 'home', label: 'Home', iconName: 'LayoutDashboard' },
  { id: 'habits', label: 'Habit Tracker', iconName: 'Activity' },
  { id: 'todo', label: 'To Do', iconName: 'CheckSquare' },
  { id: 'finances', label: 'Finance', iconName: 'Coins' }
];

export function MobileNav({
  activeSubpage,
  onSelectSubpage,
  activeTodoSection,
  onSelectTodoSection,
  drawerOpen,
  onCloseDrawer,
  onOpenDrawer
}: MobileNavProps) {
  const { user, signOutUser, isGuest } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = user?.displayName || (isGuest ? 'Guest Architect' : 'User');
  const userEmail = user?.email || (isGuest ? 'guest@secondbrain.local' : 'No email registered');

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav-bar" id="mobile-nav-bar" aria-label="Mobile Navigation">
        {MOBILE_NAV_TABS.map((tab) => {
          const isActive = activeSubpage === tab.id && !drawerOpen && !profileOpen;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              type="button"
              onClick={() => {
                setProfileOpen(false);
                onSelectSubpage(tab.id);
                if (drawerOpen) onCloseDrawer();
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                flex: 1,
                height: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--text-gold)' : 'var(--text-secondary)',
                transition: 'var(--neu-transition)',
                padding: '0.4rem 0.15rem'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'var(--surface-control)' : 'transparent',
                  boxShadow: isActive ? 'var(--neu-shadow-recessed-sm)' : 'none',
                  border: isActive ? '1px solid var(--border-gold-subtle)' : '1px solid transparent'
                }}
              >
                <IconRenderer name={tab.iconName} size={18} />
              </div>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: 'nowrap',
                  letterSpacing: tab.id === 'habits' ? '-0.02em' : 'normal'
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* 5th Tab: Profile (Avatar + Dropdown / Modal Action) */}
        <button
          id="mobile-tab-profile"
          type="button"
          onClick={() => {
            if (drawerOpen) onCloseDrawer();
            setProfileOpen((prev) => !prev);
          }}
          aria-label="User profile and account settings"
          aria-expanded={profileOpen}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.2rem',
            flex: 1,
            height: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: profileOpen ? 'var(--text-gold)' : 'var(--text-secondary)',
            transition: 'var(--neu-transition)',
            padding: '0.4rem 0.15rem'
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: profileOpen ? 'var(--surface-control)' : 'transparent',
              border: profileOpen
                ? '1.5px solid var(--border-gold-strong)'
                : '1px solid var(--border-gold-subtle)',
              boxShadow: profileOpen
                ? 'var(--liquid-gold-shadow)'
                : 'var(--neu-shadow-raised-sm)',
              transform: profileOpen ? 'scale(1.05)' : undefined,
              transition: 'var(--neu-transition)'
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
                  fontSize: '0.75rem'
                }}
              >
                {displayName ? displayName.charAt(0).toUpperCase() : <User size={15} />}
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: profileOpen ? 700 : 500,
              whiteSpace: 'nowrap'
            }}
          >
            Profile
          </span>
        </button>
      </nav>

      {/* Interactive Mobile Profile Sheet (Full Name, Email ID, Logout) */}
      {profileOpen && (
        <div
          id="mobile-profile-sheet-overlay"
          onClick={() => setProfileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '1rem',
            paddingBottom: 'calc(74px + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div
            id="mobile-profile-modal-card"
            className="neu-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-card)',
              boxShadow: 'var(--neu-shadow-raised-lg), var(--gold-glow)',
              border: '1.5px solid var(--border-gold-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              animation: 'mobileProfileSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Top Header with Close Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                className="font-display gold-gradient-text"
                style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em' }}
              >
                ACCOUNT PROFILE
              </span>
              <button
                id="close-mobile-profile-btn"
                type="button"
                onClick={() => setProfileOpen(false)}
                className="neu-icon-btn"
                style={{ width: '32px', height: '32px' }}
                aria-label="Close profile sheet"
              >
                <X size={16} />
              </button>
            </div>

            {/* User Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: 'var(--neu-shadow-raised-sm)',
                  border: '2px solid var(--border-gold-strong)'
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
                      fontSize: '1.25rem'
                    }}
                  >
                    {displayName ? displayName.charAt(0).toUpperCase() : <User size={24} />}
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                {/* Full Name */}
                <div
                  id="mobile-profile-fullname"
                  style={{
                    fontSize: '1.0625rem',
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
                  id="mobile-profile-email"
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title={userEmail}
                >
                  <Mail size={13} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</span>
                </div>
              </div>
            </div>

            {/* Account Status Well */}
            <div
              className="neu-inset"
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Security & Auth</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--text-gold)',
                  fontWeight: 600
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isGuest ? '#F59E0B' : '#10B981'
                  }}
                />
                {isGuest ? 'Guest Session' : 'Authenticated'}
              </span>
            </div>

            {/* Dedicated Logout Button */}
            <button
              id="mobile-profile-logout-btn"
              type="button"
              onClick={async () => {
                setProfileOpen(false);
                await signOutUser();
              }}
              className="neu-btn neu-btn-gold"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Drawer Sheet for Mobile Navigation (all views via header hamburger) */}
      {drawerOpen && (
        <div
          id="mobile-drawer-overlay"
          onClick={onCloseDrawer}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 90,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div
            id="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '84%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: 'var(--surface-base)',
              borderLeft: '1px solid var(--border-gold-subtle)',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.8)',
              padding: '1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/icon.svg" alt="Second Brain" width={26} height={26} />
                <span className="font-display gold-gradient-text" style={{ fontWeight: 800, fontSize: '1rem' }}>
                  SECOND BRAIN
                </span>
              </div>
              <button
                id="close-mobile-drawer-btn"
                type="button"
                onClick={onCloseDrawer}
                className="neu-icon-btn"
                style={{ width: '36px', height: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Navigate to any cognitive section:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
              {SUBPAGES.map((page) => {
                const isActive = activeSubpage === page.id;
                return (
                  <div key={page.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSubpage(page.id);
                        onCloseDrawer();
                      }}
                      className={`neu-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <IconRenderer name={page.iconName} size={18} />
                      <span style={{ flex: 1 }}>{page.label}</span>
                      {isActive && <ChevronRight size={14} color="var(--text-gold)" />}
                    </button>

                    {/* If page is todo and active */}
                    {page.id === 'todo' && isActive && (
                      <div
                        style={{
                          marginLeft: '1.5rem',
                          paddingLeft: '0.75rem',
                          marginTop: '0.25rem',
                          marginBottom: '0.25rem',
                          borderLeft: '2px solid var(--border-gold-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}
                      >
                        {TODO_SECTIONS.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              onSelectTodoSection(sec.id);
                              onCloseDrawer();
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.4rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              background:
                                activeTodoSection === sec.id
                                  ? 'var(--surface-raised)'
                                  : 'transparent',
                              color:
                                activeTodoSection === sec.id
                                  ? 'var(--text-gold)'
                                  : 'var(--text-secondary)',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <IconRenderer name={sec.iconName} size={13} />
                            <span>{sec.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="neu-inset"
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: 'auto',
                fontSize: '0.6875rem'
              }}
            >
              <ShieldCheck size={16} color="var(--gold-primary)" />
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Firebase Active</span>
                <div style={{ color: 'var(--text-muted)' }}>shan-second-brain</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mobileProfileSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
