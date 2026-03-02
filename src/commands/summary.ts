import { Command } from 'commander';
import { getAllActivities } from '../api/strava.js';
import { parseDateRange } from '../utils/date.js';
import { summarizeActivities, formatSummary } from '../utils/analysis.js';
import { output } from '../utils/output.js';
import { handleError } from '../utils/errors.js';

export const summaryCommand = new Command('summary')
  .description('Quick activity summary for a time period')
  .option('--today', 'today only')
  .option('--week', 'last 7 days')
  .option('--month', 'last 30 days (default)')
  .option('--year', 'year to date')
  .option('--days <n>', 'last N days')
  .option('--after <epoch>', 'activities after epoch timestamp')
  .option('--before <epoch>', 'activities before epoch timestamp')
  .option('--pretty', 'human-readable output')
  .action(async (opts) => {
    try {
      // Default to month if no period specified
      if (!opts.today && !opts.week && !opts.month && !opts.year && !opts.days && !opts.after) {
        opts.month = true;
      }

      const { after, before } = parseDateRange(opts);
      const period = opts.today ? 'today'
        : opts.week ? '7 days'
        : opts.year ? 'year to date'
        : opts.days ? `${opts.days} days`
        : '30 days';

      const activities = await getAllActivities({ after, before });
      const summary = summarizeActivities(activities, period);

      output(summary, () => formatSummary(summary), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });
