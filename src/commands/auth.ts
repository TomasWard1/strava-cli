import { Command } from 'commander';
import { login, logout, status, refresh } from '../auth/oauth.js';
import { handleError } from '../utils/errors.js';

export const authCommand = new Command('auth')
  .description('Manage Strava authentication');

authCommand
  .command('login')
  .description('Start OAuth flow (opens browser)')
  .action(async () => {
    try {
      await login();
    } catch (error) {
      handleError(error);
    }
  });

authCommand
  .command('logout')
  .description('Clear stored tokens')
  .action(() => {
    try {
      logout();
    } catch (error) {
      handleError(error);
    }
  });

authCommand
  .command('status')
  .description('Check authentication status')
  .action(() => {
    try {
      status();
    } catch (error) {
      handleError(error);
    }
  });

authCommand
  .command('refresh')
  .description('Proactively refresh access token')
  .action(async () => {
    try {
      await refresh();
    } catch (error) {
      handleError(error);
    }
  });
