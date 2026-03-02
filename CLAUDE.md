# strava-cli

Agent-first CLI for the Strava API v3.

## Git Workflow

- `main` = stable releases (protected, requires CI)
- `staging` = integration branch (all PRs target here)
- `feat/*`, `fix/*`, `chore/*` = development branches (from staging)

### CI/CD
1. PR to staging → lint + typecheck + tests → auto-merge
2. Push to staging → auto-creates PR to main
3. PR to main → full check (lint + typecheck + tests + build) → auto-merge

### Rules
- Never push directly to main
- All PRs target staging: `gh pr create --base staging`
- Auto-merge handles everything after CI passes

## Architecture

- **Runtime**: Node.js 22+, TypeScript, ES modules
- **CLI Framework**: Commander.js
- **Testing**: Vitest
- **Package manager**: npm

### Directory Structure
```
src/
├── index.ts          # Entry point
├── cli.ts            # Command registration
├── auth/             # OAuth 2.0 (login, tokens, callback server)
├── api/              # HTTP client, endpoints, Strava API wrapper
│   ├── client.ts     # makeRequest(), fetchAllPages(), rate limiting
│   ├── retry.ts      # withRetry() — exponential backoff with jitter
│   ├── endpoints.ts  # URL constants
│   └── strava.ts     # High-level API functions
├── commands/         # CLI command definitions
├── types/            # TypeScript interfaces
└── utils/            # Errors, formatting
```

### Design Principles
- **JSON output by default** — all commands output JSON to stdout
- **Errors to stderr** — human messages go to stderr, structured errors to stdout
- **Exit codes**: 0=success, 1=general, 2=auth, 3=rate limit, 4=network
- **Auto-refresh**: tokens refresh transparently before expiry
- **Auto-retry**: network errors and 429s retry with exponential backoff (3 retries, 1s base)

### Environment Variables
```
STRAVA_CLIENT_ID     — Strava API application client ID
STRAVA_CLIENT_SECRET — Strava API application client secret
```

### Local Dev
```bash
npm install
npm run dev -- athlete          # Run with tsx
npm test                        # Vitest
npm run lint && npm run typecheck
```
