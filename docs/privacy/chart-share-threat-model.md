# Chart share-link threat model

## Data and purpose

Version 1 share payloads contain only the minimum chart inputs needed to
recalculate: UTC/offset-bearing `dateTimeStr`, IANA `timeZone`, latitude,
longitude, and a validated `AyanamsaType`. Name and place of birth are
excluded. The payload is Base64URL encoded in a URL fragment and is not
encrypted, authenticated, or tamper-proof.

## Threats and mitigations

| Threat | Mitigation / residual risk |
|---|---|
| Accidental disclosure via browser history, screenshots, copied links, or messaging | Show a privacy warning before the explicit create action; clearly state the fields in the link and the name exclusion. Users decide where to share it. |
| Silent sharing as inputs change | Never rewrite the URL on form changes. Link creation and clearing require explicit actions. Creation does not navigate or run analysis. |
| Malformed, oversized, or unsupported token | Enforce a 2,048-character limit, strict Base64URL/JSON/version checks, and canonical birth validation; display a safe error without changing the current chart. |
| Invalid input loaded from a crafted link | Decode and run `validateBirthDetails` before offering load; route accepted values through the normal AppShell state seam. |
| Tampering or interception | The token is not protected against tampering and has no confidentiality. A receiver should treat it as untrusted input. Transport security is provided only by the hosting site's HTTPS configuration. |
| Referrer/server leakage of fragment | URL fragments are normally not sent in HTTP requests, but browser history, extensions, screenshots, and copied links can expose them. Do not assume fragment data is secret. |
| Analytics/logging exposure | Do not log payloads, decoded birth inputs, or complete share URLs. No analytics event includes these values. |

## User control

The receiving user is offered the inputs and must choose “Load shared chart
inputs”; the app does not auto-load or auto-run analysis. Clearing is explicit.
The app leaves the current chart unchanged on parse, version, and validation
failure.
