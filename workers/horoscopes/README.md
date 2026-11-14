# Horoscope API Worker

Standalone Cloudflare Worker for `GET /api/horoscopes`. It is intentionally outside the frontend's `src` tree and has its own package, TypeScript, Vitest, and Wrangler configuration.

## Local development

```sh
npm install
npm run dev
```

Without `STARSAPI_KEY`, the Worker uses deterministic fixture content. Try:

```text
http://localhost:8787/api/horoscopes?sign=aries&period=daily&subtype=general&language=en&timezone=UTC
```

The endpoint accepts `sign` (aries through pisces), `period` (`daily`, `weekly`, `monthly`, `yearly`), `subtype` (`general`, `love`, `career`), `language` (`en`, `hi`), and an IANA `timezone`. Only `sign` and `period` are required; the remaining values default to `general`, `en`, and `UTC`.

Run the isolated tests and type-check with `npm test` and `npm run typecheck`.

## KV and deployment

Create a namespace, then replace the placeholder IDs in `wrangler.toml` with the returned namespace ID and preview ID:

```sh
npx wrangler kv namespace create HOROSCOPE_CACHE
npx wrangler kv namespace create HOROSCOPE_CACHE --preview
npm run deploy
```

Wrangler may require Cloudflare account authentication before namespace creation or deployment. KV stores successful normalized responses only. Current TTLs are daily: 6 hours, weekly: 24 hours, monthly: 7 days, yearly: 30 days. Adjust these only after confirming the vendor's license terms.

## Configuration and licensing gate

- `HOROSCOPE_CACHE`: KV binding configured by Wrangler.
- `ALLOWED_ORIGIN`: comma-separated allowed origins. It defaults to `*` for development. Before production, restrict this to the deployed web app origin and the Android origins `capacitor://localhost` and `https://localhost`.
- `STARSAPI_KEY`: Worker secret, never a frontend variable. Set it with `npx wrangler secret put STARSAPI_KEY` only after written confirmation grants end-user display, white-label use, caching for the configured durations, and required attribution.

**The StarsAPI adapter is intentionally not implemented.** Setting `STARSAPI_KEY` selects that adapter, which currently returns `FORECAST_UNAVAILABLE`; do not set it for deployment until both the license checklist and the provider implementation are complete. No real vendor calls or Hindi translations are included. Hindi fixture requests return English and set `languageFallback: true`.

The fixture payload identifies `provider: "starsapi"` to match the frontend response contract, but its content is locally generated deterministic test data.
