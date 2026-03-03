import { Command } from 'commander';
import { getAllActivities } from '../api/strava.js';
import { parseDateRange } from '../utils/date.js';
import { analyzeTrends, formatTrends } from '../utils/analysis.js';
import { output, getFormat } from '../utils/output.js';
import { handleError } from '../utils/errors.js';

export const trendsCommand = new Command('trends')
  .description('Weekly activity trends with direction indicators')
  .option('--month', 'last 30 days (default)')
  .option('--days <n>', 'last N days')
  .option('--year', 'year to date')
  .option('--after <epoch>', 'activities after epoch timestamp')
  .option('--before <epoch>', 'activities before epoch timestamp')
  .option('--pretty', 'human-readable output')
  .action(async (opts) => {
    try {
      // Default to month if no period specified
      if (!opts.month && !opts.year && !opts.days && !opts.after) {
        opts.month = true;
      }

      const { after, before } = parseDateRange(opts);
      const period = opts.year ? 'year to date'
        : opts.days ? `${opts.days} days`
        : '30 days';

      const activities = await getAllActivities({ after, before });
      const trends = analyzeTrends(activities, period);

      output(trends, () => formatTrends(trends), getFormat(opts));
    } catch (error) {
      handleError(error);
    }
  });
