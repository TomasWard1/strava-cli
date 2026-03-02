import { Command } from 'commander';
import { authCommand } from './commands/auth.js';

export const program = new Command();

program
  .name('strava-cli')
  .description('Agent-first CLI for the Strava API')
  .version('0.1.0');

program.addCommand(authCommand);
