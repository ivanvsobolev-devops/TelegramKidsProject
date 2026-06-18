# ADR-012: Backend-Executed Telegram Joins for Bot MVP

## Status

Proposed

Supersedes ADR-002 and ADR-007 for the bot-first MVP.

## Context

The requested MVP flow requires the backend to execute the Telegram join after the parent approves in Telegram Bot.

This differs from the earlier architecture where the child app kept Telegram session material on device and executed approved joins after backend approval. Backend execution allows the approval flow to complete without waiting for the child app to come back online, but it requires backend custody of child Telegram user session material.

## Decision

Use backend-executed Telegram joins for the bot-first MVP.

The backend stores and uses the child Telegram user session only for approved join execution. Session access must be isolated to a dedicated join executor boundary.

## Alternatives Considered

### Child-Executed Joins

Pros:

- Avoids backend custody of child Telegram sessions.
- Lower backend privacy and credential risk.
- Aligns with TDLib local storage.

Cons:

- Does not satisfy the requested MVP flow where backend executes the join.
- Requires the child app to be online after approval.
- Makes the bot approval feel incomplete until the child app syncs and executes.

### Backend-Executed Joins

Pros:

- Completes the join immediately after parent approval.
- Keeps the parent approval loop contained in backend plus bot.
- Simplifies visible MVP flow for parents.

Cons:

- Requires backend custody of sensitive Telegram session material.
- Increases privacy, credential, abuse, and operational risk.
- May require stateful Telegram session handling that is less natural for Lambda-only infrastructure.
- Requires stronger secret storage, logging discipline, and session lifecycle controls.

## Consequences

- Backend security requirements increase materially.
- Telegram session storage needs explicit encryption, access control, rotation, revocation, and audit.
- Join execution should be isolated from general API handlers.
- Backend infrastructure may need a worker model if Telegram session lifecycle is not reliable in short-lived Lambda handlers.
- A future architecture may move execution back to the child device if session custody risk outweighs MVP simplicity.

## Implementation Notes

- Store session material in a dedicated encrypted session store, not the general operational table.
- Restrict read access to the join executor only.
- Never log raw session strings, auth keys, login codes, 2FA passwords, or raw invite hashes.
- Re-check target metadata immediately before execution.
- Require approval request status `APPROVED` and non-expired before execution.
- Make execution idempotent by approval request ID and target fingerprint.
- Map Telegram errors to durable states such as `FAILED`, `EXPIRED`, `STALE`, or `ADMIN_APPROVAL_PENDING`.
- Add a separate implementation security review before building session-linking or session-storage code.
