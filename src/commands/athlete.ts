import { Command } from 'commander';
import { getAthlete, getAthleteStats, getAthleteZones } from '../api/strava.js';
import { handleError } from '../utils/errors.js';

export const athleteCommand = new Command('athlete')
  .description('Get authenticated athlete profile and stats');

athleteCommand
  .command('profile')
  .description('Get athlete profile')
  .action(async () => {
    try {
      const profile = await getAthlete();
      console.log(JSON.stringify(profile));
    } catch (error) {
      handleError(error);
    }
  });

athleteCommand
  .command('stats')
  .description('Get athlete stats (totals, records)')
  .action(async () => {
    try {
      const profile = await getAthlete();
      const stats = await getAthleteStats(profile.id);
      console.log(JSON.stringify(stats));
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
athleteCommand.action(async () => {
  try {
    const profile = await getAthlete();
    console.log(JSON.stringify(profile));
  } catch (error) {
    handleError(error);
  }
});
