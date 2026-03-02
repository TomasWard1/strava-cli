import { Command } from 'commander';
import {
  listActivities,
  getAllActivities,
  getActivity,
  getActivityLaps,
  getActivityZones,
  getActivityComments,
  getActivityKudos,
  getActivityStreams,
} from '../api/strava.js';
import { handleError } from '../utils/errors.js';

export const activitiesCommand = new Command('activities')
  .description('List and inspect activities');

activitiesCommand
  .command('list')
  .description('List athlete activities')
  .option('-n, --per-page <n>', 'results per page', '30')
  .option('-p, --page <n>', 'page number', '1')
  .option('--before <epoch>', 'activities before epoch timestamp')
  .option('--after <epoch>', 'activities after epoch timestamp')
  .option('-a, --all', 'fetch all pages')
  .action(async (opts) => {
    try {
      const params = {
        per_page: Number(opts.perPage),
        page: Number(opts.page),
        before: opts.before ? Number(opts.before) : undefined,
        after: opts.after ? Number(opts.after) : undefined,
      };

      const activities = opts.all
        ? await getAllActivities({ before: params.before, after: params.after })
        : await listActivities(params);

      console.log(JSON.stringify(activities));
    } catch (error) {
      handleError(error);
    }
  });

activitiesCommand
  .command('get <id>')
  .description('Get a single activity by ID')
  .action(async (id) => {
    try {
      const activity = await getActivity(Number(id));
      console.log(JSON.stringify(activity));
    } catch (error) {
      handleError(error);
    }
  });

activitiesCommand
  .command('laps <id>')
  .description('Get activity laps')
  .action(async (id) => {
    try {
      const laps = await getActivityLaps(Number(id));
      console.log(JSON.stringify(laps));
    } catch (error) {
      handleError(error);
    }
  });

activitiesCommand
  .command('zones <id>')
  .description('Get activity zones')
  .action(async (id) => {
    try {
      const zones = await getActivityZones(Number(id));
      console.log(JSON.stringify(zones));
    } catch (error) {
      handleError(error);
    }
  });

activitiesCommand
  .command('comments <id>')
  .description('Get activity comments')
  .action(async (id) => {
    try {
      const comments = await getActivityComments(Number(id));
      console.log(JSON.stringify(comments));
    } catch (error) {
      handleError(error);
    }
  });

activitiesCommand
  .command('kudos <id>')
  .description('Get activity kudos')
  .action(async (id) => {
    try {
      const kudos = await getActivityKudos(Number(id));
      console.log(JSON.stringify(kudos));
    } catch (error) {
      handleError(error);
    }
  });

activitiesCommand
  .command('streams <id>')
  .description('Get activity data streams (HR, power, GPS, etc.)')
  .option('-k, --keys <keys>', 'comma-separated stream keys', 'time,distance,heartrate,altitude,cadence,watts,latlng')
  .action(async (id, opts) => {
    try {
      const keys = opts.keys.split(',');
      const streams = await getActivityStreams(Number(id), keys);
      console.log(JSON.stringify(streams));
    } catch (error) {
      handleError(error);
    }
  });

// Default: list activities
activitiesCommand.action(async () => {
  try {
    const activities = await listActivities({ per_page: 30 });
    console.log(JSON.stringify(activities));
  } catch (error) {
    handleError(error);
  }
});
