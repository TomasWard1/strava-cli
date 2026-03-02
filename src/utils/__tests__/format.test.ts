import { describe, it, expect } from 'vitest';
import {
  formatAthlete,
  formatAthleteStats,
  formatActivity,
  formatActivityList,
  formatLaps,
  formatSegment,
  formatRoute,
  formatClub,
  formatGear,
} from '../format.js';
import type { StravaAthlete, StravaAthleteStats, StravaActivity, StravaSegment, StravaRoute, StravaClub, StravaGear, StravaLap, ActivityTotal } from '../../types/strava.js';

const mockAthlete: StravaAthlete = {
  id: 1, username: 'testuser', firstname: 'John', lastname: 'Doe',
  city: 'Buenos Aires', state: 'CABA', country: 'Argentina', sex: 'M',
  weight: 75, profile: '', profile_medium: '', created_at: '', updated_at: '',
};

const emptyTotal: ActivityTotal = { count: 0, distance: 0, moving_time: 0, elapsed_time: 0, elevation_gain: 0 };

const mockStats: StravaAthleteStats = {
  biggest_ride_distance: 105000,
  biggest_climb_elevation_gain: 1200,
  recent_ride_totals: emptyTotal,
  recent_run_totals: emptyTotal,
  recent_swim_totals: emptyTotal,
  ytd_ride_totals: { count: 20, distance: 800000, moving_time: 100000, elapsed_time: 110000, elevation_gain: 5000 },
  ytd_run_totals: emptyTotal,
  ytd_swim_totals: emptyTotal,
  all_ride_totals: { count: 150, distance: 5000000, moving_time: 600000, elapsed_time: 700000, elevation_gain: 50000 },
  all_run_totals: { count: 50, distance: 500000, moving_time: 200000, elapsed_time: 220000, elevation_gain: 3000 },
  all_swim_totals: emptyTotal,
};

const mockActivity: StravaActivity = {
  id: 1, name: 'Morning Run', distance: 10000, moving_time: 3000,
  elapsed_time: 3200, total_elevation_gain: 120, type: 'Run', sport_type: 'Run',
  start_date: '2026-03-01T08:00:00Z', start_date_local: '2026-03-01T08:00:00Z',
  timezone: 'America/Argentina/Buenos_Aires', average_speed: 3.33, max_speed: 4.5,
  average_heartrate: 155, max_heartrate: 178,
};

describe('formatAthlete', () => {
  it('formats athlete profile', () => {
    const result = formatAthlete(mockAthlete);
    expect(result).toContain('John Doe');
    expect(result).toContain('@testuser');
    expect(result).toContain('Buenos Aires');
    expect(result).toContain('75kg');
  });
});

describe('formatAthleteStats', () => {
  it('formats stats with totals', () => {
    const result = formatAthleteStats(mockStats);
    expect(result).toContain('Rides');
    expect(result).toContain('150 activities');
    expect(result).toContain('5000.0km');
    expect(result).toContain('Runs');
    expect(result).toContain('Longest ride: 105.0km');
    expect(result).toContain('Biggest climb: 1200m');
  });
});

describe('formatActivity', () => {
  it('formats single activity with HR', () => {
    const result = formatActivity(mockActivity);
    expect(result).toContain('Morning Run');
    expect(result).toContain('10.0km');
    expect(result).toContain('120m elevation');
    expect(result).toContain('HR: 155');
  });

  it('shows power when available', () => {
    const withPower = { ...mockActivity, average_watts: 250, max_watts: 400 };
    const result = formatActivity(withPower);
    expect(result).toContain('250W avg');
  });
});

describe('formatActivityList', () => {
  it('formats list of activities', () => {
    const result = formatActivityList([mockActivity, { ...mockActivity, id: 2, name: 'Evening Ride' }]);
    expect(result).toContain('Morning Run');
    expect(result).toContain('Evening Ride');
  });

  it('handles empty list', () => {
    expect(formatActivityList([])).toBe('No activities found.');
  });
});

describe('formatLaps', () => {
  it('formats laps', () => {
    const laps: StravaLap[] = [{
      id: 1, activity: { id: 1 }, name: 'Lap 1', elapsed_time: 300,
      moving_time: 290, start_date: '', distance: 1000, average_speed: 3.4,
      max_speed: 4.0, lap_index: 1, average_heartrate: 150,
    }];
    const result = formatLaps(laps);
    expect(result).toContain('Lap 1');
    expect(result).toContain('1.0km');
    expect(result).toContain('HR 150');
  });
});

describe('formatSegment', () => {
  it('formats segment with grade info', () => {
    const seg: StravaSegment = {
      id: 1, name: 'Hawk Hill', activity_type: 'Ride', distance: 2500,
      average_grade: 5.2, maximum_grade: 12.1, elevation_high: 200,
      elevation_low: 50, climb_category: 4, city: 'Mill Valley',
      state: 'CA', country: 'US', starred: true,
    };
    const result = formatSegment(seg);
    expect(result).toContain('Hawk Hill');
    expect(result).toContain('⭐');
    expect(result).toContain('5.2% avg');
    expect(result).toContain('50m → 200m');
  });
});

describe('formatRoute', () => {
  it('formats route', () => {
    const route: StravaRoute = {
      id: 1, name: 'Coast Loop', description: 'Scenic coastal ride',
      distance: 45000, elevation_gain: 800, type: 1, sub_type: 1,
      starred: false, timestamp: 0, map: { id: '', summary_polyline: '', polyline: '' },
    };
    const result = formatRoute(route);
    expect(result).toContain('Coast Loop');
    expect(result).toContain('45.0km');
    expect(result).toContain('800m elevation');
  });
});

describe('formatClub', () => {
  it('formats club', () => {
    const club: StravaClub = {
      id: 1, name: 'BA Cyclists', profile_medium: '', profile: '',
      description: 'Cycling group', club_type: 'casual_club',
      sport_type: 'cycling', city: 'Buenos Aires', state: 'CABA',
      country: 'Argentina', member_count: 120,
    };
    const result = formatClub(club);
    expect(result).toContain('BA Cyclists');
    expect(result).toContain('120 members');
  });
});

describe('formatGear', () => {
  it('formats gear', () => {
    const gear: StravaGear = {
      id: 'g1', name: 'Canyon Aeroad', primary: true,
      distance: 12000000, brand_name: 'Canyon', model_name: 'Aeroad CF SLX',
      description: '',
    };
    const result = formatGear(gear);
    expect(result).toContain('Canyon Aeroad');
    expect(result).toContain('(primary)');
    expect(result).toContain('12000.0km');
    expect(result).toContain('Canyon Aeroad CF SLX');
  });
});
