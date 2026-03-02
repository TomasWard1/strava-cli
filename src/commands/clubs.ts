import { Command } from 'commander';
import { getClub, getAthleteClubs, getClubActivities, getClubMembers } from '../api/strava.js';
import { handleError } from '../utils/errors.js';
import { output } from '../utils/output.js';
import { formatClub } from '../utils/format.js';

export const clubsCommand = new Command('clubs')
  .description('List and inspect clubs');

clubsCommand
  .command('list')
  .description('List athlete clubs')
  .action(async () => {
    try {
      const clubs = await getAthleteClubs();
      console.log(JSON.stringify(clubs));
    } catch (error) {
      handleError(error);
    }
  });

clubsCommand
  .command('get <id>')
  .description('Get club details by ID')
  .option('--pretty', 'human-readable output')
  .action(async (id, opts) => {
    try {
      const club = await getClub(Number(id));
      output(club, () => formatClub(club), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });

clubsCommand
  .command('activities <id>')
  .description('Get club activities')
  .option('-n, --per-page <n>', 'results per page', '30')
  .option('-p, --page <n>', 'page number', '1')
  .action(async (id, opts) => {
    try {
      const activities = await getClubActivities(Number(id), {
        per_page: Number(opts.perPage),
        page: Number(opts.page),
      });
      console.log(JSON.stringify(activities));
    } catch (error) {
      handleError(error);
    }
  });

clubsCommand
  .command('members <id>')
  .description('Get club members')
  .option('-n, --per-page <n>', 'results per page', '30')
  .option('-p, --page <n>', 'page number', '1')
  .action(async (id, opts) => {
    try {
      const members = await getClubMembers(Number(id), {
        per_page: Number(opts.perPage),
        page: Number(opts.page),
      });
      console.log(JSON.stringify(members));
    } catch (error) {
      handleError(error);
    }
  });

// Default: list clubs
clubsCommand.action(async () => {
  try {
    const clubs = await getAthleteClubs();
    console.log(JSON.stringify(clubs));
  } catch (error) {
    handleError(error);
  }
});
