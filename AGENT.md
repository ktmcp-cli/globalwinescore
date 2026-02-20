# AGENT.md — GlobalWineScore CLI for AI Agents

This document explains how to use the GlobalWineScore CLI as an AI agent.

## Overview

The `globalwinescore` CLI provides wine ratings and scores from GlobalWineScore API. Use it for querying wine ratings, searching by vintage, color, and discovering top-rated wines.

## Prerequisites

```bash
globalwinescore config set --api-token <token>
```

Get your API token at: https://www.globalwinescore.com/

## All Commands

### Config

```bash
globalwinescore config set --api-token <token>
globalwinescore config show
```

### Latest Scores

```bash
globalwinescore latest                          # Latest 20 scores
globalwinescore latest --limit 50               # More results
globalwinescore latest --vintage 2015           # Filter by vintage
globalwinescore latest --color red              # Filter by color (red/white/pink)
globalwinescore latest --wine-id 12345          # Specific wine
globalwinescore latest --lwin 1014210           # L-WIN identifier
globalwinescore latest --primeurs               # En primeur only
globalwinescore latest --ordering -score        # Sort descending by score
globalwinescore latest --json                   # JSON output
```

### Vintage

```bash
globalwinescore vintage 2015                    # All 2015 wines
globalwinescore vintage 2010 --color red        # 2010 reds
globalwinescore vintage 2018 --json
```

### Color

```bash
globalwinescore color red                       # Red wines
globalwinescore color white                     # White wines
globalwinescore color pink                      # Rosé wines
globalwinescore color red --vintage 2015        # Combine filters
globalwinescore color white --json
```

### Top Rated

```bash
globalwinescore top                             # Top 20
globalwinescore top --limit 50                  # Top 50
globalwinescore top --color red                 # Top reds
globalwinescore top --vintage 2015              # Top from specific year
globalwinescore top --json
```

### Wine ID

```bash
globalwinescore wine 12345                      # Query by wine ID
globalwinescore wine 12345 --json
```

### L-WIN

```bash
globalwinescore lwin 1014210                    # Query by L-WIN
globalwinescore lwin 1014210 --json
```

### Historical (Business Plan Required)

```bash
globalwinescore historical                      # Historical score data
globalwinescore historical --wine-id 12345
globalwinescore historical --vintage 2010
globalwinescore historical --json
```

## Tips for Agents

1. Always use `--json` when parsing results programmatically
2. The API has a rate limit of 10 requests per minute
3. Results are paginated - use `--limit` to control page size
4. Scores are on a 0-100 scale
5. Colors are: red, white, pink (not rose or rosé)
6. The `confidence_index` field indicates statistical confidence
7. Historical endpoint requires a business plan subscription
8. Wine IDs and L-WIN identifiers are unique identifiers for wines

## Response Structure

```json
{
  "count": 100,
  "next": "...",
  "previous": null,
  "results": [
    {
      "wine_name": "Château Example",
      "vintage": "2015",
      "score": 96,
      "confidence_index": "A+",
      "appellation": "Pauillac",
      "color": "red",
      "wine_id": "12345",
      "lwin": "1014210",
      "is_primeurs": false
    }
  ]
}
```

## Common Workflows

**Find top wines from a vintage:**
```bash
globalwinescore vintage 2015 --json | jq '.results[] | select(.score >= 95)'
```

**Get highest-rated reds:**
```bash
globalwinescore top --color red --limit 10 --json
```

**Check specific wine score:**
```bash
globalwinescore wine 12345 --json | jq '.results[0].score'
```
