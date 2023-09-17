# Versammlungen in Dresden

This is a bot to automatically post new public assemblies listed on [dresden.de](https://www.dresden.de/de/rathaus/dienstleistungen/versammlungsuebersicht.php) to [Mastodon](https://dresden.network/@VersammlungenInDresden).

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

Be sure to set `MASTO_SERVER_URL` and `ACCESS_TOKEN` in your env.

This project was created using `bun init` in bun v1.0.1. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
