# Phase 7 accounts and cloud-history decision

**Status: owner decision required.** This record makes no implicit product
decision to add accounts or server-side storage. Phase 7 PR-042/043/041 are
browser-client features and do not create a backend.

## Decision table

| Decision | Options / current proposal | Status |
|---|---|---|
| Are accounts required for launch? | No accounts for the browser-only launch; revisit only if cloud history is approved. | Proposed; owner approval pending |
| Is local-only storage sufficient? | Yes for the current profile feature; no cross-device promise is made. | Proposed; owner approval pending |
| Is cross-device sync required? | No for launch. | Proposed; owner approval pending |
| Which fields may be server-stored? | None approved. If considered, list each input and derived field and its purpose before implementation. | Unresolved |
| Who can access server-stored data? | No server exists. Future access would require an explicitly selected identity, authorization, and administrative-access model. | Unresolved |
| Is user export required? | Client-side JSON export exists; cloud account export requirements remain undecided. | Partially addressed |
| What is the deletion lifecycle? | Local profile deletion is local-only. Cloud deletion must define active data, derived copies, logs, queues, and backup expiry before implementation. | Unresolved |
| What is backup retention? | No application cloud backups. Browser/device storage remains under browser controls. | Unresolved |
| What happens on account suspension? | No account behavior exists. Must define read/export/deletion access before launch of any account feature. | Unresolved |
| What happens on account deletion? | No account behavior exists. Must define deletion scope and backup expiration with owner and provider. | Unresolved |
| Which server/auth provider is selected? | None. | Unresolved |

## Gate

**PR-045 (auth foundation) and PR-046 (saved-chart CRUD API, ownership,
migrations) remain blocked** until the owner approves these decisions and a
server/auth provider is selected. This repository is a browser-only Vite/React
SPA with no backend; this phase must not scaffold a server, database, auth
system, or cloud persistence.
