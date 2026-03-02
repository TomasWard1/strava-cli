import { Command } from 'commander';
import { getTokenStatus } from '../auth/tokens.js';
import { getAthlete, listActivities } from '../api/strava.js';
import { ExitCode } from '../utils/errors.js';

export const checkCommand = new Command('check')
  .description('Quick health check: auth status + recent activity snapshot')
  .action(async () => {
    const tokenStatus = getTokenStatus();

    if (!tokenStatus.authenticated) {
      console.log(JSON.stringify({
        ok: false,
        error: 'Not authenticated. Run: strava-cli auth login',
        code: ExitCode.AUTH_ERROR,
      }));
      process.exit(ExitCode.AUTH_ERROR);
    }

    try {
      const athlete = await getAthlete();
      const recent = await listActivities({ per_page: 5 });

      console.log(JSON.stringify({
        ok: true,
        checked_at: new Date().toISOString(),
        auth: {
          authenticated: true,
          expires_at: tokenStatus.expires_at,
          expired: tokenStatus.expired,
        },
        athlete: {
          id: athlete.id,
          name: `${athlete.firstname} ${athlete.lastname}`,
        },
        recent_activities: recent.length,
        last_activity: recent[0]
          ? { id: recent[0].id, name: recent[0].name, date: recent[0].start_date_local, type: recent[0].sport_type }
          : null,
      }));
    } catch (error) {
      console.log(JSON.stringify({
        ok: false,
        checked_at: new Date().toISOString(),
        auth: {
          authenticated: true,
          expires_at: tokenStatus.expires_at,
          expired: tokenStatus.expired,
        },
        error: error instanceof Error ? error.message : String(error),
      }));
      process.exit(ExitCode.GENERAL_ERROR);
    }
  });
