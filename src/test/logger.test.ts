import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs error messages', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Something failed', 'TestContext');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('[ERROR]');
    expect(spy.mock.calls[0][0]).toContain('[TestContext]');
    expect(spy.mock.calls[0][0]).toContain('Something failed');
  });

  it('logs warn messages', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Something suspicious', 'TestContext');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('[WARN]');
  });

  it('includes data when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const data = { userId: '123', action: 'delete' };
    logger.error('Action failed', 'TestContext', data);
    expect(spy.mock.calls[0][1]).toEqual(data);
  });

  it('includes timestamp in log entries', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Test message');
    // Timestamp format: [2026-01-01T00:00:00.000Z]
    expect(spy.mock.calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
  });
});
