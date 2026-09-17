import { useState, useRef, useEffect } from 'react';
import { Clock, Check, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { getCurrentTimeString } from '../../utils/notesUtils';

interface NotesTimePickerProps {
  id?: string;
  value: string; // HH:mm format (24-hour)
  onChange: (time: string) => void;
}

export function NotesTimePicker({
  id = 'notes-time-picker',
  value,
  onChange
}: NotesTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse 24-hour value into 12-hour format
  const parseTime = (timeStr: string) => {
    let [h, m] = (timeStr || '12:00').split(':').map(Number);
    if (isNaN(h)) h = 12;
    if (isNaN(m)) m = 0;
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return { hour12, minute: m, period };
  };

  const { hour12, minute, period } = parseTime(value);

  // Format 12-hour display string
  const formattedDisplay = `${hour12}:${minute < 10 ? `0${minute}` : minute} ${period}`;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateTime = (newHour12: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
    let h24 = newHour12;
    if (newPeriod === 'AM') {
      if (h24 === 12) h24 = 0;
    } else {
      if (h24 !== 12) h24 += 12;
    }
    const hStr = String(h24).padStart(2, '0');
    const mStr = String(newMinute).padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const handleHourChange = (newHour: number) => {
    updateTime(newHour, minute, period);
  };

  const handleMinuteChange = (newMin: number) => {
    const validMin = (newMin + 60) % 60;
    updateTime(hour12, validMin, period);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    updateTime(hour12, minute, newPeriod);
  };

  const handleSetCurrentTime = () => {
    const current = getCurrentTimeString();
    onChange(current);
  };

  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Display Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="neu-input"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '0.55rem 0.75rem',
          textAlign: 'left',
          fontSize: '0.8125rem',
          color: 'var(--text-primary)',
          userSelect: 'none',
          borderRadius: 'var(--radius-sm)'
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
          <Clock size={15} color="var(--gold-primary)" />
          <span>{value ? formattedDisplay : 'Select time'}</span>
        </span>
        <span
          className="neu-inset"
          style={{
            fontSize: '0.6875rem',
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-gold)',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}
        >
          {period}
        </span>
      </button>

      {/* Modern Popover Time Picker */}
      {isOpen && (
        <div
          className="neu-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            minWidth: '280px',
            zIndex: 90,
            padding: '1rem',
            boxShadow: 'var(--neu-shadow-raised-lg), 0 12px 28px rgba(0, 0, 0, 0.4)',
            border: '1.5px solid var(--border-gold-strong)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface-card)',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header Display with Big Digits & AM/PM */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.875rem',
              paddingBottom: '0.625rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div
              className="neu-inset"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                gap: '0.25rem'
              }}
            >
              <span
                className="font-display"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--gold-primary)',
                  letterSpacing: '0.02em'
                }}
              >
                {String(hour12).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
              <span
                className="font-display"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--gold-primary)',
                  letterSpacing: '0.02em'
                }}
              >
                {String(minute).padStart(2, '0')}
              </span>
            </div>

            {/* AM / PM Segmented Control */}
            <div
              className="neu-inset"
              style={{
                display: 'flex',
                padding: '0.2rem',
                borderRadius: 'var(--radius-pill)',
                gap: '0.2rem'
              }}
            >
              <button
                type="button"
                onClick={() => handlePeriodChange('AM')}
                className={period === 'AM' ? 'neu-btn-gold' : 'neu-btn'}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('PM')}
                className={period === 'PM' ? 'neu-btn-gold' : 'neu-btn'}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                PM
              </button>
            </div>
          </div>

          {/* Hour Selection Grid (1-12) */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.35rem'
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                Hour
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => handleHourChange(hour12 === 1 ? 12 : hour12 - 1)}
                  className="neu-icon-btn"
                  style={{ width: '22px', height: '22px' }}
                  title="Hour down"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleHourChange(hour12 === 12 ? 1 : hour12 + 1)}
                  className="neu-icon-btn"
                  style={{ width: '22px', height: '22px' }}
                  title="Hour up"
                >
                  <ChevronUp size={13} />
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.35rem'
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                const isSelected = hour12 === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourChange(h)}
                    className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                    style={{
                      padding: '0.35rem 0',
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'center',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minute Quick Selection Grid */}
          <div style={{ marginBottom: '0.875rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.35rem'
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                Minute
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => handleMinuteChange(minute - 1)}
                  className="neu-icon-btn"
                  style={{ width: '22px', height: '22px' }}
                  title="Minute -1"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMinuteChange(minute + 1)}
                  className="neu-icon-btn"
                  style={{ width: '22px', height: '22px' }}
                  title="Minute +1"
                >
                  <ChevronUp size={13} />
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.35rem'
              }}
            >
              {minuteOptions.map((m) => {
                const isSelected = Math.abs(minute - m) < 2;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteChange(m)}
                    className={isSelected ? 'neu-btn-gold' : 'neu-btn'}
                    style={{
                      padding: '0.35rem 0',
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'center',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.625rem',
              borderTop: '1px solid var(--border-subtle)',
              gap: '0.5rem'
            }}
          >
            <button
              type="button"
              onClick={handleSetCurrentTime}
              className="neu-btn"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                gap: '0.3rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Sparkles size={13} color="var(--gold-primary)" />
              <span>Current Time</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="neu-btn neu-btn-gold"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                gap: '0.3rem'
              }}
            >
              <Check size={14} />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
