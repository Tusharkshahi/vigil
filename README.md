# Vigil

**Self-healing engineering change intelligence** — know about breaking changes in your stack before they hit production.

> Built for the [WeMakeDevs Into the Scrape-Verse hackathon](https://www.wemakedevs.org/hackathons/scrape-verse) using [Bright Data Scraper Studio](https://brightdata.com/products/scraper-studio).

---

## The Problem

Engineering teams run on a stack of 10–20 tools. When Next.js drops a breaking change, Express deprecates a routing API, or TypeScript removes an old flag — teams find out in production, not before deploying.

- `npm audit` catches security CVEs
- Dependabot opens PRs for version bumps
- **Nobody tells you what specifically will break and why**

Vigil does that — and when the source sites change their layout, it heals itself and keeps watching.

---

## Demo

```bash
$ vigil check react nextjs typescript prisma

  Vigil — engineering change intelligence
  ──────────────────────────────────────────────────────

  ✓ typescript 5.7.2 — no breaking changes
  ✓ prisma 5.22.0 — no breaking changes

  ✗ react 19.0.0 — 2 breaking changes
      • ReactDOM.render removed — use createRoot instead
      • Legacy Context API removed — migrate to createContext
    → https://github.com/facebook/react/releases/tag/v19.0.0

  ✗ nextjs 15.1.0 — 1 breaking change
      • useLayoutEffect no longer available in Server Components
    → https://github.com/vercel/next.js/releases/tag/v15.1.0

  2/4 packages have breaking changes — review before upgrading
```

---

## How It Works

### 1. Three Bright Data Scrapers

Vigil uses three custom scrapers built with [Bright Data Scraper Studio](https://brightdata.com/products/scraper-studio):

| Scraper | Target | Collector ID |
|---------|--------|-------------|
| `vigil-github-releases` | GitHub `/releases` pages | `c_mt38dv2i1d2xga6atq` |
| `vigil-npm-releases` | npm version history | `c_mt38jj1t11smj3ek9e` |
| `vigil-vendor-changelog` | Vendor changelog pages | `c_mt38q9ng1pxd02lyaf` |

### 2. Self-Healing Loop

When a site changes its layout and the scraper returns null fields, Vigil automatically heals:

```
Run scraper → Validate output (AJV + null detection)
    ↓ (if validation fails)
Generate targeted heal prompt from null fields
    ↓
bdata scraper heal --auto-approve
    ↓
Re-run + re-validate → Log result to SQLite
    ↓ (if still failing after 3 attempts)
Mark scraper degraded → Alert user
```

### 3. Breaking Change Classification

Vigil uses deterministic regex pattern matching to classify release notes — no LLM API key needed:

- `BREAKING CHANGE:` keyword (conventional commits)
- Conventional commit `!` notation (`feat!:`, `fix!:`)
- Section headers (`## Breaking Changes`, `## Migration Guide`)
- Warning emojis (`⚠️`, `💥`)
- Removal/deprecation keywords

---

## Installation

```bash
git clone https://github.com/Tusharkshahi/vigil.git
cd vigil
npm install
cp .env.example .env
# Fill in BRIGHTDATA_API_KEY and Collector IDs in .env
npm run build
```

### Prerequisites

- Node.js 18+
- A [Bright Data account](https://brightdata.com) (free tier: 5,000 credits/month)

```bash
# Authenticate with Bright Data
npx -p @brightdata/cli bdata login
```

---

## Usage

### CLI

```bash
# Check specific packages (last 30 days)
vigil check react nextjs typescript

# Check all packages from package.json
vigil check --file package.json

# Check last 7 days only
vigil check react nextjs --days 7

# Export JSON report
vigil check react nextjs --json --output report.json

# Audit scraper health and trigger healing
vigil doctor
vigil doctor --heal

# View recent detections
vigil history --days 14

# Subscribe for Slack/Discord alerts
vigil subscribe add react nextjs typescript
vigil subscribe set-slack https://hooks.slack.com/...
vigil subscribe set-discord https://discord.com/api/webhooks/...
```

### GitHub Action

Add to your repo to get PR comments when breaking changes are detected:

```yaml
# .github/workflows/vigil-check.yml
- name: Check for breaking changes
  uses: Tusharkshahi/vigil@main
  env:
    BRIGHTDATA_API_KEY: ${{ secrets.BRIGHTDATA_API_KEY }}
    GITHUB_RELEASES_COLLECTOR_ID: ${{ secrets.GITHUB_RELEASES_COLLECTOR_ID }}
    NPM_RELEASES_COLLECTOR_ID: ${{ secrets.NPM_RELEASES_COLLECTOR_ID }}
    VENDOR_CHANGELOG_COLLECTOR_ID: ${{ secrets.VENDOR_CHANGELOG_COLLECTOR_ID }}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BRIGHTDATA_API_KEY` | Yes | From `bdata login` or Bright Data dashboard |
| `GITHUB_RELEASES_COLLECTOR_ID` | Yes | `c_mt38dv2i1d2xga6atq` |
| `NPM_RELEASES_COLLECTOR_ID` | Yes | `c_mt38jj1t11smj3ek9e` |
| `VENDOR_CHANGELOG_COLLECTOR_ID` | Yes | `c_mt38q9ng1pxd02lyaf` |
| `SLACK_WEBHOOK_URL` | Optional | For Slack alerts |
| `DISCORD_WEBHOOK_URL` | Optional | For Discord alerts |

---

## Bright Data Usage

This project uses **Bright Data Scraper Studio** as its core scraping infrastructure:

- All three scrapers were built with `bdata scraper create` — AI-generated from a URL and description
- Scrapers run via `bdata scraper run` on Bright Data's cloud infrastructure
- Self-healing uses `bdata scraper heal --auto-approve` for autonomous recovery
- No pre-built Bright Data datasets are used — all three scrapers are custom-built
- All target data is publicly available (no auth-walled or government sites)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Scraping | Bright Data Scraper Studio |
| Orchestration | TypeScript + Node.js |
| Schema validation | AJV |
| Breaking change detection | Regex pattern matching |
| CLI | Commander.js |
| Terminal output | Chalk + ora |
| Storage | SQLite (better-sqlite3) |
| Alerting | Axios (Slack/Discord webhooks) |

---

## Hackathon Submission

- **Event**: WeMakeDevs Into the Scrape-Verse (Aug 17–23, 2026)
- **Built with**: Bright Data Scraper Studio CLI
- **AI assistance**: Devin (disclosed per hackathon rules)
- **License**: MIT
