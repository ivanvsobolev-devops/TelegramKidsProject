# ADR-011: Telegram Bot as MVP Parent Approval Interface

## Status

Proposed

Supersedes ADR-006 for the bot-first MVP.

## Context

The new MVP scope removes the Parent Android App and keeps only the smallest end-to-end approval flow:

1. Child requests join.
2. Backend creates an `ApprovalRequest`.
3. Parent receives a Telegram Bot message.
4. Parent approves.
5. Backend executes join.

This conflicts with the earlier parent-app-first decision.

## Decision

Use the Telegram Bot as the MVP parent approval interface.

Do not include a Parent Android App in the MVP.

The backend remains the source of truth for approval state. The bot is only an interaction surface for notification and approval callbacks.

## Alternatives Considered

### Parent Android App

Pros:

- Better fit for onboarding, family management, approval history, and device-control guidance.
- Stronger control over parent authentication UX.

Cons:

- Larger MVP scope.
- Requires parent app development and release.
- Slower path to validating the core approval loop.

### Telegram Bot

Pros:

- Smallest parent-facing surface.
- Fast approval interaction for parents already using Telegram.
- Avoids building and shipping a second mobile app for MVP.

Cons:

- Requires secure bot account linking.
- Limited UI for history, settings, and family management.
- Depends on parent Telegram availability.
- Device-control guidance is weaker than in an app.

## Consequences

- MVP scope is smaller and more focused.
- Parent account linking through Telegram Bot becomes a critical requirement.
- Approval history and family management are deferred or handled through minimal backend/admin tooling.
- Bot callback idempotency and authorization must be implemented carefully.
- Existing parent-app architecture documents no longer describe the bot-first MVP.

## Implementation Notes

- Bot approval messages should contain compact target context and inline approval actions.
- Callback payloads must not contain raw secrets or raw invite hashes.
- Backend must authorize every bot callback against the linked parent and family.
- Audit records must store `decisionSource=TELEGRAM_BOT`.
- Parent Android App can be revisited after the MVP validates the approval workflow.
