import { Command } from 'commander';
import { getRoute, getAthleteRoutes, getRouteStreams, getAthlete } from '../api/strava.js';
import { handleError } from '../utils/errors.js';
import { output } from '../utils/output.js';
import { formatRoute } from '../utils/format.js';

export const routesCommand = new Command('routes')
  .description('List and inspect routes');

routesCommand
  .command('list')
  .description('List athlete routes')
  .option('-n, --per-page <n>', 'results per page', '30')
  .option('-p, --page <n>', 'page number', '1')
  .action(async (opts) => {
    try {
      const athlete = await getAthlete();
      const routes = await getAthleteRoutes(athlete.id, {
        per_page: Number(opts.perPage),
        page: Number(opts.page),
      });
      console.log(JSON.stringify(routes));
    } catch (error) {
      handleError(error);
    }
  });

routesCommand
  .command('get <id>')
  .description('Get route details by ID')
  .option('--pretty', 'human-readable output')
  .action(async (id, opts) => {
    try {
      const route = await getRoute(Number(id));
      output(route, () => formatRoute(route), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });

routesCommand
  .command('streams <id>')
  .description('Get route data streams')
  .action(async (id) => {
    try {
      const streams = await getRouteStreams(Number(id));
      console.log(JSON.stringify(streams));
    } catch (error) {
      handleError(error);
    }
  });

// Default: list routes
routesCommand.action(async () => {
  try {
    const athlete = await getAthlete();
    const routes = await getAthleteRoutes(athlete.id);
    console.log(JSON.stringify(routes));
  } catch (error) {
    handleError(error);
  }
});
