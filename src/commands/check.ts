import { Command } from 'commander';
import { getTokenStatus } from '../auth/tokens.js';
import { getAthlete, listActivities } from '../api/strava.js';
import { ExitCode } from '../utils/errors.js';

function isTTY(): boolean {
  return !!process.stdout.isTTY;
}

export const checkCommand = new Command('check')
  .description('Quick health check: auth status + recent activity snapshot')
  .action(async () => {
    const tokenStatus = getTokenStatus();

    if (!tokenStatus.authenticated) {
      if (isTTY()) {
        process.stderr.write('Not authenticated. Run: strava auth login\n');
      } else {
        console.log(JSON.stringify({
          ok: false,
          error: 'Not authenticated. Run: strava-cli auth login',
          code: ExitCode.AUTH_ERROR,
        }));
      }
      process.exit(ExitCode.AUTH_ERROR);
    }

    try {
      const athlete = await getAthlete();
      const recent = await listActivities({ per_page: 5 });
      const last = recent[0];

      const result = {
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
        last_activity: last
          ? { id: last.id, name: last.name, date: last.start_date_local, type: last.sport_type }
          : null,
      };

      if (isTTY()) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = Math.floor((tokenStatus.expires_at! - now) / 60);
        process.stderr.write(`  ${result.athlete.name} (#${result.athlete.id})\n`);
        process.stderr.write(`  Auth: OK (expires in ${expiresIn} min)\n`);
        process.stderr.write(`  Recent activities: ${result.recent_activities}\n`);
        if (last) {
          process.stderr.write(`  Last: ${last.name} (${last.sport_type}, ${last.start_date_local?.split('T')[0]})\n`);
        }
      } else {
        console.log(JSON.stringify(result));
      }
    } catch (error) {
      const errResult = {
        ok: false,
        checked_at: new Date().toISOString(),
        auth: {
          authenticated: true,
          expires_at: tokenStatus.expires_at,
          expired: tokenStatus.expired,
        },
        error: error instanceof Error ? error.message : String(error),
      };

      if (isTTY()) {
        process.stderr.write(`  Auth: OK\n`);
        process.stderr.write(`  Error: ${errResult.error}\n`);
      } else {
        console.log(JSON.stringify(errResult));
      }
      process.exit(ExitCode.GENERAL_ERROR);
    }
  });
