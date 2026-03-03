import type { StravaActivity, StravaAthlete, StravaAthleteStats, StravaSegment, StravaRoute, StravaClub, StravaGear, StravaLap } from '../types/strava.js';

function metersToKm(m: number): string {
  return (m / 1000).toFixed(1);
}

function secondsToTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${sec}s`;
  return `${sec}s`;
}

function speedToPace(metersPerSec: number, isRun: boolean): string {
  if (metersPerSec === 0) return '0';
  if (isRun) {
    const minPerKm = 1000 / metersPerSec / 60;
    const mins = Math.floor(minPerKm);
    const secs = Math.round((minPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  }
  return `${(metersPerSec * 3.6).toFixed(1)}km/h`;
}

export function formatAthlete(a: StravaAthlete): string {
  const lines = [
    `👤 ${a.firstname} ${a.lastname} (@${a.username})`,
    `📍 ${[a.city, a.state, a.country].filter(Boolean).join(', ')}`,
    `⚖️  ${a.weight}kg`,
  ];
  return lines.join('\n');
}

export function formatAthleteStats(stats: StravaAthleteStats): string {
  const lines = ['📊 Athlete Stats\n'];

  const sections = [
    { label: '🚴 Rides', data: stats.all_ride_totals, ytd: stats.ytd_ride_totals },
    { label: '🏃 Runs', data: stats.all_run_totals, ytd: stats.ytd_run_totals },
    { label: '🏊 Swims', data: stats.all_swim_totals, ytd: stats.ytd_swim_totals },
  ];

  for (const { label, data, ytd } of sections) {
    if (data.count > 0) {
      lines.push(`${label} (all time)`);
      lines.push(`   ${data.count} activities | ${metersToKm(data.distance)}km | ${secondsToTime(data.moving_time)}`);
      lines.push(`   ↑ ${metersToKm(data.elevation_gain)}km elevation`);
      if (ytd.count > 0) {
        lines.push(`   YTD: ${ytd.count} | ${metersToKm(ytd.distance)}km`);
      }
      lines.push('');
    }
  }

  if (stats.biggest_ride_distance > 0) {
    lines.push(`🏆 Longest ride: ${metersToKm(stats.biggest_ride_distance)}km`);
  }
  if (stats.biggest_climb_elevation_gain > 0) {
    lines.push(`⛰️  Biggest climb: ${stats.biggest_climb_elevation_gain.toFixed(0)}m`);
  }

  return lines.join('\n');
}

export function formatActivity(a: StravaActivity): string {
  const isRun = a.type?.toLowerCase().includes('run');
  const lines = [
    `${a.name}`,
    `🏷️  ${a.sport_type || a.type} | ${new Date(a.start_date_local).toLocaleDateString()}`,
    `📏 ${metersToKm(a.distance)}km | ${secondsToTime(a.moving_time)} | ${speedToPace(a.average_speed, isRun)}`,
    `⛰️  ${a.total_elevation_gain.toFixed(0)}m elevation`,
  ];

  if (a.average_heartrate) {
    lines.push(`💓 HR: ${a.average_heartrate.toFixed(0)} avg / ${a.max_heartrate?.toFixed(0) || '?'} max`);
  }
  if (a.average_watts) {
    lines.push(`⚡ Power: ${a.average_watts.toFixed(0)}W avg / ${a.max_watts || '?'}W max`);
  }
  if (a.suffer_score) {
    lines.push(`😤 Suffer score: ${a.suffer_score}`);
  }

  return lines.join('\n');
}

export function formatActivityList(activities: StravaActivity[]): string {
  if (activities.length === 0) return 'No activities found.';

  return activities.map((a) => {
    const isRun = a.type?.toLowerCase().includes('run');
    const date = new Date(a.start_date_local).toLocaleDateString();
    const pace = speedToPace(a.average_speed, isRun);
    return `#${a.id} | ${date} | ${a.name} | ${metersToKm(a.distance)}km | ${secondsToTime(a.moving_time)} | ${pace}`;
  }).join('\n');
}

export function formatLaps(laps: StravaLap[]): string {
  if (laps.length === 0) return 'No laps.';

  return laps.map((l) => {
    const parts = [`Lap ${l.lap_index}: ${metersToKm(l.distance)}km | ${secondsToTime(l.moving_time)}`];
    if (l.average_heartrate) parts.push(`HR ${l.average_heartrate.toFixed(0)}`);
    if (l.average_watts) parts.push(`${l.average_watts.toFixed(0)}W`);
    return parts.join(' | ');
  }).join('\n');
}

export function formatSegment(s: StravaSegment): string {
  const lines = [
    `${s.name}${s.starred ? ' ⭐' : ''}`,
    `🏷️  ${s.activity_type} | Cat ${s.climb_category}`,
    `📏 ${metersToKm(s.distance)}km | ${s.average_grade.toFixed(1)}% avg / ${s.maximum_grade.toFixed(1)}% max`,
    `⛰️  ${s.elevation_low.toFixed(0)}m → ${s.elevation_high.toFixed(0)}m`,
    `📍 ${[s.city, s.state, s.country].filter(Boolean).join(', ')}`,
  ];
  return lines.join('\n');
}

export function formatRoute(r: StravaRoute): string {
  return [
    `${r.name}${r.starred ? ' ⭐' : ''}`,
    `📏 ${metersToKm(r.distance)}km | ⛰️ ${r.elevation_gain.toFixed(0)}m elevation`,
    r.description || '',
  ].filter(Boolean).join('\n');
}

export function formatClub(c: StravaClub): string {
  return [
    `${c.name}`,
    `🏷️  ${c.club_type} | ${c.sport_type} | ${c.member_count} members`,
    `📍 ${[c.city, c.state, c.country].filter(Boolean).join(', ')}`,
    c.description || '',
  ].filter(Boolean).join('\n');
}

export function formatGear(g: StravaGear): string {
  return [
    `${g.name}${g.primary ? ' (primary)' : ''}`,
    `🏷️  ${[g.brand_name, g.model_name].filter(Boolean).join(' ')}`,
    `📏 ${metersToKm(g.distance)}km total`,
    g.description || '',
  ].filter(Boolean).join('\n');
}
