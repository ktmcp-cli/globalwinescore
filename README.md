![Banner](https://raw.githubusercontent.com/ktmcp-cli/globalwinescore/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# GlobalWineScore CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with GlobalWineScore.

A production-ready command-line interface for [GlobalWineScore API](https://www.globalwinescore.com/) — comprehensive wine ratings aggregated from top critics worldwide. Query scores, search by vintage, color, and more from your terminal.

## Features

- **Latest Scores** — Get the most recent GlobalWineScore for any wine
- **Vintage Search** — Find top-rated wines by vintage year
- **Color Filtering** — Browse red, white, or pink wines
- **Top Rated** — Discover the highest-rated wines
- **L-WIN Support** — Query by L-WIN identifiers
- **Historical Data** — Access complete scoring history (business plan required)
- **JSON output** — All commands support `--json` for scripting
- **Rate Limited** — Respects 10 requests/minute API limit
- **Colorized output** — Clean terminal display with chalk

## Installation

```bash
npm install -g @ktmcp-cli/globalwinescore
```

## Quick Start

```bash
# Get your API token at https://www.globalwinescore.com/
globalwinescore config set --api-token YOUR_TOKEN

# Get latest scores
globalwinescore latest

# Get top-rated wines
globalwinescore top

# Search 2015 vintage
globalwinescore vintage 2015

# Browse red wines
globalwinescore color red
```

## Commands

### Config

```bash
globalwinescore config set --api-token <token>
globalwinescore config show
```

### Latest Scores

```bash
globalwinescore latest                          # Latest scores (20 results)
globalwinescore latest --limit 50               # Get 50 results
globalwinescore latest --vintage 2015           # Filter by vintage
globalwinescore latest --color red              # Filter by color
globalwinescore latest --wine-id 12345          # Specific wine ID
globalwinescore latest --lwin 1014210           # L-WIN identifier
globalwinescore latest --primeurs               # En primeur only
globalwinescore latest --ordering -score        # Sort by score descending
globalwinescore latest --json                   # JSON output
```

### Vintage

```bash
globalwinescore vintage 2015                    # 2015 vintage scores
globalwinescore vintage 2010 --color red        # 2010 red wines
globalwinescore vintage 2018 --limit 50         # More results
globalwinescore vintage 2020 --json             # JSON output
```

### Color

```bash
globalwinescore color red                       # Red wines
globalwinescore color white                     # White wines
globalwinescore color pink                      # Rosé wines
globalwinescore color red --vintage 2015        # 2015 red wines
globalwinescore color white --limit 50
```

### Top Rated

```bash
globalwinescore top                             # Top 20 wines
globalwinescore top --limit 50                  # Top 50 wines
globalwinescore top --color red                 # Top red wines
globalwinescore top --vintage 2015              # Top from 2015
globalwinescore top --json
```

### Wine ID

```bash
globalwinescore wine 12345                      # Get wine by ID
globalwinescore wine 12345 --json
```

### L-WIN

```bash
globalwinescore lwin 1014210                    # Get by L-WIN identifier
globalwinescore lwin 1014210 --json
```

### Historical (Business Plan Required)

```bash
globalwinescore historical                      # Historical scores
globalwinescore historical --wine-id 12345
globalwinescore historical --vintage 2010
globalwinescore historical --limit 100
globalwinescore historical --json
```

## JSON Output

All commands support `--json` for structured output:

```bash
globalwinescore latest --json | jq '.results[0]'
globalwinescore top --limit 10 --json | jq '.results[] | {wine: .wine_name, score: .score}'
globalwinescore vintage 2015 --json | jq '.results[] | select(.score > 95)'
```

## Understanding Scores

- **GlobalWineScore**: Aggregated score from multiple critics (0-100 scale)
- **Confidence Index**: Statistical confidence in the score
- **Vintage**: Year of wine production (NV = non-vintage)
- **Color**: red, white, or pink (rosé)
- **Appellation**: Wine region/designation

## Rate Limits

The API allows 10 requests per minute. The CLI will return an error if you exceed this limit.

## API Access Levels

- **Standard**: Latest scores endpoint
- **Business Plan**: Historical scores with complete computation history

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.
