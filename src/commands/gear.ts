import { Command } from 'commander';
import { getGear } from '../api/strava.js';
import { handleError } from '../utils/errors.js';
import { output } from '../utils/output.js';
import { formatGear } from '../utils/format.js';

export const gearCommand = new Command('gear')
  .description('Get gear details');

gearCommand
  .command('get <id>')
  .description('Get gear by ID (e.g., g123456)')
  .option('--pretty', 'human-readable output')
  .action(async (id, opts) => {
    try {
      const gear = await getGear(id);
      output(gear, () => formatGear(gear), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });

// Default: require subcommand
gearCommand.action(() => {
  gearCommand.help();
});
