import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type {
  MemoryItem,
  PersonItem,
  DateFilterType,
  TimelineSortOrder,
  ReminisceTabId
} from '../../types/reminisce';
import { ALL_MOOD_EMOJIS } from '../../types/reminisce';
import {
  subscribeMemories,
  subscribePeople,
  addMemory,
  updateMemory,
  deleteMemory,
  addPerson
} from '../../services/reminisceService';
import {
  getTodayDateString,
  formatMemoryDate,
  isMemoryAnniversary,
  isDateInCurrentWeek,
  isDateInCurrentMonth,
  isDateInCurrentYear
} from '../../utils/reminisceUtils';
import { MemoryCard } from './MemoryCard';
import { MemoryFormModal } from './MemoryFormModal';
import { FloatingAddButton } from './FloatingAddButton';
import {
  Sparkles,
  Heart,
  Clock,
  Filter,
  RotateCcw,
  Compass,
  Smile,
  Users,
  ChevronDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Plus
} from 'lucide-react';

export function ReminiscePage() {
  const { user } = useAuth();
  const userId = user?.uid || 'guest_user';

  // Active Tab state
  const [activeTab, setActiveTab] = useState<ReminisceTabId>('all');

  // Data State
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [people, setPeople] = useState<PersonItem[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);

  // In-session Privacy Reveal State (resets when page unmounts)
  const [revealedMemoryIds, setRevealedMemoryIds] = useState<Set<string>>(new Set());

  // Filter States
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateInputs, setShowCustomDateInputs] = useState(false);

  // Selection states for Mood and People tabs
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  // Inline add person in People tab
  const [isAddingPersonInline, setIsAddingPersonInline] = useState(false);
  const [newPersonNameInline, setNewPersonNameInline] = useState('');
  const [inlinePersonError, setInlinePersonError] = useState('');

  // Timeline Order & Filters
  const [timelineOrder, setTimelineOrder] = useState<TimelineSortOrder>('newest');
  const [timelineYear, setTimelineYear] = useState<string>('all');
  const [timelineMonth, setTimelineMonth] = useState<string>('all');

  // Success / Info Toast Notification
  const [toast, setToast] = useState<{
    message: string;
    submessage?: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (
    message: string,
    submessage?: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToast({ message, submessage, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Subscribe to memories and people
  useEffect(() => {
    const unsubMemories = subscribeMemories(userId, (data) => {
      setMemories(data);
    });

    const unsubPeople = subscribePeople(userId, (peopleData) => {
      setPeople(peopleData);
    });

    return () => {
      unsubMemories();
      unsubPeople();
    };
  }, [userId]);

  // Handle privacy toggling within this session
  const handleToggleReveal = (id: string) => {
    setRevealedMemoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle quick favorite toggling from cards
  const handleToggleFavorite = async (id: string, current: boolean) => {
    try {
      const res = await updateMemory(userId, id, { isFavorite: !current });
      setMemories((prev) => prev.map((m) => (m.id === id ? res.memory : m)));
    } catch (err) {
      console.warn('Favorite toggle warning:', err);
    }
  };

  // Open edit modal
  const handleEdit = (memory: MemoryItem) => {
    setEditingMemory(memory);
    setIsModalOpen(true);
  };

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingMemory(null);
    setIsModalOpen(true);
  };

  // Save (create or update)
  const handleSaveMemory = async (
    data: Omit<MemoryItem, 'id' | 'userId' | 'createdAt'>
  ) => {
    if (editingMemory) {
      const res = await updateMemory(userId, editingMemory.id, data);
      setMemories((prev) => prev.map((m) => (m.id === editingMemory.id ? res.memory : m)));
      showToast(
        'Memory updated successfully!',
        res.firestoreSynced
          ? 'Synchronized with Cloud Firestore.'
          : res.firestoreNote
      );
    } else {
      const res = await addMemory(userId, data);
      setMemories((prev) => [res.memory, ...prev.filter((m) => m.id !== res.memory.id)]);
      showToast(
        'Memory saved successfully!',
        res.firestoreSynced
          ? 'Synchronized with Cloud Firestore.'
          : res.firestoreNote
      );
    }
  };

  // Delete
  const handleDeleteMemory = async (id: string) => {
    const res = await deleteMemory(userId, id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    showToast(
      'Memory deleted successfully.',
      res.firestoreSynced
        ? 'Removed from Cloud Firestore.'
        : res.firestoreNote
    );
  };

  // Add new person
  const handleAddNewPerson = async (name: string) => {
    const person = await addPerson(userId, name);
    setPeople((prev) => {
      if (prev.some((p) => p.name.toLowerCase() === person.name.toLowerCase())) return prev;
      return [...prev, person].sort((a, b) => a.name.localeCompare(b.name));
    });
    return person;
  };

  // Inline add person from People Tab
  const handleCreateInlinePerson = async () => {
    if (!newPersonNameInline.trim()) {
      setInlinePersonError('Please enter a name');
      return;
    }
    try {
      const person = await handleAddNewPerson(newPersonNameInline.trim());
      setSelectedPerson(person.name);
      setNewPersonNameInline('');
      setIsAddingPersonInline(false);
      setInlinePersonError('');
      showToast(`Added person "${person.name}"`);
    } catch {
      setInlinePersonError('Failed to add person');
    }
  };

  // Clear active filters
  const handleClearAllFilters = () => {
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDateInputs(false);
    setSelectedMood(null);
    setSelectedPerson(null);
    setTimelineYear('all');
    setTimelineMonth('all');
  };

  // Anniversaries list
  const anniversaryMemories = useMemo(() => {
    return memories.filter((m) => isMemoryAnniversary(m.memoryDate));
  }, [memories]);

  // Favorites list (pinned first, then newest)
  const favoriteMemories = useMemo(() => {
    return memories
      .filter((m) => m.isFavorite)
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.createdAt - a.createdAt);
  }, [memories]);

  // Available years in memories for timeline
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    memories.forEach((m) => {
      if (m.memoryDate && m.memoryDate.length >= 4) {
        years.add(m.memoryDate.substring(0, 4));
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [memories]);

  // Filter memories helper applying date filters
  const applyDateFilters = (list: MemoryItem[]) => {
    const today = getTodayDateString();
    return list.filter((m) => {
      if (dateFilter === 'today') {
        return m.memoryDate === today;
      }
      if (dateFilter === 'week') {
        return isDateInCurrentWeek(m.memoryDate);
      }
      if (dateFilter === 'month') {
        return isDateInCurrentMonth(m.memoryDate);
      }
      if (dateFilter === 'year') {
        return isDateInCurrentYear(m.memoryDate);
      }
      if (dateFilter === 'custom') {
        if (customStartDate && m.memoryDate < customStartDate) return false;
        if (customEndDate && m.memoryDate > customEndDate) return false;
        return true;
      }
      return true;
    });
  };

  // Tab Content Calculation:
  // 1. All Memories
  const allTabMemories = useMemo(() => {
    const list = applyDateFilters(memories);
    return list.sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.memoryDate.localeCompare(a.memoryDate)
    );
  }, [memories, dateFilter, customStartDate, customEndDate]);

  // 2. Favorites Tab Memories
  const favoritesTabMemories = useMemo(() => {
    const list = applyDateFilters(favoriteMemories);
    return list.sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.memoryDate.localeCompare(a.memoryDate)
    );
  }, [favoriteMemories, dateFilter, customStartDate, customEndDate]);

  // 3. Anniversaries Tab Memories
  const anniversariesTabMemories = useMemo(() => {
    return anniversaryMemories.sort((a, b) => b.memoryDate.localeCompare(a.memoryDate));
  }, [anniversaryMemories]);

  // 4. Timeline Tab Memories (Chronological order with year/month selection)
  const timelineTabMemories = useMemo(() => {
    let list = applyDateFilters(memories);

    if (timelineYear !== 'all') {
      list = list.filter((m) => m.memoryDate.startsWith(timelineYear));
    }

    if (timelineMonth !== 'all') {
      list = list.filter((m) => {
        const parts = m.memoryDate.split('-');
        return parts.length >= 2 && parts[1] === timelineMonth;
      });
    }

    return list.sort((a, b) => {
      const compare = a.memoryDate.localeCompare(b.memoryDate);
      return timelineOrder === 'newest' ? -compare : compare;
    });
  }, [memories, dateFilter, customStartDate, customEndDate, timelineYear, timelineMonth, timelineOrder]);

  // 5. Mood Tab Memories (Filtered strictly by selected emoji, or all if none selected)
  const moodTabMemories = useMemo(() => {
    let list = memories;
    if (selectedMood) {
      list = list.filter((m) => m.mood === selectedMood);
    }
    return list.sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.memoryDate.localeCompare(a.memoryDate)
    );
  }, [memories, selectedMood]);

  // 6. People Tab Memories (Filtered strictly by selected person, or all if none selected)
  const peopleTabMemories = useMemo(() => {
    let list = memories;
    if (selectedPerson) {
      list = list.filter((m) => m.people && m.people.includes(selectedPerson));
    }
    return list.sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.memoryDate.localeCompare(a.memoryDate)
    );
  }, [memories, selectedPerson]);

  const tabsConfig = [
    { id: 'all' as ReminisceTabId, label: 'All Memories', icon: Compass },
    { id: 'favorites' as ReminisceTabId, label: 'Favorites', icon: Heart },
    { id: 'anniversaries' as ReminisceTabId, label: 'Anniversaries', icon: Sparkles },
    { id: 'timeline' as ReminisceTabId, label: 'Timeline', icon: Clock },
    { id: 'mood' as ReminisceTabId, label: 'Mood', icon: Smile },
    { id: 'people' as ReminisceTabId, label: 'People', icon: Users }
  ];

  return (
    <div
      id="reminisce-page-container"
      className="reminisce-page-wrapper"
    >
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className="neu-card"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            border:
              toast.type === 'error'
                ? '1.5px solid #EF4444'
                : '1.5px solid var(--border-gold-strong)',
            backgroundColor:
              toast.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-card)',
            boxShadow: 'var(--neu-shadow-raised-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {toast.type === 'error' ? (
              <AlertTriangle size={18} color="#EF4444" />
            ) : (
              <CheckCircle2 size={18} color="var(--gold-primary)" />
            )}
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: toast.type === 'error' ? '#EF4444' : 'var(--text-primary)'
                }}
              >
                {toast.message}
              </p>
              {toast.submessage && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {toast.submessage}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="neu-icon-btn"
            style={{ width: '28px', height: '28px' }}
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Reminisce Sanctuary Header */}
      <header
        id="reminisce-header"
        className="neu-card reminisce-section-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h1
              className="font-display"
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em'
              }}
            >
              Reminisce
            </h1>
            <span
              className="neu-inset"
              style={{
                fontSize: '0.6875rem',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-gold)',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
            >
              MEMORY VAULT
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Preserve and revisit life&apos;s meaningful moments in high-contrast liquid gold.
          </p>
        </div>

        <button
          id="reminisce-header-add-btn"
          type="button"
          onClick={handleOpenAddModal}
          className="neu-btn neu-btn-gold"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem', gap: '0.5rem' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Memory</span>
        </button>
      </header>

      {/* 2. TAB-BASED NAVIGATION BAR */}
      <nav
        id="reminisce-tabs-nav"
        className="neu-inset"
        aria-label="Reminisce tabs"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.375rem',
          borderRadius: 'var(--radius-md)',
          gap: '0.375rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'neu-btn-gold' : 'neu-btn'}
              style={{
                flex: '1 1 0px',
                minWidth: '120px',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                border: isActive
                  ? '1.5px solid var(--border-gold-strong)'
                  : '1px solid transparent',
                boxShadow: isActive ? 'var(--neu-shadow-raised-sm)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <IconComponent size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. TAB CONTENT VIEWS */}

      {/* ======================================================== */}
      {/* TAB 1: ALL MEMORIES */}
      {/* ======================================================== */}
      {activeTab === 'all' && (
        <section className="neu-card reminisce-section-card">
          {/* Header & Date Filters Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Compass size={20} color="var(--gold-primary)" />
              <h2
                className="font-display"
                style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                All Memories
              </h2>
              <span
                className="neu-inset"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--text-gold)',
                  fontWeight: 700
                }}
              >
                {allTabMemories.length}
              </span>
            </div>

            {/* Date filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(['all', 'today', 'week', 'month', 'year', 'custom'] as DateFilterType[]).map((type) => {
                const isSelected = dateFilter === type;
                const labels: Record<DateFilterType, string> = {
                  all: 'All Dates',
                  today: 'Today',
                  week: 'Past Week',
                  month: 'Monthly',
                  year: 'Yearly',
                  custom: 'Specific Range'
                };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDateFilter(type);
                      setShowCustomDateInputs(type === 'custom');
                    }}
                    className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Pickers */}
          {showCustomDateInputs && (
            <div
              className="neu-inset"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="neu-input"
                  style={{ fontSize: '0.8125rem', padding: '0.3rem 0.5rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="neu-input"
                  style={{ fontSize: '0.8125rem', padding: '0.3rem 0.5rem' }}
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="neu-btn"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Clear dates
                </button>
              )}
            </div>
          )}

          {/* Memory Cards Grid */}
          {allTabMemories.length === 0 ? (
            <div
              className="neu-inset"
              style={{
                padding: '3rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Compass size={28} color="var(--gold-primary)" />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                {memories.length === 0
                  ? "Your memory vault is empty. Click the 'Add Memory' button to record your first memory."
                  : 'No memories match your currently selected date filter.'}
              </p>
              {dateFilter !== 'all' && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="neu-btn"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem', marginTop: '0.25rem' }}
                >
                  Reset date filter
                </button>
              )}
            </div>
          ) : (
            <div className="reminisce-cards-grid">
              {allTabMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isRevealed={revealedMemoryIds.has(memory.id)}
                  onToggleReveal={handleToggleReveal}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FAVORITES */}
      {/* ======================================================== */}
      {activeTab === 'favorites' && (
        <section className="neu-card reminisce-section-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Heart size={20} color="var(--gold-primary)" fill="var(--gold-primary)" />
              <h2
                className="font-display"
                style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                Favorite Memories
              </h2>
              <span
                className="neu-inset"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--text-gold)',
                  fontWeight: 700
                }}
              >
                {favoritesTabMemories.length}
              </span>
            </div>

            {/* Date filter pills for favorites */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(['all', 'today', 'week', 'month', 'year'] as DateFilterType[]).map((type) => {
                const isSelected = dateFilter === type;
                const labels: Record<string, string> = {
                  all: 'All',
                  today: 'Today',
                  week: 'Week',
                  month: 'Month',
                  year: 'Year'
                };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDateFilter(type)}
                    className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {favoritesTabMemories.length === 0 ? (
            <div
              className="neu-inset"
              style={{
                padding: '3rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Heart size={28} color="var(--gold-primary)" />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                No favorite memories marked yet. Tap the gold heart on any memory card to save it to your favorites.
              </p>
            </div>
          ) : (
            <div className="reminisce-cards-grid">
              {favoritesTabMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isRevealed={revealedMemoryIds.has(memory.id)}
                  onToggleReveal={handleToggleReveal}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ANNIVERSARIES */}
      {/* ======================================================== */}
      {activeTab === 'anniversaries' && (
        <section className="neu-card reminisce-section-card">
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '0.35rem'
              }}
            >
              <Sparkles size={20} color="var(--gold-primary)" />
              <h2
                className="font-display"
                style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                Anniversary Memories
              </h2>
              <span
                className="neu-inset"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--text-gold)',
                  fontWeight: 700
                }}
              >
                {anniversariesTabMemories.length}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-gold)', fontStyle: 'italic' }}>
              &ldquo;On this day, you created a beautiful memory.&rdquo;
            </p>
          </div>

          {anniversariesTabMemories.length === 0 ? (
            <div
              className="neu-inset"
              style={{
                padding: '3rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Sparkles size={28} color="var(--gold-primary)" />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
                No past memories recorded on this specific calendar day ({formatMemoryDate(getTodayDateString())}).
                Memories created on this day in past years will automatically appear here to celebrate your journey.
              </p>
            </div>
          ) : (
            <div className="reminisce-cards-grid">
              {anniversariesTabMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isRevealed={revealedMemoryIds.has(memory.id)}
                  onToggleReveal={handleToggleReveal}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TIMELINE */}
      {/* ======================================================== */}
      {activeTab === 'timeline' && (
        <section className="neu-card reminisce-section-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Clock size={20} color="var(--gold-primary)" />
              <h2
                className="font-display"
                style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                Memory Timeline
              </h2>
              <span
                className="neu-inset"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--text-gold)',
                  fontWeight: 700
                }}
              >
                {timelineTabMemories.length}
              </span>
            </div>

            {/* Timeline Controls: Sort order, Year, Month */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                id="timeline-order-btn"
                type="button"
                onClick={() =>
                  setTimelineOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
                }
                className="neu-btn"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                {timelineOrder === 'newest' ? 'Newest to Oldest' : 'Oldest to Newest'}
              </button>

              {/* Year Selector */}
              <div style={{ position: 'relative' }}>
                <select
                  id="timeline-year-select"
                  value={timelineYear}
                  onChange={(e) => setTimelineYear(e.target.value)}
                  className="neu-input"
                  style={{
                    padding: '0.45rem 2rem 0.45rem 0.85rem',
                    fontSize: '0.8125rem',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>

              {/* Month Selector */}
              <div style={{ position: 'relative' }}>
                <select
                  id="timeline-month-select"
                  value={timelineMonth}
                  onChange={(e) => setTimelineMonth(e.target.value)}
                  className="neu-input"
                  style={{
                    padding: '0.45rem 2rem 0.45rem 0.85rem',
                    fontSize: '0.8125rem',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Months</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>
            </div>
          </div>

          {timelineTabMemories.length === 0 ? (
            <div
              className="neu-inset"
              style={{
                padding: '3rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Clock size={28} color="var(--gold-primary)" />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                No memories found for the selected timeline period.
              </p>
              {(timelineYear !== 'all' || timelineMonth !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setTimelineYear('all');
                    setTimelineMonth('all');
                  }}
                  className="neu-btn"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem' }}
                >
                  Reset timeline filters
                </button>
              )}
            </div>
          ) : (
            <div className="reminisce-cards-grid">
              {timelineTabMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isRevealed={revealedMemoryIds.has(memory.id)}
                  onToggleReveal={handleToggleReveal}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 5: MOOD (EMOJI ONLY, APPLE IOS STYLE, NO COUNTS) */}
      {/* ======================================================== */}
      {activeTab === 'mood' && (
        <section className="neu-card reminisce-section-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Smile size={20} color="var(--gold-primary)" />
              <h2
                className="font-display"
                style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                Browse by Mood
              </h2>
            </div>

            {selectedMood && (
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                className="neu-btn"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                Show All Moods
              </button>
            )}
          </div>

          {/* Apple iOS Style Mood Emoji Selection Area (NO category names, NO counts, emoji characters only) */}
          <div
            className="neu-inset"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.75rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {ALL_MOOD_EMOJIS.map((emojiChar) => {
              const isSelected = selectedMood === emojiChar;
              return (
                <button
                  key={emojiChar}
                  id={`mood-btn-${emojiChar}`}
                  type="button"
                  onClick={() => setSelectedMood(isSelected ? null : emojiChar)}
                  className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                  style={{
                    width: '52px',
                    height: '52px',
                    padding: 0,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                    border: isSelected
                      ? '2.5px solid var(--border-gold-strong)'
                      : '1px solid var(--border-subtle)',
                    boxShadow: isSelected
                      ? 'var(--neu-shadow-recessed-sm), 0 0 16px rgba(212, 175, 55, 0.5)'
                      : 'var(--neu-shadow-raised-sm)',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  aria-label={`Filter by mood ${emojiChar}`}
                >
                  <span>{emojiChar}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Status Indicator */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedMood ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing memories tagged with{' '}
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
                  }}
                >
                  {selectedMood}
                </span>{' '}
                ({moodTabMemories.length} found)
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Tap any emoji above to filter memories by mood, or browse all memories below:
              </p>
            )}
          </div>

          {/* Matching Memories Grid */}
          {moodTabMemories.length === 0 ? (
            <div
              className="neu-inset"
              style={{
                padding: '3rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Smile size={28} color="var(--gold-primary)" />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                No memories recorded with the mood {selectedMood}.
              </p>
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                className="neu-btn"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem' }}
              >
                Clear mood filter
              </button>
            </div>
          ) : (
            <div className="reminisce-cards-grid">
              {moodTabMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isRevealed={revealedMemoryIds.has(memory.id)}
                  onToggleReveal={handleToggleReveal}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 6: PEOPLE (NAMES ONLY, NO COUNTS) */}
      {/* ======================================================== */}
      {activeTab === 'people' && (
        <section className="neu-card reminisce-section-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Users size={20} color="var(--gold-primary)" />
              <h2
                className="font-display"
                style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                Browse by Connected People
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {selectedPerson && (
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="neu-btn"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Show All People
                </button>
              )}

              {!isAddingPersonInline && (
                <button
                  type="button"
                  onClick={() => setIsAddingPersonInline(true)}
                  className="neu-btn neu-btn-gold"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                >
                  <Plus size={13} /> Add Person
                </button>
              )}
            </div>
          </div>

          {/* Inline Add Person Form */}
          {isAddingPersonInline && (
            <div
              className="neu-inset"
              style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter name (e.g. Maya Lin)..."
                  value={newPersonNameInline}
                  onChange={(e) => setNewPersonNameInline(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateInlinePerson();
                    }
                  }}
                  className="neu-input"
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem', flex: '1 1 200px' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateInlinePerson}
                  className="neu-btn neu-btn-gold"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                >
                  Add Person
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPersonInline(false);
                    setNewPersonNameInline('');
                    setInlinePersonError('');
                  }}
                  className="neu-btn"
                  style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
              </div>
              {inlinePersonError && (
                <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{inlinePersonError}</span>
              )}
            </div>
          )}

          {/* People Selection Chips (Names ONLY, NO numbers or memory counts) */}
          <div
            className="neu-inset"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.75rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.625rem',
              alignItems: 'center'
            }}
          >
            {people.length === 0 ? (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                No people recorded yet. Click &ldquo;Add Person&rdquo; above to get started.
              </span>
            ) : (
              people.map((person) => {
                const isSelected = selectedPerson === person.name;
                return (
                  <button
                    key={person.id}
                    id={`person-btn-${person.id}`}
                    type="button"
                    onClick={() => setSelectedPerson(isSelected ? null : person.name)}
                    className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected
                        ? '1.5px solid var(--border-gold-strong)'
                        : '1px solid var(--border-subtle)',
                      boxShadow: isSelected
                        ? 'var(--neu-shadow-recessed-sm), 0 0 10px rgba(212, 175, 55, 0.4)'
                        : 'var(--neu-shadow-raised-sm)',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.18s ease'
                    }}
                    aria-label={`Filter memories by ${person.name}`}
                  >
                    <span>{person.name}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Filter Status Indicator */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedPerson ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing memories connected with{' '}
                <strong style={{ color: 'var(--text-gold)' }}>{selectedPerson}</strong>{' '}
                ({peopleTabMemories.length} found)
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Select a person above to view shared memories, or browse all memories below:
              </p>
            )}
          </div>

          {/* Matching Memories Grid */}
          {peopleTabMemories.length === 0 ? (
            <div
              className="neu-inset"
              style={{
                padding: '3rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Users size={28} color="var(--gold-primary)" />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                No memories found connected with {selectedPerson}.
              </p>
              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="neu-btn"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem' }}
              >
                Clear person filter
              </button>
            </div>
          ) : (
            <div className="reminisce-cards-grid">
              {peopleTabMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isRevealed={revealedMemoryIds.has(memory.id)}
                  onToggleReveal={handleToggleReveal}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Custom Floating Action Button (Fixed Plus button) */}
      <FloatingAddButton onClick={handleOpenAddModal} />

      {/* 5. Add / Edit Memory Modal */}
      <MemoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMemory(null);
        }}
        onSave={handleSaveMemory}
        onDelete={handleDeleteMemory}
        editingMemory={editingMemory}
        existingPeople={people}
        onAddNewPerson={handleAddNewPerson}
      />
    </div>
  );
}
