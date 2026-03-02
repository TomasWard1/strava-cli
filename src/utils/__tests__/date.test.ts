import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  nowEpoch,
  daysAgoEpoch,
  todayStartEpoch,
  weekStartEpoch,
  monthStartEpoch,
  yearStartEpoch,
  parseDateRange,
  formatDate,
  formatDateShort,
} from '../date.js';

describe('date utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('nowEpoch', () => {
    it('returns current unix timestamp in seconds', () => {
      const now = nowEpoch();
      const expected = Math.floor(Date.now() / 1000);
      expect(Math.abs(now - expected)).toBeLessThanOrEqual(1);
    });
  });

  describe('daysAgoEpoch', () => {
    it('returns epoch N days ago', () => {
      vi.useFakeTimers({ now: new Date('2026-03-02T12:00:00Z') });
      const sevenDaysAgo = daysAgoEpoch(7);
      const expected = Math.floor(new Date('2026-02-23T12:00:00Z').getTime() / 1000);
      expect(sevenDaysAgo).toBe(expected);
    });
  });

  describe('todayStartEpoch', () => {
    it('returns start of today (midnight local)', () => {
      const start = todayStartEpoch();
      const now = nowEpoch();
      expect(start).toBeLessThanOrEqual(now);
      expect(now - start).toBeLessThan(86400);
    });
  });

  describe('weekStartEpoch', () => {
    it('returns epoch 7 days ago', () => {
      const week = weekStartEpoch();
      const now = nowEpoch();
      expect(now - week).toBeGreaterThanOrEqual(7 * 86400 - 1);
      expect(now - week).toBeLessThanOrEqual(7 * 86400 + 1);
    });
  });

  describe('monthStartEpoch', () => {
    it('returns epoch 30 days ago', () => {
      const month = monthStartEpoch();
      const now = nowEpoch();
      expect(now - month).toBeGreaterThanOrEqual(30 * 86400 - 1);
      expect(now - month).toBeLessThanOrEqual(30 * 86400 + 1);
    });
  });

  describe('yearStartEpoch', () => {
    it('returns start of current year', () => {
      const yearStart = yearStartEpoch();
      const d = new Date(yearStart * 1000);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(1);
    });
  });

  describe('parseDateRange', () => {
    it('returns today range for --today', () => {
      const range = parseDateRange({ today: true });
      expect(range.after).toBeDefined();
      expect(range.before).toBeUndefined();
    });

    it('returns week range for --week', () => {
      const range = parseDateRange({ week: true });
      expect(range.after).toBeDefined();
    });

    it('returns month range for --month', () => {
      const range = parseDateRange({ month: true });
      expect(range.after).toBeDefined();
    });

    it('returns year range for --year', () => {
      const range = parseDateRange({ year: true });
      expect(range.after).toBeDefined();
    });

    it('returns custom days range', () => {
      const range = parseDateRange({ days: '14' });
      expect(range.after).toBeDefined();
      const now = nowEpoch();
      expect(now - range.after!).toBeGreaterThanOrEqual(14 * 86400 - 1);
    });

    it('passes through explicit after/before', () => {
      const range = parseDateRange({ after: '1704067200', before: '1704153600' });
      expect(range.after).toBe(1704067200);
      expect(range.before).toBe(1704153600);
    });

    it('returns empty for no options', () => {
      const range = parseDateRange({});
      expect(range.after).toBeUndefined();
      expect(range.before).toBeUndefined();
    });
  });

  describe('formatDate', () => {
    it('formats ISO date to readable string', () => {
      const result = formatDate('2026-03-02T08:00:00Z');
      expect(result).toContain('Mar');
      expect(result).toContain('2');
    });
  });

  describe('formatDateShort', () => {
    it('formats ISO date to short string', () => {
      const result = formatDateShort('2026-03-02T08:00:00Z');
      expect(result).toContain('Mar');
    });
  });
});
