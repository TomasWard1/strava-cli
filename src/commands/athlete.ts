import { Command } from 'commander';
import { getAthlete, getAthleteStats, getAthleteZones } from '../api/strava.js';
import { handleError } from '../utils/errors.js';
import { output } from '../utils/output.js';
import { formatAthlete, formatAthleteStats } from '../utils/format.js';

export const athleteCommand = new Command('athlete')
  .description('Get authenticated athlete profile and stats');

athleteCommand
  .command('profile')
  .description('Get athlete profile')
  .option('--pretty', 'human-readable output')
  .action(async (opts) => {
    try {
      const profile = await getAthlete();
      output(profile, () => formatAthlete(profile), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });

athleteCommand
  .command('stats')
  .description('Get athlete stats (totals, records)')
  .option('--pretty', 'human-readable output')
  .action(async (opts) => {
    try {
      const profile = await getAthlete();
      const stats = await getAthleteStats(profile.id);
      output(stats, () => formatAthleteStats(stats), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });

athleteCommand
  .command('zones')
  .description('Get athlete heart rate and power zones')
  .action(async () => {
    try {
      const zones = await getAthleteZones();
      console.log(JSON.stringify(zones));
    } catch (error) {
      handleError(error);
    }
  });

// Default: show profile
athleteCommand
  .option('--pretty', 'human-readable output')
  .action(async (opts) => {
    try {
      const profile = await getAthlete();
      output(profile, () => formatAthlete(profile), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });
