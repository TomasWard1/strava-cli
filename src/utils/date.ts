/**
 * Date utilities for Strava CLI.
 * Converts human-friendly date flags to epoch timestamps for the API.
 */

export function nowEpoch(): number {
  return Math.floor(Date.now() / 1000);
}

export function daysAgoEpoch(days: number): number {
  return nowEpoch() - days * 86400;
}

export function todayStartEpoch(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export function weekStartEpoch(): number {
  return daysAgoEpoch(7);
}

export function monthStartEpoch(): number {
  return daysAgoEpoch(30);
}

export function yearStartEpoch(): number {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/**
 * Parse date range options into { after, before } epoch timestamps.
 * Supports: --today, --week, --month, --year, --days N, --after, --before
 */
export function parseDateRange(opts: {
  today?: boolean;
  week?: boolean;
  month?: boolean;
  year?: boolean;
  days?: string;
  after?: string;
  before?: string;
}): { after?: number; before?: number } {
  if (opts.today) return { after: todayStartEpoch() };
  if (opts.week) return { after: weekStartEpoch() };
  if (opts.month) return { after: monthStartEpoch() };
  if (opts.year) return { after: yearStartEpoch() };
  if (opts.days) return { after: daysAgoEpoch(Number(opts.days)) };

  return {
    after: opts.after ? Number(opts.after) : undefined,
    before: opts.before ? Number(opts.before) : undefined,
  };
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
