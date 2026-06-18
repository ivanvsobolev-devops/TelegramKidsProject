# ADR-007: Keep Child Telegram Session Material On Device

## Status

Proposed

Superseded by ADR-012 for the bot-first MVP.

## Context

Telegram Kids needs a real Telegram user session for the child app to provide Telegram client behavior and execute approved joins. That session includes sensitive Telegram authentication material managed by TDLib.

The backend is the source of truth for approval decisions, but storing child Telegram session material in backend infrastructure would significantly increase privacy, security, operational, and account-abuse risk.

## Decision

Keep child Telegram session material on the child device for MVP.

The backend stores only Telegram account binding metadata such as child ID, Telegram user ID, session status, and non-sensitive display metadata needed for product workflows. It must not store Telegram auth keys, login codes, 2FA passwords, TDLib database keys, or raw TDLib session material.

## Alternatives Considered

### On-Device Session Custody

Pros:

- Minimizes backend exposure to Telegram account credentials.
- Aligns with TDLib's local encrypted storage model.
- Reduces blast radius of backend compromise.
- Keeps MVP backend serverless and event-driven.

Cons:

- Approved joins can execute only when the child app is available and online.
- Backend cannot directly enforce Telegram-side execution.
- Requires careful client synchronization and execution reporting.

### Backend Session Custody

Pros:

- Backend can execute approved joins directly.
- Backend can process Telegram updates independently of child device availability.
- Stronger operational control over Telegram-side workflow execution.

Cons:

- High privacy and credential compromise risk.
- Requires persistent MTProto session management in backend infrastructure.
- Poor fit for Lambda-first architecture.
- Increases abuse, rate-limit, and account recovery complexity.

### Parent-Held Session Custody

Pros:

- Avoids child device being sole session holder.
- Parent could theoretically mediate some actions.

Cons:

- Confusing user model.
- Parent app would need child Telegram credentials or session material.
- Does not map cleanly to Telegram's client authorization model.
- Expands sensitive data exposure to another device.

## Consequences

- Backend approval is authoritative for Telegram Kids, but Telegram execution remains client-side.
- Execution state may lag approval state.
- Parent UI must distinguish approved from joined.
- Child app must securely store and protect TDLib local data.
- A new ADR is required before moving Telegram session material into backend services.

## Implementation Notes

- Use TDLib local encrypted storage.
- Generate and store TDLib database encryption keys using Android secure storage where possible.
- Redact Telegram auth and login fields from logs and crash reports.
- Store only metadata needed for parent decisioning and audit in DynamoDB.
- Treat child app execution reports as inputs that must be validated and recorded, not as approval authority.
