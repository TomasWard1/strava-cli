import { makeRequest, fetchAllPages, type QueryParams } from './client.js';
import type {
  StravaAthlete,
  StravaActivity,
  StravaAthleteStats,
  StravaSegment,
  StravaSegmentEffort,
  StravaRoute,
  StravaClub,
  StravaGear,
  StravaStream,
  StravaLap,
  StravaZone,
  StravaComment,
} from '../types/strava.js';

// --- Athlete ---

export async function getAthlete(): Promise<StravaAthlete> {
  return makeRequest<StravaAthlete>('/athlete');
}

export async function getAthleteStats(athleteId: number): Promise<StravaAthleteStats> {
  return makeRequest<StravaAthleteStats>(`/athletes/${athleteId}/stats`);
}

export async function getAthleteZones(): Promise<StravaZone[]> {
  return makeRequest<StravaZone[]>('/athlete/zones');
}

// --- Activities ---

export async function listActivities(
  params: { before?: number; after?: number; per_page?: number; page?: number } = {},
): Promise<StravaActivity[]> {
  return makeRequest<StravaActivity[]>('/athlete/activities', params);
}

export async function getAllActivities(
  params: { before?: number; after?: number } = {},
): Promise<StravaActivity[]> {
  return fetchAllPages<StravaActivity>('/athlete/activities', params);
}

export async function getActivity(id: number): Promise<StravaActivity> {
  return makeRequest<StravaActivity>(`/activities/${id}`);
}

export async function getActivityLaps(id: number): Promise<StravaLap[]> {
  return makeRequest<StravaLap[]>(`/activities/${id}/laps`);
}

export async function getActivityZones(id: number): Promise<StravaZone[]> {
  return makeRequest<StravaZone[]>(`/activities/${id}/zones`);
}

export async function getActivityComments(
  id: number,
  params: QueryParams = {},
): Promise<StravaComment[]> {
  return makeRequest<StravaComment[]>(`/activities/${id}/comments`, params);
}

export async function getActivityKudos(
  id: number,
  params: QueryParams = {},
): Promise<Array<{ firstname: string; lastname: string }>> {
  return makeRequest<Array<{ firstname: string; lastname: string }>>(
    `/activities/${id}/kudos`,
    params,
  );
}

export async function getActivityStreams(
  id: number,
  keys: string[] = ['time', 'distance', 'heartrate', 'altitude', 'cadence', 'watts', 'latlng'],
): Promise<StravaStream[]> {
  return makeRequest<StravaStream[]>(`/activities/${id}/streams`, {
    keys: keys.join(','),
    key_by_type: true,
  });
}

// --- Segments ---

export async function getSegment(id: number): Promise<StravaSegment> {
  return makeRequest<StravaSegment>(`/segments/${id}`);
}

export async function getStarredSegments(
  params: QueryParams = {},
): Promise<StravaSegment[]> {
  return makeRequest<StravaSegment[]>('/segments/starred', params);
}

export async function getAllStarredSegments(): Promise<StravaSegment[]> {
  return fetchAllPages<StravaSegment>('/segments/starred');
}

export async function getSegmentEffort(id: number): Promise<StravaSegmentEffort> {
  return makeRequest<StravaSegmentEffort>(`/segment_efforts/${id}`);
}

export async function exploreSegments(bounds: {
  south_west_lat: number;
  south_west_lng: number;
  north_east_lat: number;
  north_east_lng: number;
  activity_type?: 'running' | 'riding';
}): Promise<{ segments: StravaSegment[] }> {
  return makeRequest<{ segments: StravaSegment[] }>('/segments/explore', {
    bounds: `${bounds.south_west_lat},${bounds.south_west_lng},${bounds.north_east_lat},${bounds.north_east_lng}`,
    activity_type: bounds.activity_type,
  });
}

// --- Routes ---

export async function getRoute(id: number): Promise<StravaRoute> {
  return makeRequest<StravaRoute>(`/routes/${id}`);
}

export async function getAthleteRoutes(
  athleteId: number,
  params: QueryParams = {},
): Promise<StravaRoute[]> {
  return makeRequest<StravaRoute[]>(`/athletes/${athleteId}/routes`, params);
}

export async function getRouteStreams(id: number): Promise<StravaStream[]> {
  return makeRequest<StravaStream[]>(`/routes/${id}/streams`);
}

// --- Clubs ---

export async function getClub(id: number): Promise<StravaClub> {
  return makeRequest<StravaClub>(`/clubs/${id}`);
}

export async function getAthleteClubs(): Promise<StravaClub[]> {
  return makeRequest<StravaClub[]>('/athlete/clubs');
}

export async function getClubActivities(
  id: number,
  params: QueryParams = {},
): Promise<StravaActivity[]> {
  return makeRequest<StravaActivity[]>(`/clubs/${id}/activities`, params);
}

export async function getClubMembers(
  id: number,
  params: QueryParams = {},
): Promise<Array<{ firstname: string; lastname: string }>> {
  return makeRequest<Array<{ firstname: string; lastname: string }>>(
    `/clubs/${id}/members`,
    params,
  );
}

// --- Gear ---

export async function getGear(id: string): Promise<StravaGear> {
  return makeRequest<StravaGear>(`/gear/${id}`);
}
