# ADR-013: Parent Android App Deferred to V2

## Status

Proposed

Supersedes ADR-003, ADR-006, and ADR-010 for the bot-first MVP.

## Context

The repository originally carried a parent Android app as part of the MVP plan. The current MVP scope has moved to a smaller end-to-end flow:

1. Child requests join.
2. Backend creates `ApprovalRequest`.
3. Parent receives a Telegram Bot message.
4. Parent approves in Telegram.
5. Backend executes the join.

That flow is simpler to validate without a separate parent mobile app. It also reduces platform surface, release overhead, and onboarding work during the MVP phase.

The parent app is still useful as a later product surface, but it is not required to validate the MVP promise.

## Decision

Defer the Parent Android App to V2.

For the MVP, use the Telegram Bot as the parent approval interface and keep the parent mobile app out of the active delivery scope.

## Why It Was Removed From MVP

- The MVP needs the smallest possible approval loop.
- Telegram Bot approval is enough to validate parent demand.
- A parent Android app adds a second client, a second release surface, and more UI state to validate before the core workflow is proven.
- The current bot-first onboarding flow does not need a parent mobile shell to create a family, verify the parent, or approve join requests.
- Device-level bypass guidance and family setup can be handled in onboarding and backend-driven bot flows for MVP.

## Why Telegram Bot Is Preferred For MVP

- It is the smallest parent-facing surface.
- It avoids building and shipping a separate Android app for the parent during MVP.
- It allows the approval loop to be exercised immediately in the same channel where notifications arrive.
- It reduces CI, release, and onboarding complexity.
- It keeps the MVP focused on the core product promise rather than on rich parent-management UX.

## Expected V2 Functionality

The parent Android app is expected to return in V2 with richer family-management capabilities:

- Pending approval queue.
- Approve and reject actions.
- Approval history.
- Family and child management.
- Device and session overview.
- Bypass guidance and onboarding education.
- Push notification registration and management.
- Better visibility into request state, execution state, and recoveries.
- Potential support for multiple parents per family.
- Optional secondary interface alongside Telegram Bot.

## Alternatives Considered

### Keep Parent App In MVP

Pros:

- Richer parent UX.
- Better fit for family and device management.

Cons:

- Larger MVP.
- Slower validation of the core approval flow.
- More code, testing, and release work before proving demand.

### Bot-Only MVP

Pros:

- Smallest viable approval loop.
- Fastest path to validating parental approval demand.

Cons:

- Limited parent-management UI.
- Recovery and family-management workflows are less ergonomic.

## Consequences

- The parent app is not a blocker for MVP validation.
- Parent onboarding and approval are bot-first.
- V2 can introduce the parent app without changing the MVP approval source of truth.
- Existing parent-app scaffold files are deferred, not active MVP scope.

## Implementation Notes

- Keep parent-app references marked as deferred in architecture and product docs.
- Do not build new MVP features into the parent app scaffold.
- Revisit the parent app only after the bot-first MVP validates demand and the join workflow.
