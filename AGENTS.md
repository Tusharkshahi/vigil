# Vigil — Agent & Developer Reference

Self-healing engineering change intelligence for the WeMakeDevs Into the Scrape-Verse hackathon.

---

## Bright Data Scraper Studio — Collector IDs

| Scraper | Collector ID | Target |
|---------|-------------|--------|
| `vigil-github-releases` | `c_mt38dv2i1d2xga6atq` | `github.com/{org}/{repo}/releases` |
| `vigil-npm-releases` | `c_mt38jj1t11smj3ek9e` | `npmjs.com/package/{pkg}?activeTab=versions` |
| `vigil-vendor-changelog` | `c_mt38q9ng1pxd02lyaf` | `vercel.com/changelog` |

View in dashboard: https://brightdata.com/cp/scrapers

---

## Quick Commands

### Authentication
```bash
# Login to Bright Data (only needed once per machine)
npx -p @brightdata/cli bdata login
```

### Running scrapers manually
```bash
# GitHub releases — swap in any repo URL
npx -p @brightdata/cli bdata scraper run c_mt38dv2i1d2xga6atq "https://github.com/vercel/next.js/releases"
npx -p @brightdata/cli bdata scraper run c_mt38dv2i1d2xga6atq "https://github.com/facebook/react/releases"

# npm version history
npx -p @brightdata/cli bdata scraper run c_mt38jj1t11smj3ek9e "https://www.npmjs.com/package/react?activeTab=versions"

# Vendor changelog
npx -p @brightdata/cli bdata scraper run c_mt38q9ng1pxd02lyaf "https://vercel.com/changelog"
```

### Self-healing
```bash
# Heal a scraper when its output validation fails
npx -p @brightdata/cli bdata scraper heal c_mt38dv2i1d2xga6atq \
  "The release body field returns empty — re-capture the markdown from the updated page structure" \
  --auto-approve
```

### Vigil CLI
```bash
# Install dependencies
npm install

# Build
npm run build

# Check packages for breaking changes (last 30 days)
npx ts-node src/index.ts check react nextjs typescript

# Check from package.json
npx ts-node src/index.ts check --file package.json

# Audit all scrapers
npx ts-node src/index.ts doctor

# View recent alerts
npx ts-node src/index.ts history --days 14
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `BRIGHTDATA_API_KEY` | Yes | From `bdata login` or brightdata.com → Settings → API Token |
| `GH_RELEASES_COLLECTOR_ID` | Yes | `c_mt38dv2i1d2xga6atq` |
| `NPM_RELEASES_COLLECTOR_ID` | Yes | `c_mt38jj1t11smj3ek9e` |
| `VENDOR_CHANGELOG_COLLECTOR_ID` | Yes | `c_mt38q9ng1pxd02lyaf` |
| `SLACK_WEBHOOK_URL` | Optional | Slack Incoming Webhook for alerts |
| `DISCORD_WEBHOOK_URL` | Optional | Discord Incoming Webhook for alerts |

---

## Self-Healing Architecture

```
Daily cron trigger
      ↓
bdata scraper run $COLLECTOR_ID $URL
      ↓
AJV schema validate + null field detection
      ↓ (if fails)
Build targeted heal prompt from null fields
      ↓
bdata scraper heal $COLLECTOR_ID "$PROMPT" --auto-approve
      ↓
Re-run + re-validate (max 3 attempts)
      ↓
Log result to SQLite (data/vigil.db)
```

---

## Data Target Justification

All three scrapers target **public, freely accessible pages** not available in Bright Data's pre-built dataset library:

- **GitHub `/releases` pages** — Bright Data has a GitHub API dataset but not the rendered releases markdown page with full body text
- **npmjs.com version tab** — No pre-built npm version history dataset
- **vercel.com/changelog** — Vendor-specific blog/changelog, no pre-built dataset

No login-walled, paywalled, or government sites are scraped.
