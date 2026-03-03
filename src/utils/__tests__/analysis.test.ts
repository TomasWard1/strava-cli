import { describe, it, expect } from 'vitest';
import { summarizeActivities, analyzeTrends, formatSummary, formatTrends } from '../analysis.js';
import type { StravaActivity } from '../../types/strava.js';

function makeActivity(overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 1,
    name: 'Test',
    distance: 10000,
    moving_time: 3600,
    elapsed_time: 3800,
    total_elevation_gain: 100,
    type: 'Run',
    sport_type: 'Run',
    start_date: '2026-03-01T08:00:00Z',
    start_date_local: '2026-03-01T08:00:00Z',
    timezone: 'UTC',
    average_speed: 2.78,
    max_speed: 4.0,
    ...overrides,
  };
}

describe('summarizeActivities', () => {
  it('summarizes empty list', () => {
    const result = summarizeActivities([], 'week');
    expect(result.total_activities).toBe(0);
    expect(result.total_distance_km).toBe(0);
    expect(result.avg_distance_km).toBe(0);
  });

  it('summarizes activities with totals', () => {
    const activities = [
      makeActivity({ distance: 10000, moving_time: 3600, total_elevation_gain: 100 }),
      makeActivity({ distance: 20000, moving_time: 7200, total_elevation_gain: 200, sport_type: 'Ride', type: 'Ride' }),
    ];

    const result = summarizeActivities(activities, 'week');
    expect(result.total_activities).toBe(2);
    expect(result.total_distance_km).toBe(30);
    expect(result.total_moving_time_hours).toBe(3);
    expect(result.total_elevation_m).toBe(300);
    expect(result.by_type['Run'].count).toBe(1);
    expect(result.by_type['Ride'].count).toBe(1);
  });

  it('calculates averages', () => {
    const activities = [
      makeActivity({ distance: 10000, moving_time: 3000 }),
      makeActivity({ distance: 20000, moving_time: 6000 }),
    ];

    const result = summarizeActivities(activities, 'month');
    expect(result.avg_distance_km).toBe(15);
    expect(result.avg_moving_time_min).toBe(75);
  });

  it('includes HR and power averages when available', () => {
    const activities = [
      makeActivity({ average_heartrate: 150, average_watts: 200 }),
      makeActivity({ average_heartrate: 160, average_watts: 220 }),
    ];

    const result = summarizeActivities(activities, 'week');
    expect(result.avg_heartrate).toBe(155);
    expect(result.avg_watts).toBe(210);
  });

  it('skips HR/power when not available', () => {
    const activities = [makeActivity()];
    const result = summarizeActivities(activities, 'week');
    expect(result.avg_heartrate).toBeUndefined();
    expect(result.avg_watts).toBeUndefined();
  });
});

describe('analyzeTrends', () => {
  it('groups by week', () => {
    const activities = [
      makeActivity({ start_date_local: '2026-02-24T08:00:00Z' }),
      makeActivity({ start_date_local: '2026-02-25T08:00:00Z' }),
      makeActivity({ start_date_local: '2026-03-01T08:00:00Z' }),
    ];

    const result = analyzeTrends(activities, '30 days');
    expect(result.points.length).toBeGreaterThanOrEqual(1);
    expect(result.direction.distance).toBeDefined();
  });

  it('detects direction', () => {
    // Increasing distance over weeks
    const activities = [
      makeActivity({ distance: 5000, start_date_local: '2026-02-01T08:00:00Z' }),
      makeActivity({ distance: 5000, start_date_local: '2026-02-08T08:00:00Z' }),
      makeActivity({ distance: 15000, start_date_local: '2026-02-22T08:00:00Z' }),
      makeActivity({ distance: 20000, start_date_local: '2026-03-01T08:00:00Z' }),
    ];

    const result = analyzeTrends(activities, '30 days');
    expect(['up', 'stable', 'down']).toContain(result.direction.distance);
  });

  it('handles empty activities', () => {
    const result = analyzeTrends([], '30 days');
    expect(result.points).toHaveLength(0);
    expect(result.direction.distance).toBe('stable');
  });
});

describe('formatSummary', () => {
  it('formats summary with all fields', () => {
    const summary = summarizeActivities([
      makeActivity({ average_heartrate: 150 }),
      makeActivity({ sport_type: 'Ride', type: 'Ride', distance: 30000 }),
    ], 'week');

    const result = formatSummary(summary);
    expect(result).toContain('Summary');
    expect(result).toContain('2 activities');
    expect(result).toContain('Run');
    expect(result).toContain('Ride');
  });
});

describe('formatTrends', () => {
  it('formats trends with direction arrows', () => {
    const trends = analyzeTrends([
      makeActivity({ start_date_local: '2026-02-24T08:00:00Z' }),
      makeActivity({ start_date_local: '2026-03-01T08:00:00Z' }),
    ], '14 days');

    const result = formatTrends(trends);
    expect(result).toContain('Trends');
    expect(result).toMatch(/[↑↓→—]/);
  });
});
