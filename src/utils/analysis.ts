import type { StravaActivity } from '../types/strava.js';

export interface ActivitySummary {
  period: string;
  total_activities: number;
  total_distance_km: number;
  total_moving_time_hours: number;
  total_elevation_m: number;
  by_type: Record<string, {
    count: number;
    distance_km: number;
    moving_time_hours: number;
    elevation_m: number;
  }>;
  avg_distance_km: number;
  avg_moving_time_min: number;
  avg_heartrate?: number;
  avg_watts?: number;
}

export interface TrendPoint {
  label: string;
  activities: number;
  distance_km: number;
  moving_time_hours: number;
  elevation_m: number;
  avg_heartrate?: number;
  avg_watts?: number;
}

export interface TrendsResult {
  period: string;
  points: TrendPoint[];
  direction: {
    distance: 'up' | 'down' | 'stable';
    volume: 'up' | 'down' | 'stable';
    heartrate: 'up' | 'down' | 'stable' | 'n/a';
  };
}

function round(n: number, decimals = 1): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

export function summarizeActivities(activities: StravaActivity[], period: string): ActivitySummary {
  const byType: ActivitySummary['by_type'] = {};

  let totalHR = 0;
  let hrCount = 0;
  let totalWatts = 0;
  let wattsCount = 0;

  for (const a of activities) {
    const type = a.sport_type || a.type || 'Unknown';
    if (!byType[type]) {
      byType[type] = { count: 0, distance_km: 0, moving_time_hours: 0, elevation_m: 0 };
    }
    byType[type].count++;
    byType[type].distance_km += a.distance / 1000;
    byType[type].moving_time_hours += a.moving_time / 3600;
    byType[type].elevation_m += a.total_elevation_gain;

    if (a.average_heartrate) {
      totalHR += a.average_heartrate;
      hrCount++;
    }
    if (a.average_watts) {
      totalWatts += a.average_watts;
      wattsCount++;
    }
  }

  // Round by_type values
  for (const type of Object.keys(byType)) {
    byType[type].distance_km = round(byType[type].distance_km);
    byType[type].moving_time_hours = round(byType[type].moving_time_hours);
    byType[type].elevation_m = round(byType[type].elevation_m, 0);
  }

  const totalDistance = activities.reduce((s, a) => s + a.distance, 0) / 1000;
  const totalTime = activities.reduce((s, a) => s + a.moving_time, 0) / 3600;
  const totalElev = activities.reduce((s, a) => s + a.total_elevation_gain, 0);

  return {
    period,
    total_activities: activities.length,
    total_distance_km: round(totalDistance),
    total_moving_time_hours: round(totalTime),
    total_elevation_m: round(totalElev, 0),
    by_type: byType,
    avg_distance_km: activities.length > 0 ? round(totalDistance / activities.length) : 0,
    avg_moving_time_min: activities.length > 0 ? round(totalTime * 60 / activities.length) : 0,
    avg_heartrate: hrCount > 0 ? round(totalHR / hrCount, 0) : undefined,
    avg_watts: wattsCount > 0 ? round(totalWatts / wattsCount, 0) : undefined,
  };
}

function getWeekLabel(date: Date): string {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function detectDirection(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  const recent = values.slice(-Math.ceil(values.length / 2));
  const older = values.slice(0, Math.ceil(values.length / 2));
  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const olderAvg = older.reduce((s, v) => s + v, 0) / older.length;
  const change = (recentAvg - olderAvg) / (olderAvg || 1);
  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'stable';
}

export function analyzeTrends(activities: StravaActivity[], period: string): TrendsResult {
  // Group by week
  const weeks = new Map<string, StravaActivity[]>();

  for (const a of activities) {
    const date = new Date(a.start_date_local || a.start_date);
    const label = getWeekLabel(date);
    if (!weeks.has(label)) weeks.set(label, []);
    weeks.get(label)!.push(a);
  }

  const points: TrendPoint[] = [];

  for (const [label, weekActivities] of weeks) {
    let hrSum = 0, hrCount = 0, wattsSum = 0, wattsCount = 0;

    for (const a of weekActivities) {
      if (a.average_heartrate) { hrSum += a.average_heartrate; hrCount++; }
      if (a.average_watts) { wattsSum += a.average_watts; wattsCount++; }
    }

    points.push({
      label,
      activities: weekActivities.length,
      distance_km: round(weekActivities.reduce((s, a) => s + a.distance, 0) / 1000),
      moving_time_hours: round(weekActivities.reduce((s, a) => s + a.moving_time, 0) / 3600),
      elevation_m: round(weekActivities.reduce((s, a) => s + a.total_elevation_gain, 0), 0),
      avg_heartrate: hrCount > 0 ? round(hrSum / hrCount, 0) : undefined,
      avg_watts: wattsCount > 0 ? round(wattsSum / wattsCount, 0) : undefined,
    });
  }

  const distances = points.map(p => p.distance_km);
  const volumes = points.map(p => p.activities);
  const heartrates = points.map(p => p.avg_heartrate).filter((v): v is number => v !== undefined);

  return {
    period,
    points,
    direction: {
      distance: detectDirection(distances),
      volume: detectDirection(volumes),
      heartrate: heartrates.length >= 2 ? detectDirection(heartrates) : 'n/a',
    },
  };
}

const DIRECTION_ARROWS: Record<string, string> = { up: '↑', down: '↓', stable: '→', 'n/a': '—' };

export function formatSummary(summary: ActivitySummary): string {
  const lines = [`📊 Summary (${summary.period})\n`];

  lines.push(`   ${summary.total_activities} activities | ${summary.total_distance_km}km | ${summary.total_moving_time_hours}h | ⛰️ ${summary.total_elevation_m}m`);
  lines.push(`   Avg: ${summary.avg_distance_km}km / ${summary.avg_moving_time_min}min per activity`);

  if (summary.avg_heartrate) lines.push(`   💓 Avg HR: ${summary.avg_heartrate}bpm`);
  if (summary.avg_watts) lines.push(`   ⚡ Avg Power: ${summary.avg_watts}W`);

  lines.push('');
  for (const [type, data] of Object.entries(summary.by_type)) {
    lines.push(`   ${type}: ${data.count}x | ${data.distance_km}km | ${data.moving_time_hours}h`);
  }

  return lines.join('\n');
}

export function formatTrends(trends: TrendsResult): string {
  const lines = [`📈 Trends (${trends.period})\n`];

  for (const p of trends.points) {
    const parts = [`   ${p.label}: ${p.activities} activities | ${p.distance_km}km | ${p.moving_time_hours}h`];
    if (p.avg_heartrate) parts.push(`HR ${p.avg_heartrate}`);
    if (p.avg_watts) parts.push(`${p.avg_watts}W`);
    lines.push(parts.join(' | '));
  }

  lines.push('');
  lines.push(`   Distance ${DIRECTION_ARROWS[trends.direction.distance]} | Volume ${DIRECTION_ARROWS[trends.direction.volume]} | HR ${DIRECTION_ARROWS[trends.direction.heartrate]}`);

  return lines.join('\n');
}
