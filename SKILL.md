---
name: strava-cli
description: Strava CLI for activities, athlete stats, segments, routes, clubs, gear, and streams data.
homepage: https://github.com/TomasWard1/strava-cli
metadata: {"clawdis":{"emoji":"🚴","requires":{"bins":["node"],"env":["STRAVA_CLIENT_ID","STRAVA_CLIENT_SECRET"]},"install":[{"id":"npm","kind":"npm","package":"strava-cli","bins":["strava-cli"],"label":"Install strava-cli (npm)"}]}}
---

# strava-cli

Use `strava-cli` to access Strava data: activities, athlete profile, segments, routes, clubs, gear.

Install: `npm install -g strava-cli` | [GitHub](https://github.com/TomasWard1/strava-cli)

## Setup
```bash
export STRAVA_CLIENT_ID=your_client_id
export STRAVA_CLIENT_SECRET=your_client_secret
strava-cli auth login
```

## Quick start
- `strava-cli athlete` — athlete profile (name, weight, city)
- `strava-cli athlete stats` — lifetime totals (rides, runs, swims)
- `strava-cli activities list` — recent activities (last 30)
- `strava-cli activities list --all` — fetch all activities
- `strava-cli activities get 12345` — single activity details
- `strava-cli activities streams 12345` — HR, power, GPS data
- `strava-cli segments starred` — starred segments
- `strava-cli routes list` — saved routes
- `strava-cli clubs list` — joined clubs
- `strava-cli gear get g12345` — gear details
- `strava-cli ratelimit` — current API rate limit status

## Auth commands
- `strava-cli auth login` — OAuth flow (opens browser, local callback)
- `strava-cli auth status` — check token status (expiry, refresh needed)
- `strava-cli auth logout` — clear stored tokens
- `strava-cli auth refresh` — proactively refresh token

## Data commands

### Athlete
- `athlete` or `athlete profile` — profile info
- `athlete stats` — lifetime and recent totals
- `athlete zones` — HR and power zones

### Activities
- `activities list` — list activities (default 30)
- `activities list --all` — fetch all pages
- `activities list --after <epoch>` — activities after timestamp
- `activities list --before <epoch>` — activities before timestamp
- `activities get <id>` — single activity
- `activities laps <id>` — lap data
- `activities zones <id>` — zone distribution
- `activities comments <id>` — comments
- `activities kudos <id>` — kudos list
- `activities streams <id>` — data streams (HR, power, GPS, cadence, altitude)
- `activities streams <id> --keys heartrate,watts` — specific streams only

### Segments
- `segments get <id>` — segment details
- `segments starred` — starred segments (add `--all` for all pages)
- `segments effort <id>` — segment effort details
- `segments explore --bounds lat1,lng1,lat2,lng2` — explore segments in area

### Routes
- `routes list` — athlete routes
- `routes get <id>` — route details
- `routes streams <id>` — route data streams

### Clubs
- `clubs list` — joined clubs
- `clubs get <id>` — club details
- `clubs activities <id>` — club activities
- `clubs members <id>` — club members

### Gear
- `gear get <id>` — gear details (bikes, shoes)

### Rate Limit
- `ratelimit` — current 15-min and daily usage

## Notes
- Output is JSON to stdout (pipe to `jq` for formatting)
- Tokens stored in `~/.strava-cli/tokens.json` (auto-refresh)
- Uses Strava API v3
- Rate limits: 200 req/15min, 2000 req/day
- Strava apps with read-only scope don't need review for personal use

## Sample output
```bash
$ strava-cli athlete
{"id":12345,"username":"johndoe","firstname":"John","lastname":"Doe","city":"Buenos Aires","state":"CABA","country":"Argentina","sex":"M","weight":82.5}

$ strava-cli activities list --per-page 2
[{"id":1001,"name":"Morning Run","distance":5420.3,"moving_time":1680,"type":"Run"},{"id":1002,"name":"Lunch Ride","distance":32100,"moving_time":3600,"type":"Ride"}]

$ strava-cli ratelimit
{"fifteen_min":{"limit":200,"used":15,"remaining":185},"daily":{"limit":2000,"used":150,"remaining":1850}}
```
