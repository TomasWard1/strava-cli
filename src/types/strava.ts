export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  sex: string;
  weight: number;
  profile: string;
  profile_medium: string;
  created_at: string;
  updated_at: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  suffer_score?: number;
  average_cadence?: number;
  gear_id?: string;
  map?: {
    id: string;
    summary_polyline: string;
    polyline?: string;
  };
}

export interface StravaSegment {
  id: number;
  name: string;
  activity_type: string;
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_high: number;
  elevation_low: number;
  climb_category: number;
  city: string;
  state: string;
  country: string;
  starred: boolean;
}

export interface StravaSegmentEffort {
  id: number;
  name: string;
  activity: { id: number };
  athlete: { id: number };
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  segment: StravaSegment;
}

export interface StravaRoute {
  id: number;
  name: string;
  description: string;
  distance: number;
  elevation_gain: number;
  type: number;
  sub_type: number;
  starred: boolean;
  timestamp: number;
  map: {
    id: string;
    summary_polyline: string;
    polyline: string;
  };
}

export interface StravaClub {
  id: number;
  name: string;
  profile_medium: string;
  profile: string;
  description: string;
  club_type: string;
  sport_type: string;
  city: string;
  state: string;
  country: string;
  member_count: number;
}

export interface StravaGear {
  id: string;
  name: string;
  primary: boolean;
  distance: number;
  brand_name: string;
  model_name: string;
  description: string;
}

export interface StravaStream {
  type: string;
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
}

export interface StravaAthleteStats {
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
  recent_ride_totals: ActivityTotal;
  recent_run_totals: ActivityTotal;
  recent_swim_totals: ActivityTotal;
  ytd_ride_totals: ActivityTotal;
  ytd_run_totals: ActivityTotal;
  ytd_swim_totals: ActivityTotal;
  all_ride_totals: ActivityTotal;
  all_run_totals: ActivityTotal;
  all_swim_totals: ActivityTotal;
}

export interface ActivityTotal {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
}

export interface StravaLap {
  id: number;
  activity: { id: number };
  name: string;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  distance: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  lap_index: number;
}

export interface StravaZone {
  score: number;
  distribution_buckets: Array<{
    max: number;
    min: number;
    time: number;
  }>;
  type: string;
  sensor_based: boolean;
}

export interface StravaComment {
  id: number;
  text: string;
  athlete: { id: number; firstname: string; lastname: string };
  created_at: string;
}

export interface StravaUpload {
  id: number;
  external_id: string;
  error: string | null;
  status: string;
  activity_id: number | null;
}
