/**
 * Formats a date string (YYYY-MM-DD) into a pleasant reading format
 */
export function formatMemoryDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats time string (HH:mm) to 12-hour format e.g. "3:45 PM"
 */
export function formatMemoryTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Gets today's local date string formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets current local time formatted as HH:mm
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculates elapsed time strictly within the first 24 hours of creation.
 * Rules:
 * 1. The elapsed-time display is based on creation date and time (createdAt).
 * 2. Show elapsed time only during the first 24 hours after the memory is added.
 * 3. Shows: "0 years, 0 months, 0 days, X hours ago" (e.g., 0 years, 0 months, 0 days, 3 hours ago).
 * 4. After 24 hours: hide elapsed-time display.
 * 5. If past date selected: do not show elapsed time.
 * 6. If future date selected: do not show elapsed time.
 */
export function getElapsedTimeDisplay(
  memoryDate: string,
  createdAt: number,
  nowMs: number = Date.now()
): string | null {
  const todayStr = getTodayDateString();

  // Rule 5 & 6: If a past date or future date is selected for the memory, do not show elapsed time
  if (memoryDate !== todayStr) {
    return null;
  }

  const diffMs = nowMs - createdAt;

  // Rule 4: If older than 24 hours (or negative in case of clock drift), hide
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  if (diffMs < 0 || diffMs >= TWENTY_FOUR_HOURS_MS) {
    return null;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  
  return `0 years, 0 months, 0 days, ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
}

/**
 * Checks if a memory date matches today's anniversary (same month and day)
 */
export function isMemoryAnniversary(memoryDate: string): boolean {
  if (!memoryDate || memoryDate.length < 10) return false;
  const todayStr = getTodayDateString();
  // Match MM-DD
  return memoryDate.slice(5) === todayStr.slice(5);
}

/**
 * Checks if date is within the past 7 days
 */
export function isDateInCurrentWeek(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - target.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

/**
 * Checks if date is in the current calendar month
 */
export function isDateInCurrentMonth(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = getTodayDateString();
  return dateStr.slice(0, 7) === today.slice(0, 7);
}

/**
 * Checks if date is in the current calendar year
 */
export function isDateInCurrentYear(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = getTodayDateString();
  return dateStr.slice(0, 4) === today.slice(0, 4);
}

