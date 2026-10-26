# Cloud data lifecycle

**Current state:** there is no cloud data lifecycle in this repository. The app
is a browser-only SPA. PR-042 local profiles are browser/device storage and
must not be described as cloud history, backup, or sync.

## Proposed lifecycle questions (owner approval required)

1. **Collection:** Which exact user-provided and derived fields are required?
   Default to none until a feature and purpose are approved.
2. **Creation:** At what explicit user action is a cloud record created? Is
   analysis persisted, or only source inputs?
3. **Access:** How are ownership, delegated access, account recovery, and
   administrative access controlled and audited?
4. **Retention:** What is the active-record retention period? Which operational
   logs contain identifiers, and how long are they retained?
5. **Export:** Can users export all stored inputs and derived data in a portable
   format, and how is completeness communicated?
6. **Deletion:** Which active records, derived artifacts, caches, search
   indexes, queues, and replicas are deleted, and within what service-level
   window?
7. **Backups:** How long can deleted records remain in backups, how are restores
   prevented from resurrecting deleted data, and when does backup expiration
   complete?
8. **Suspension:** What access remains for an account under review, including
   data export and deletion requests?
9. **Account deletion:** What identity records and application data are removed,
   what must be retained by law, and how is completion reported?

These are unresolved decisions, not implementation requirements or promises.
No database, auth provider, server storage, migration, or CRUD API is part of
this phase. PR-045 (auth foundation) and PR-046 (saved-chart CRUD API) remain
blocked pending owner approval of the decision record and a selected provider.
