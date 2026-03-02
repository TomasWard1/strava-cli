import { Command } from 'commander';
import { getGear } from '../api/strava.js';
import { handleError } from '../utils/errors.js';

export const gearCommand = new Command('gear')
  .description('Get gear details');

gearCommand
  .command('get <id>')
  .description('Get gear by ID (e.g., g123456)')
  .action(async (id) => {
    try {
      const gear = await getGear(id);
      console.log(JSON.stringify(gear));
    } catch (error) {
      handleError(error);
    }
  });

// Default: require subcommand
gearCommand.action(() => {
  gearCommand.help();
});
