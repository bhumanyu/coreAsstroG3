# Cloud-history threat-model checklist

**Status:** threat-model inputs for a future decision only; no cloud history is
implemented or approved.

Before approving PR-045 or PR-046, owners must resolve each item below and
record mitigations and residual risks:

- [ ] Enumerate collected fields, including birth time, coordinates, place/name,
  derived chart data, report evidence, and metadata.
- [ ] Identify data sensitivity, purpose, minimization, and whether each field
  is necessary at rest.
- [ ] Select identity and authentication provider; document account recovery,
  MFA, session expiry, revocation, and credential abuse handling.
- [ ] Define object-level authorization and tenant isolation for every read,
  write, export, and delete route; test cross-user access denial.
- [ ] Define encryption in transit and at rest, key ownership/rotation, and
  staff/service access boundaries.
- [ ] Assess abuse cases: account takeover, enumeration, IDOR, bulk extraction,
  injection, malicious imports, resource exhaustion, and insider access.
- [ ] Specify safe audit events and prohibit birth input, share token, full URL,
  and report payload logging.
- [ ] Define rate limits, anomaly detection, alert ownership, incident response,
  and breach notification obligations.
- [ ] Define user export format and completeness, deletion coverage, grace
  periods, backups, legal holds, and residual backup-retention window.
- [ ] Define suspension behavior and ensure suspended accounts have clear
  read/export/delete paths appropriate to policy.
- [ ] Review provider contracts, data residency, subprocessors, retention, and
  deletion guarantees.
- [ ] Complete privacy, security, and operational review before launch.

PR-045 and PR-046 are blocked until owner approval of the accounts/cloud-history
decision record and selection of a server/auth provider.
