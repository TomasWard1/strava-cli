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
git clone https://github.com/TomasWard1/strava-cli.git
cd strava-cli && npm install && npm run build && npm link
```

Both `strava` and `strava-cli` work as commands. Requires Node.js 22+.

## Setup

### 1. Create a Strava API Application

Go to [Strava API Settings](https://www.strava.com/settings/api) and create an application.

| Field | Value |
|-------|-------|
| **Authorization Callback Domain** | `localhost` |
| **Website** | `http://example.com` — not used by the CLI |

### 2. Authenticate

```bash
strava auth login
```

First run prompts for your Client ID and Client Secret (from the Strava app page), saves them to `~/.strava-cli/config.json`, then opens your browser for OAuth authorization. Tokens auto-refresh after that.

#### Headless setup (servers / CI)

On machines without a browser, use `--manual` to paste the callback URL:

```bash
# Pre-write credentials (skip interactive prompt)
mkdir -p ~/.strava-cli && chmod 700 ~/.strava-cli
cat > ~/.strava-cli/config.json << 'EOF'
{
  "client_id": "<your_client_id>",
  "client_secret": "<your_client_secret>"
}
EOF
chmod 600 ~/.strava-cli/config.json

# Login — shows URL, open on any machine, paste callback URL back
strava auth login --manual
```

## Usage

### Athlete

```bash
strava athlete                # Profile (JSON)
strava athlete --pretty       # Profile (human-readable)
strava athlete stats          # Lifetime totals
strava athlete stats --pretty # Formatted stats
strava athlete zones          # HR and power zones
```

### Activities

```bash
strava activities list                    # Recent 30 activities
strava activities list --all              # All activities
strava activities list --after 1704067200 # After epoch timestamp
strava activities list --pretty           # Human-readable list
strava activities get 12345               # Single activity
strava activities get 12345 --pretty      # Formatted activity
strava activities laps 12345              # Lap data
strava activities zones 12345             # Zone distribution
strava activities streams 12345           # All data streams
strava activities streams 12345 -k heartrate,watts  # Specific streams
strava activities comments 12345          # Comments
strava activities kudos 12345             # Kudos
```

### Segments

```bash
strava segments get 229781              # Segment details
strava segments get 229781 --pretty     # Formatted segment
strava segments starred                 # Starred segments
strava segments starred --all           # All starred segments
strava segments effort 12345            # Segment effort
strava segments explore --bounds -34.6,-58.5,-34.5,-58.4  # Explore area
strava segments explore --bounds -34.6,-58.5,-34.5,-58.4 --type riding
```

### Routes

```bash
strava routes list              # Your routes
strava routes get 12345         # Route details
strava routes get 12345 --pretty
strava routes streams 12345     # Route data streams
```

### Clubs

```bash
strava clubs list                   # Your clubs
strava clubs get 12345              # Club details
strava clubs get 12345 --pretty
strava clubs activities 12345       # Club activities
strava clubs members 12345          # Club members
```

### Gear

```bash
strava gear get g12345          # Gear details
strava gear get g12345 --pretty
```

### Auth

```bash
strava auth login            # OAuth flow (opens browser)
strava auth login --manual   # Headless: paste callback URL
strava auth status           # Token status and expiry
strava auth refresh          # Proactively refresh token
strava auth logout           # Clear stored tokens
```

### Rate Limit

```bash
strava ratelimit     # Current API usage
```

## Agent Integration

The CLI is designed for AI agents and automation:

```bash
# Parse with jq
strava activities list | jq '.[0].name'

# Use in scripts
LAST_RUN=$(strava activities list --per-page 1 | jq '.[0]')

# Check auth status programmatically
AUTH=$(strava auth status)
if echo "$AUTH" | jq -e '.authenticated == false' > /dev/null; then
  strava auth login
fi

# Monitor rate limits
strava ratelimit | jq '.fifteen_min.remaining'
```

### Agent self-install

```bash
git clone https://github.com/TomasWard1/strava-cli.git ~/tools/strava-cli
cd ~/tools/strava-cli && npm install && npm run build && npm link
```

A human must complete `strava auth login` once (OAuth requires browser authorization). After that, tokens auto-refresh and agents can use all commands without human interaction.

### Credential resolution

1. Config file (`~/.strava-cli/config.json`) — written by interactive setup or manually
2. Environment variables (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`) — override config file

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | — |
| 1 | General error | Check stderr |
| 2 | Auth error | Run `strava auth login` |
| 3 | Rate limit | Wait and retry |
| 4 | Network error | Check connectivity |

### Token Management

Tokens are stored in `~/.strava-cli/tokens.json` with `0600` permissions. Access tokens auto-refresh 15 minutes before expiry — no manual refresh needed during normal use.

For cron jobs or long-running agents, use `strava auth refresh` proactively.

## Rate Limits

Strava enforces:
- **200 requests per 15 minutes**
- **2,000 requests per day**

The CLI tracks these from response headers. Check with `strava ratelimit`.

## Storage

```
~/.strava-cli/
├── config.json    # Client credentials (600 perms)
└── tokens.json    # OAuth tokens (600 perms, auto-refresh)
```

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
