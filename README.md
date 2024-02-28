# Versammlungen in Dresden

This is a bot to automatically post new public assemblies listed on [dresden.de](https://www.dresden.de/de/rathaus/dienstleistungen/versammlungsuebersicht.php) to [Mastodon](https://dresden.network/@VersammlungenInDresden).

The bot is run via cron-scheduled GitHub Actions every hour for normal updates (during the daytime) and once a day to boost posts for assemblies happening on the same day.

Got any feedback or suggestions? Feel free to open an issue, send a pull request or contact [me on Mastodon](https://chaos.social/@kilian).

## Setup

To install dependencies:

```bash
bun install
```

To run:

```bash
# Fetches new assemblies and posts them to Mastodon
bun run src/update.ts
# Boosts posts for assemblies happening today
bun run src/remind.ts
```

Be sure to set `MASTO_SERVER_URL`, `ACCESS_TOKEN` and `ACCOUNT_ID` in your env.
