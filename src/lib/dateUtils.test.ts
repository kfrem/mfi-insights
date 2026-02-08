import { describe, it, expect } from 'vitest';
import {
  formatDate,
  differenceInDays,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subMonths,
  startOfWeek,
  startOfMonth,
} from './dateUtils';

describe('formatDate', () => {
  const date = new Date(2026, 0, 15, 14, 30, 45); // Jan 15, 2026 2:30:45 PM

  it('formats yyyy-MM-dd', () => {
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-01-15');
  });

  it('formats dd MMM yyyy', () => {
    expect(formatDate(date, 'dd MMM yyyy')).toBe('15 Jan 2026');
  });

  it('formats PPpp', () => {
    expect(formatDate(date, 'PPpp')).toBe('Jan 15, 2026, 2:30:45 PM');
  });

  it('formats HH:mm', () => {
    expect(formatDate(date, 'HH:mm')).toBe('14:30');
  });
});

describe('differenceInDays', () => {
  it('calculates positive difference', () => {
    const a = new Date(2026, 0, 15);
    const b = new Date(2026, 0, 10);
    expect(differenceInDays(a, b)).toBe(5);
  });

  it('calculates negative difference', () => {
    const a = new Date(2026, 0, 10);
    const b = new Date(2026, 0, 15);
    expect(differenceInDays(a, b)).toBe(-5);
  });

  it('returns 0 for same date', () => {
    const a = new Date(2026, 0, 15);
    expect(differenceInDays(a, a)).toBe(0);
  });
});

describe('addDays / subDays', () => {
  it('adds days correctly', () => {
    const base = new Date(2026, 0, 28);
    const result = addDays(base, 5);
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(1); // February
  });

  it('subtracts days correctly', () => {
    const base = new Date(2026, 1, 3);
    const result = subDays(base, 5);
    expect(result.getDate()).toBe(29);
    expect(result.getMonth()).toBe(0); // January
  });

  it('does not mutate original date', () => {
    const base = new Date(2026, 0, 15);
    const origTime = base.getTime();
    addDays(base, 10);
    expect(base.getTime()).toBe(origTime);
  });
});

describe('addWeeks', () => {
  it('adds weeks (7 days each)', () => {
    const base = new Date(2026, 0, 1);
    const result = addWeeks(base, 2);
    expect(result.getDate()).toBe(15);
  });
});

describe('addMonths / subMonths', () => {
  it('adds months correctly', () => {
    const base = new Date(2026, 0, 15);
    const result = addMonths(base, 3);
    expect(result.getMonth()).toBe(3); // April
  });

  it('subtracts months correctly', () => {
    const base = new Date(2026, 2, 15); // March
    const result = subMonths(base, 2);
    expect(result.getMonth()).toBe(0); // January
  });

  it('does not mutate original date', () => {
    const base = new Date(2026, 0, 15);
    const origTime = base.getTime();
    addMonths(base, 3);
    expect(base.getTime()).toBe(origTime);
  });
});

describe('startOfWeek', () => {
  it('returns Sunday for a Wednesday', () => {
    const wed = new Date(2026, 0, 14); // Wednesday
    const result = startOfWeek(wed);
    expect(result.getDay()).toBe(0); // Sunday
    expect(result.getDate()).toBe(11);
  });

  it('returns same day for Sunday', () => {
    const sun = new Date(2026, 0, 11); // Sunday
    const result = startOfWeek(sun);
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(11);
  });

  it('sets time to midnight', () => {
    const date = new Date(2026, 0, 14, 15, 30, 45);
    const result = startOfWeek(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

describe('startOfMonth', () => {
  it('returns 1st of the month', () => {
    const date = new Date(2026, 5, 18);
    const result = startOfMonth(date);
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(5);
  });

  it('sets time to midnight', () => {
    const date = new Date(2026, 5, 18, 15, 30, 45);
    const result = startOfMonth(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});
