# ADR-002: Client-Executed Approved Telegram Joins

## Status

Proposed

Superseded by ADR-012 for the bot-first MVP.

## Context

Telegram Kids needs delayed execution of group joins and channel subscriptions. A child may request access now, a parent may approve later, and the actual Telegram join should occur only after approval.

Two execution models are possible:

- the child app executes the Telegram join after backend approval;
- the backend stores the child Telegram session and executes joins server-side.

The project principles say the backend is the source of truth and the child client is never trusted. However, storing Telegram user sessions in the backend would materially increase privacy, security, and operational risk.

## Decision

Use client-executed approved joins for MVP.

The backend owns the approval decision, request state, expiry, and audit log. The child app owns the Telegram session and executes the approved join after verifying a valid backend approval.

## Alternatives Considered

### Backend-Executed Joins

Pros:

- Stronger backend control over actual join execution.
- Can execute while the child app is offline.

Cons:

- Requires backend custody of child Telegram sessions.
- Increases privacy and credential compromise risk.
- Requires long-running MTProto session management that is poorly aligned with Lambda-first architecture.
- Raises more complex abuse, rate-limit, and account recovery concerns.

### Immediate Client Joins With Later Audit

Pros:

- Simpler implementation.
- No delayed execution state.

Cons:

- Fails the product requirement because child joins happen before parent approval.
- Parent rejection cannot undo first exposure to content.

## Consequences

- Approved joins may remain pending until the child app is online.
- Parent UI must distinguish approved from joined.
- Backend must record execution results reported by the child app.
- The system needs idempotency and stale-target checks.
- This does not prevent bypass in official Telegram or other clients.

## Implementation Notes

- Approval tokens must be child-specific, request-specific, target-specific, and expiring.
- The child app must re-check target metadata before execution when possible.
- Execution attempts must be idempotent.
- Telegram errors must be mapped to durable backend states such as `FAILED`, `EXPIRED`, `STALE`, or `ADMIN_APPROVAL_PENDING`.
- A later ADR is required before adopting backend-held Telegram sessions.
