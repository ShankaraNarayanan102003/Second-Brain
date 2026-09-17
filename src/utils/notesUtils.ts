import {
  getTodayDateString,
  getCurrentTimeString,
  formatMemoryDate,
  formatMemoryTime,
  isDateInCurrentWeek,
  isDateInCurrentMonth,
  isDateInCurrentYear
} from './reminisceUtils';

export {
  getTodayDateString,
  getCurrentTimeString,
  formatMemoryDate,
  formatMemoryTime,
  isDateInCurrentWeek,
  isDateInCurrentMonth,
  isDateInCurrentYear
};

/**
 * Extracts clean plaintext snippet from formatted HTML content for note card preview.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  const tmp = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return tmp;
}

/**
 * Normalizes tags to start with '#' and be trimmed.
 */
export function normalizeTag(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

/**
 * Formats updatedAt timestamp into a relative or readable timestamp.
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins}m ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days < 7) {
    return `${days}d ago`;
  }
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
