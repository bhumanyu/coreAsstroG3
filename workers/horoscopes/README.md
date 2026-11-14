# Horoscope API Worker

Standalone Cloudflare Worker for `GET /api/horoscopes`. It is intentionally outside the frontend's `src` tree and has its own package, TypeScript, Vitest, and Wrangler configuration.

## Local development

Run the Worker from this directory:

```sh
npm install
npm run dev
```

Use Node 22.20 or newer. `npm run dev` uses Wrangler's local simulator and local KV; it does not deploy or use the production KV namespace. With no local `STARSAPI_KEY`, the Worker uses deterministic fixture content. To use the vendor locally, add your key to the ignored `workers/horoscopes/.dev.vars` file:

```dotenv
STARSAPI_KEY=your_starsapi_key
```

Wrangler loads `.dev.vars` for local development. Do not commit the file or place this key in a `VITE_` variable. `wrangler secret put` configures a deployed Worker and is not needed for local development.

The frontend is configured by the ignored root `.env.local`:

```dotenv
VITE_HOROSCOPE_API_BASE_URL=http://localhost:8787
```

Start the frontend separately from the repository root with `npm run dev`. The Home forecast card then calls the local Worker on port 8787.

Try the endpoint directly:

```text
http://localhost:8787/api/horoscopes?sign=aries&period=daily&subtype=general&language=en&timezone=UTC
```

The endpoint accepts `sign` (aries through pisces), `period` (`daily`, `weekly`, `monthly`, `yearly`), `subtype` (`general`, `love`, `career`), `language` (`en`, `hi`), and an IANA `timezone`. Only `sign` and `period` are required; the remaining values default to `general`, `en`, and `UTC`.

Run the isolated tests and type-check with `npm test` and `npm run typecheck`.

## StarsAPI adapter

The adapter uses the documented `GET https://starsapi.com/api/v3/horoscope/{daily|weekly|monthly|yearly}` endpoints, authenticating only with `X-Api-Key`. It sends `zodiac_system=vedic_moon` and the requested sign/language. Daily and weekly use `date=YYYY-MM-DD` plus `sub_type`; monthly uses `month=YYYY-MM`; yearly uses `year=YYYY`. The vendor's monthly/yearly endpoints always return general forecasts, so requests for their love/career subtypes return `FORECAST_UNAVAILABLE` rather than silently changing subtype.

The normalized response uses the vendor's plain-text forecast, date range, summary, returned language, `content_sections` for love/career/health when provided, and lucky colour/number. If a Hindi request is served in English, `languageFallback` is set and the response language remains `en`.

See the official [StarsAPI horoscope reference](https://starsapi.com/docs/v3/horoscope/) for endpoint details. The vendor may return sample content on free plans (`is_sample: true`); confirm that the selected plan returns the licensed live content before production use.

## KV and optional deployment

Create a namespace and replace the placeholder IDs in `wrangler.toml` with the returned production namespace ID and preview ID:

```sh
npx wrangler kv namespace create HOROSCOPE_CACHE
npx wrangler kv namespace create HOROSCOPE_CACHE --preview
npm run deploy
```

Cloudflare authentication and remote KV namespaces are needed only for a deployment. Local `wrangler dev` uses local KV state under `.wrangler/state`. Remote KV stores successful normalized responses only. Current TTLs are daily: 6 hours, weekly: 24 hours, monthly: 7 days, yearly: 30 days. Adjust these only after confirming the vendor's license terms.

## Configuration and deployment

- `HOROSCOPE_CACHE`: KV binding configured by Wrangler.
- `ALLOWED_ORIGIN`: comma-separated allowed origins. `npm run dev` overrides it to `*` locally. The checked-in value allows the two Capacitor origins; add the deployed web frontend origin before production. Do not deploy a wildcard.
- `STARSAPI_KEY`: For local dev, put it in the ignored `.dev.vars` file described above. For a deployed Worker only, set it with `npx wrangler secret put STARSAPI_KEY`.

After deploying, set `VITE_HOROSCOPE_API_BASE_URL` in the frontend build environment to the Worker origin (for example `https://coreastro-horoscopes.<account>.workers.dev`, without `/api/horoscopes`). This public URL is required for Capacitor/Android builds; never put the vendor key in a `VITE_` variable.

The fixture payload identifies `provider: "starsapi"` to match the frontend response contract, but its content is locally generated deterministic test data. Setting `STARSAPI_KEY` selects live StarsAPI content.
