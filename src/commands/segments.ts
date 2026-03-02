import { Command } from 'commander';
import {
  getSegment,
  getStarredSegments,
  getAllStarredSegments,
  getSegmentEffort,
  exploreSegments,
} from '../api/strava.js';
import { handleError } from '../utils/errors.js';
import { output } from '../utils/output.js';
import { formatSegment } from '../utils/format.js';

export const segmentsCommand = new Command('segments')
  .description('Explore and inspect segments');

segmentsCommand
  .command('get <id>')
  .description('Get segment details by ID')
  .option('--pretty', 'human-readable output')
  .action(async (id, opts) => {
    try {
      const segment = await getSegment(Number(id));
      output(segment, () => formatSegment(segment), opts.pretty);
    } catch (error) {
      handleError(error);
    }
  });

segmentsCommand
  .command('starred')
  .description('List starred segments')
  .option('-a, --all', 'fetch all pages')
  .option('-n, --per-page <n>', 'results per page', '30')
  .option('-p, --page <n>', 'page number', '1')
  .action(async (opts) => {
    try {
      const segments = opts.all
        ? await getAllStarredSegments()
        : await getStarredSegments({ per_page: Number(opts.perPage), page: Number(opts.page) });
      console.log(JSON.stringify(segments));
    } catch (error) {
      handleError(error);
    }
  });

segmentsCommand
  .command('effort <id>')
  .description('Get a segment effort by ID')
  .action(async (id) => {
    try {
      const effort = await getSegmentEffort(Number(id));
      console.log(JSON.stringify(effort));
    } catch (error) {
      handleError(error);
    }
  });

segmentsCommand
  .command('explore')
  .description('Explore segments in a geographic area')
  .requiredOption('--bounds <coords>', 'SW lat,SW lng,NE lat,NE lng')
  .option('-t, --type <type>', 'activity type: running or riding')
  .action(async (opts) => {
    try {
      const [swLat, swLng, neLat, neLng] = opts.bounds.split(',').map(Number);
      const result = await exploreSegments({
        south_west_lat: swLat,
        south_west_lng: swLng,
        north_east_lat: neLat,
        north_east_lng: neLng,
        activity_type: opts.type,
      });
      console.log(JSON.stringify(result));
    } catch (error) {
      handleError(error);
    }
  });

// Default: starred segments
segmentsCommand.action(async () => {
  try {
    const segments = await getStarredSegments();
    console.log(JSON.stringify(segments));
  } catch (error) {
    handleError(error);
  }
});
