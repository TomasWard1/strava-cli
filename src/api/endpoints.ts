export const BASE_URL = 'https://www.strava.com/api/v3';

export const OAUTH_URL = 'https://www.strava.com/oauth';

export const endpoints = {
  // OAuth
  authorize: `${OAUTH_URL}/authorize`,
  token: `${OAUTH_URL}/token`,
  deauthorize: `${OAUTH_URL}/deauthorize`,

  // Athlete
  athlete: `${BASE_URL}/athlete`,
  athleteZones: `${BASE_URL}/athlete/zones`,
  athleteStats: (id: number) => `${BASE_URL}/athletes/${id}/stats`,

  // Activities
  activities: `${BASE_URL}/athlete/activities`,
  activity: (id: number) => `${BASE_URL}/activities/${id}`,
  activityComments: (id: number) => `${BASE_URL}/activities/${id}/comments`,
  activityKudos: (id: number) => `${BASE_URL}/activities/${id}/kudos`,
  activityLaps: (id: number) => `${BASE_URL}/activities/${id}/laps`,
  activityZones: (id: number) => `${BASE_URL}/activities/${id}/zones`,
  activityStreams: (id: number) => `${BASE_URL}/activities/${id}/streams`,

  // Segments
  segment: (id: number) => `${BASE_URL}/segments/${id}`,
  starredSegments: `${BASE_URL}/segments/starred`,
  segmentEfforts: `${BASE_URL}/segment_efforts`,
  segmentEffort: (id: number) => `${BASE_URL}/segment_efforts/${id}`,
  segmentStarred: (id: number) => `${BASE_URL}/segments/${id}/starred`,
  exploreSegments: `${BASE_URL}/segments/explore`,

  // Routes
  athleteRoutes: (id: number) => `${BASE_URL}/athletes/${id}/routes`,
  route: (id: number) => `${BASE_URL}/routes/${id}`,
  routeStreams: (id: number) => `${BASE_URL}/routes/${id}/streams`,
  routeExportGPX: (id: number) => `${BASE_URL}/routes/${id}/export_gpx`,
  routeExportTCX: (id: number) => `${BASE_URL}/routes/${id}/export_tcx`,

  // Clubs
  club: (id: number) => `${BASE_URL}/clubs/${id}`,
  clubActivities: (id: number) => `${BASE_URL}/clubs/${id}/activities`,
  clubMembers: (id: number) => `${BASE_URL}/clubs/${id}/members`,
  athleteClubs: `${BASE_URL}/athlete/clubs`,

  // Gear
  gear: (id: string) => `${BASE_URL}/gear/${id}`,

  // Uploads
  uploads: `${BASE_URL}/uploads`,
  upload: (id: number) => `${BASE_URL}/uploads/${id}`,
} as const;
