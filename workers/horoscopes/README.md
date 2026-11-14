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

## StarsAPI adapter

The adapter uses the documented `GET https://starsapi.com/api/v3/horoscope/{daily|weekly|monthly|yearly}` endpoints, authenticating only with `X-Api-Key`. It sends `zodiac_system=vedic_moon` and the requested sign/language. Daily and weekly use `date=YYYY-MM-DD` plus `sub_type`; monthly uses `month=YYYY-MM`; yearly uses `year=YYYY`. The vendor's monthly/yearly endpoints always return general forecasts, so requests for their love/career subtypes return `FORECAST_UNAVAILABLE` rather than silently changing subtype.

The normalized response uses the vendor's plain-text forecast, date range, summary, returned language, `content_sections` for love/career/health when provided, and lucky colour/number. If a Hindi request is served in English, `languageFallback` is set and the response language remains `en`.

See the official [StarsAPI horoscope reference](https://starsapi.com/docs/v3/horoscope/) for endpoint details. The vendor may return sample content on free plans (`is_sample: true`); confirm that the selected plan returns the licensed live content before production use.

## KV and deployment

Create a namespace and replace the placeholder IDs in `wrangler.toml` with the returned production namespace ID and preview ID:

```sh
npx wrangler kv namespace create HOROSCOPE_CACHE
npx wrangler kv namespace create HOROSCOPE_CACHE --preview
npm run deploy
```

Wrangler may require Cloudflare account authentication before namespace creation or deployment. KV stores successful normalized responses only. Current TTLs are daily: 6 hours, weekly: 24 hours, monthly: 7 days, yearly: 30 days. Adjust these only after confirming the vendor's license terms.

## Configuration and deployment

- `HOROSCOPE_CACHE`: KV binding configured by Wrangler.
- `ALLOWED_ORIGIN`: comma-separated allowed origins. `npm run dev` overrides it to `*` locally. Before production, replace `REPLACE_WITH_FRONTEND_ORIGIN` in `wrangler.toml` with the deployed frontend origin; the config already includes `capacitor://localhost` and `https://localhost`. Do not deploy the placeholder or a wildcard.
- `STARSAPI_KEY`: Worker secret, never a frontend variable. Set it with `npx wrangler secret put STARSAPI_KEY`.

After deploying, set `VITE_HOROSCOPE_API_BASE_URL` in the frontend build environment to the Worker origin (for example `https://coreastro-horoscopes.<account>.workers.dev`, without `/api/horoscopes`). This public URL is required for Capacitor/Android builds; never put the vendor key in a `VITE_` variable.

The fixture payload identifies `provider: "starsapi"` to match the frontend response contract, but its content is locally generated deterministic test data. Setting `STARSAPI_KEY` selects live StarsAPI content.
