import { Command } from 'commander';

export const program = new Command();

program
  .name('strava-cli')
  .description('Agent-first CLI for the Strava API')
  .version('0.1.0');
