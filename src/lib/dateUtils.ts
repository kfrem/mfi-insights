// Date formatting utilities to replace date-fns format function
// This provides a lightweight alternative without external dependencies

/**
 * Formats a date using common patterns
 * Supports: yyyy-MM-dd, dd MMM yyyy, MMM d, h:mm a, HH:mm, PPpp, etc.
 */
export function formatDate(date: Date, pattern: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const dayOfWeek = date.getDay();
  
  // Handle special patterns first
  if (pattern === 'PPpp') {
    // Full date and time: "Jan 1, 2025, 2:30:45 PM"
    const h = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${months[month]} ${day}, ${year}, ${h}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
  }

  // Replace tokens
  let result = pattern;
  
  // Year
  result = result.replace('yyyy', String(year));
  result = result.replace('yy', String(year).slice(-2));
  
  // Month
  result = result.replace('MMMM', fullMonths[month]);
  result = result.replace('MMM', months[month]);
  result = result.replace('MM', pad(month + 1));
  
  // Day of week
  result = result.replace('EEEE', days[dayOfWeek]);
  
  // Day
  result = result.replace('dd', pad(day));
  result = result.replace(/\bd\b/, String(day));
  
  // Hours (24h)
  result = result.replace('HH', pad(hours));
  
  // Hours (12h)
  const h12 = hours % 12 || 12;
  result = result.replace(/\bh\b/, String(h12));
  
  // Minutes
  result = result.replace('mm', pad(minutes));
  
  // Seconds
  result = result.replace('ss', pad(seconds));
  
  // AM/PM — use word boundary to avoid matching 'a' in month names like 'Jan'
  const ampm = hours >= 12 ? 'PM' : 'AM';
  result = result.replace(/\ba\b/, ampm.toLowerCase());
  
  return result;
}

/**
 * Parse ISO date string to Date object
 */
export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Get the difference in days between two dates
 */
export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = dateLeft.getTime() - dateRight.getTime();
  return Math.floor(diff / msPerDay);
}

/**
 * Subtract days from a date
 */
export function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Subtract months from a date
 */
export function subMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get start of week (Sunday)
 */
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}
