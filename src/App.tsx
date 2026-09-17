import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { MobileNav } from './components/layout/MobileNav';
import { SubpagePlaceholder } from './components/pages/SubpagePlaceholder';
import { ReminiscePage } from './components/reminisce/ReminiscePage';
import { NotesPage } from './components/notes/NotesPage';
import type { SubpageId, TodoSectionId } from './types';

function MainAppShell() {
  const { user, loading, continueAsGuest } = useAuth();
  const [activeSubpage, setActiveSubpage] = useState<SubpageId>('home');
  const [activeTodoSection, setActiveTodoSection] = useState<TodoSectionId>('task');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [initTimeoutPassed, setInitTimeoutPassed] = useState(false);

  // Safety timeout: Maximum 1.5s on initialization splash
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitTimeoutPassed(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Loading indicator with Neumorphic styling
  if (loading && !initTimeoutPassed) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--surface-control)',
            boxShadow: 'var(--neu-shadow-raised-md)',
            border: '2px solid var(--border-gold-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src="/icon.svg" alt="Emblem" width={40} height={40} />
        </div>
        <p className="font-display gold-gradient-text" style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>
          INITIALIZING SECOND BRAIN...
        </p>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              continueAsGuest();
            }
            setInitTimeoutPassed(true);
          }}
          className="neu-btn neu-btn-gold"
          style={{
            marginTop: '0.5rem',
            padding: '0.55rem 1.25rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Enter Sanctuary &rarr;
        </button>
      </div>
    );
  }

  // If not authenticated, display Neumorphic Google Sign-In view
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      {/* Desktop Fixed Left Sidebar */}
      <DesktopSidebar
        activeSubpage={activeSubpage}
        onSelectSubpage={(id) => {
          setActiveSubpage(id);
        }}
        activeTodoSection={activeTodoSection}
        onSelectTodoSection={(sec) => {
          setActiveTodoSection(sec);
        }}
      />

      {/* Main Workspace Frame */}
      <main className="workspace-main" id="workspace-main">
        {/* Top Header Bar */}
        <Header
          activeSubpage={activeSubpage}
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
        />

        {/* Active Stage Content */}
        <div className="content-stage">
          {activeSubpage === 'reminisce' ? (
            <ReminiscePage />
          ) : activeSubpage === 'notes' ? (
            <NotesPage />
          ) : (
            <SubpagePlaceholder
              activeSubpage={activeSubpage}
              activeTodoSection={activeTodoSection}
              onSelectTodoSection={setActiveTodoSection}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation & Full Drawer */}
      <MobileNav
        activeSubpage={activeSubpage}
        onSelectSubpage={(id) => {
          setActiveSubpage(id);
        }}
        activeTodoSection={activeTodoSection}
        onSelectTodoSection={(sec) => {
          setActiveTodoSection(sec);
        }}
        drawerOpen={mobileDrawerOpen}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
