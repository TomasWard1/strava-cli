import { Command } from 'commander';
import { authCommand } from './commands/auth.js';
import { athleteCommand } from './commands/athlete.js';
import { activitiesCommand } from './commands/activities.js';
import { segmentsCommand } from './commands/segments.js';
import { routesCommand } from './commands/routes.js';
import { clubsCommand } from './commands/clubs.js';
import { gearCommand } from './commands/gear.js';
import { rateLimitCommand } from './commands/ratelimit.js';

export const program = new Command();

program
  .name('strava-cli')
  .description('Agent-first CLI for the Strava API')
  .version('0.1.0');

program.addCommand(authCommand);
program.addCommand(athleteCommand);
program.addCommand(activitiesCommand);
program.addCommand(segmentsCommand);
program.addCommand(routesCommand);
program.addCommand(clubsCommand);
program.addCommand(gearCommand);
program.addCommand(rateLimitCommand);
