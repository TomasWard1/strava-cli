# strava-cli

Agent-first CLI for the Strava API v3. Built for automation, scripts, and AI agents — with human-readable output when you need it.

## Features

- **Full Strava API v3 coverage** — activities, athlete, segments, routes, clubs, gear, streams
- **Agent-first design** — JSON output by default, pipe to `jq` or parse programmatically
- **Human-readable mode** — `--pretty` flag for formatted output with pace, elevation, HR
- **OAuth 2.0** — browser-based login with local callback server, auto-refresh tokens
- **Rate limit aware** — tracks 15-min and daily limits from API response headers
- **Pagination** — `--all` flag to fetch every page automatically
- **Specific exit codes** — 0 success, 2 auth error, 3 rate limit, 4 network error

## Install

```bash
npm install -g strava-cli
```

Requires Node.js 22+.

## Setup

### 1. Create a Strava API Application

Go to [Strava API Settings](https://www.strava.com/settings/api) and create an application.

| Field | Value |
|-------|-------|
| **Authorization Callback Domain** | `localhost` |
| **Website** | `http://example.com` — not used by the CLI |

### 2. Authenticate

```bash
strava-cli auth login
```

First run prompts for your Client ID and Client Secret (from the Strava app page), saves them to `~/.strava-cli/config.json`, then opens your browser for OAuth authorization.

Alternatively, set environment variables (useful for CI/agents):

```bash
export STRAVA_CLIENT_ID=your_client_id
export STRAVA_CLIENT_SECRET=your_client_secret
strava-cli auth login
```

## Usage

### Athlete

```bash
strava-cli athlete                # Profile (JSON)
strava-cli athlete --pretty       # Profile (human-readable)
strava-cli athlete stats          # Lifetime totals
strava-cli athlete stats --pretty # Formatted stats
strava-cli athlete zones          # HR and power zones
```

### Activities

```bash
strava-cli activities list                    # Recent 30 activities
strava-cli activities list --all              # All activities
strava-cli activities list --after 1704067200 # After epoch timestamp
strava-cli activities list --pretty           # Human-readable list
strava-cli activities get 12345               # Single activity
strava-cli activities get 12345 --pretty      # Formatted activity
strava-cli activities laps 12345              # Lap data
strava-cli activities zones 12345             # Zone distribution
strava-cli activities streams 12345           # All data streams
strava-cli activities streams 12345 -k heartrate,watts  # Specific streams
strava-cli activities comments 12345          # Comments
strava-cli activities kudos 12345             # Kudos
```

### Segments

```bash
strava-cli segments get 229781              # Segment details
strava-cli segments get 229781 --pretty     # Formatted segment
strava-cli segments starred                 # Starred segments
strava-cli segments starred --all           # All starred segments
strava-cli segments effort 12345            # Segment effort
strava-cli segments explore --bounds -34.6,-58.5,-34.5,-58.4  # Explore area
strava-cli segments explore --bounds -34.6,-58.5,-34.5,-58.4 --type riding
```

### Routes

```bash
strava-cli routes list              # Your routes
strava-cli routes get 12345         # Route details
strava-cli routes get 12345 --pretty
strava-cli routes streams 12345     # Route data streams
```

### Clubs

```bash
strava-cli clubs list                   # Your clubs
strava-cli clubs get 12345              # Club details
strava-cli clubs get 12345 --pretty
strava-cli clubs activities 12345       # Club activities
strava-cli clubs members 12345          # Club members
```

### Gear

```bash
strava-cli gear get g12345          # Gear details
strava-cli gear get g12345 --pretty
```

### Auth

```bash
strava-cli auth login             # OAuth flow (opens browser)
strava-cli auth login --manual    # Headless mode (paste callback URL)
strava-cli auth status            # Token status and expiry
strava-cli auth refresh           # Proactively refresh token
strava-cli auth logout            # Clear stored tokens
```

#### Headless / VPS setup

On servers without a browser, use `--manual`:

```bash
strava-cli auth login --manual
```

1. The CLI prints an authorization URL
2. Open that URL in your local browser and authorize
3. Your browser redirects to `localhost:8420/callback?code=...` (page won't load — that's expected)
4. Copy the full URL from your browser's address bar
5. Paste it back into the CLI

### Rate Limit

```bash
strava-cli ratelimit     # Current API usage
```

## Agent Integration

The CLI is designed for AI agents and automation:

```bash
# Parse with jq
strava-cli activities list | jq '.[0].name'

# Use in scripts
LAST_RUN=$(strava-cli activities list --per-page 1 | jq '.[0]')

# Check auth status programmatically
AUTH=$(strava-cli auth status)
if echo "$AUTH" | jq -e '.authenticated == false' > /dev/null; then
  strava-cli auth login
fi

# Monitor rate limits
strava-cli ratelimit | jq '.fifteen_min.remaining'
```

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | — |
| 1 | General error | Check stderr |
| 2 | Auth error | Run `strava-cli auth login` |
| 3 | Rate limit | Wait and retry |
| 4 | Network error | Check connectivity |

### Token Management

Tokens are stored in `~/.strava-cli/tokens.json` with `0600` permissions. Access tokens auto-refresh 15 minutes before expiry — no manual refresh needed during normal use.

For cron jobs or long-running agents, use `strava-cli auth refresh` proactively.

## Rate Limits

Strava enforces:
- **200 requests per 15 minutes**
- **2,000 requests per day**

The CLI tracks these from response headers. Check with `strava-cli ratelimit`.

## Development

```bash
git clone https://github.com/TomasWard1/strava-cli.git
cd strava-cli
npm install
npm run dev -- athlete        # Run with tsx
npm test                      # Run tests
npm run lint                  # ESLint
npm run typecheck             # TypeScript strict
npm run build                 # Compile to dist/
```

### Git Workflow

- `main` — stable releases (protected)
- `staging` — integration branch
- All PRs target `staging` → auto-merge → promote to `main`

## License

MIT
