import { Command } from 'commander';
import { getRateLimitStatus } from '../api/client.js';

export const rateLimitCommand = new Command('ratelimit')
  .description('Show current rate limit status')
  .action(() => {
    const status = getRateLimitStatus();
    console.log(JSON.stringify(status));
  });
