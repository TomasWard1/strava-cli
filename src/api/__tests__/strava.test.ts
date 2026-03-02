import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getAthlete,
  getAthleteStats,
  listActivities,
  getAllActivities,
  getActivity,
  getActivityLaps,
  getActivityStreams,
  getSegment,
  getStarredSegments,
  getRoute,
  getAthleteClubs,
  getGear,
} from '../strava.js';

vi.mock('../../auth/tokens.js', () => ({
  getValidTokens: vi.fn().mockResolvedValue({
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_at: 9999999999,
    token_type: 'Bearer',
  }),
}));

function mockFetch(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as Response);
}

describe('Strava API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Athlete', () => {
    it('getAthlete returns athlete profile', async () => {
      const athlete = { id: 123, firstname: 'Test', lastname: 'User' };
      vi.stubGlobal('fetch', mockFetch(athlete));

      const result = await getAthlete();
      expect(result).toEqual(athlete);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('/athlete');
    });

    it('getAthleteStats fetches stats for athlete id', async () => {
      const stats = { all_ride_totals: { count: 50 } };
      vi.stubGlobal('fetch', mockFetch(stats));

      const result = await getAthleteStats(123);
      expect(result).toEqual(stats);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('/athletes/123/stats');
    });
  });

  describe('Activities', () => {
    it('listActivities with params', async () => {
      const activities = [{ id: 1, name: 'Run' }];
      vi.stubGlobal('fetch', mockFetch(activities));

      const result = await listActivities({ per_page: 10 });
      expect(result).toEqual(activities);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('per_page=10');
    });

    it('getAllActivities paginates', async () => {
      const page1 = Array.from({ length: 30 }, (_, i) => ({ id: i }));
      const page2: unknown[] = [];

      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve(page1),
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve(page2),
          headers: new Headers(),
        } as Response),
      );

      const result = await getAllActivities();
      expect(result).toHaveLength(30);
    });

    it('getActivity fetches single activity', async () => {
      const activity = { id: 456, name: 'Morning Run' };
      vi.stubGlobal('fetch', mockFetch(activity));

      const result = await getActivity(456);
      expect(result.id).toBe(456);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('/activities/456');
    });

    it('getActivityLaps fetches laps', async () => {
      const laps = [{ id: 1, lap_index: 1 }];
      vi.stubGlobal('fetch', mockFetch(laps));

      const result = await getActivityLaps(456);
      expect(result).toEqual(laps);
    });

    it('getActivityStreams requests correct stream keys', async () => {
      const streams = [{ type: 'heartrate', data: [120, 130] }];
      vi.stubGlobal('fetch', mockFetch(streams));

      await getActivityStreams(456, ['heartrate', 'watts']);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('keys=heartrate%2Cwatts');
    });
  });

  describe('Segments', () => {
    it('getSegment fetches by id', async () => {
      const segment = { id: 789, name: 'Hawk Hill' };
      vi.stubGlobal('fetch', mockFetch(segment));

      const result = await getSegment(789);
      expect(result.name).toBe('Hawk Hill');
    });

    it('getStarredSegments lists starred', async () => {
      const segments = [{ id: 1, starred: true }];
      vi.stubGlobal('fetch', mockFetch(segments));

      const result = await getStarredSegments();
      expect(result).toHaveLength(1);
    });
  });

  describe('Routes', () => {
    it('getRoute fetches by id', async () => {
      const route = { id: 101, name: 'Coast Loop' };
      vi.stubGlobal('fetch', mockFetch(route));

      const result = await getRoute(101);
      expect(result.name).toBe('Coast Loop');
    });
  });

  describe('Clubs', () => {
    it('getAthleteClubs lists clubs', async () => {
      const clubs = [{ id: 1, name: 'Test Club' }];
      vi.stubGlobal('fetch', mockFetch(clubs));

      const result = await getAthleteClubs();
      expect(result).toHaveLength(1);
    });
  });

  describe('Gear', () => {
    it('getGear fetches by string id', async () => {
      const gear = { id: 'g123', name: 'My Bike' };
      vi.stubGlobal('fetch', mockFetch(gear));

      const result = await getGear('g123');
      expect(result.name).toBe('My Bike');

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('/gear/g123');
    });
  });
});
