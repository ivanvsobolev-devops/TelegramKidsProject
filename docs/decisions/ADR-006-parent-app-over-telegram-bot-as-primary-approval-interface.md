# ADR-006: Parent App Over Telegram Bot as Primary Approval Interface

## Status

Proposed

Superseded by ADR-011 for the bot-first MVP.

## Context

The MVP requires parents to authenticate, view pending approvals, approve or reject requests, and review approval history. The roadmap also lists a Telegram bot as a future or auxiliary interface.

A Telegram bot can reduce friction for parents who already use Telegram, but it cannot replace all parent application needs. Parent onboarding, family management, child management, notification settings, approval history, device guidance, and account security are better suited to a dedicated parent app.

## Decision

Use the parent Android app as the primary MVP approval interface.

Use a Telegram bot as an optional secondary notification and approval channel after the core parent app workflow is stable. The backend remains the source of truth for all approval decisions regardless of which interface submits the decision.

## Alternatives Considered

### Parent Android App

Pros:

- Supports full parent authentication and account management.
- Better fit for family, child, device, and approval-history workflows.
- Can present device-level setup guidance for blocking official Telegram and other clients.
- Easier to control UX, security prompts, and future roadmap features.

Cons:

- Parents must install another app.
- Higher mobile development and release overhead.
- Push notification setup is required.

### Telegram Bot

Pros:

- Low friction for parents already using Telegram.
- Fast approval interactions from chat notifications.
- Useful as a secondary interface for approve/reject actions.

Cons:

- Limited UI for complex workflows.
- Depends on parent having and using Telegram.
- Bot chat security and account identity need careful linking.
- Poor fit for onboarding, family management, and device-control guidance.

### Bot-Only MVP

Pros:

- Smaller initial parent-facing surface.
- Faster to prototype approval messages.

Cons:

- Conflicts with MVP documentation that specifies a parent Android application.
- Weakens family/account management foundation.
- Makes device-control setup and bypass education harder.
- Creates risk that bot chat identity is mistaken for full parent account security.

### Parent App Plus Bot From Day One

Pros:

- Gives parents both rich management and fast approval actions.
- Useful for notification redundancy.

Cons:

- Doubles parent-interface QA for MVP.
- Requires robust account linking, duplicate decision handling, and bot command security early.
- Increases scope before validating the core approval workflow.

## Consequences

- MVP parent workflows will be designed app-first.
- Telegram Bot integration can be added without becoming the source of truth.
- The backend approval API must support multiple approval interfaces over time.
- Bot-specific identity linking and command security can be specified separately.

## Implementation Notes

- Parent app must support pending approvals, approve, reject, and approval history for MVP.
- Backend decisions must be idempotent so future bot actions cannot double-apply approvals.
- Store the decision source, such as `PARENT_APP` or `TELEGRAM_BOT`, in audit records.
- Add a separate specification before implementing Telegram Bot approval actions.
- Use the parent app onboarding to explain that device-level controls are required to block official Telegram bypass paths.
