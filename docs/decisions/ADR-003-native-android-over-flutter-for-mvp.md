# ADR-003: Native Android Over Flutter for MVP

## Status

Superseded by ADR-013 for the bot-first MVP.

## Context

Telegram Kids needs Android applications for the MVP, including a child Telegram client and a parent approval application. The child client is expected to integrate deeply with Telegram client capabilities, local encrypted session storage, push notifications, deep links, background execution, and potentially platform-level parental-control guidance.

The product roadmap may later add iOS and web interfaces, but the current MVP documentation defers the parent application to V2 and prioritizes validating the bot-first approval workflow.

## Decision

Use native Android for the child app where platform integration requires it. Defer the parent app to V2 for the bot-first MVP.

The child application should be native Android because TDLib integration, local storage, background behavior, notification handling, and deep-link interception are central to the product. The parent application is not required in the bot-first MVP and is deferred to V2.

## Alternatives Considered

### Flutter

Pros:

- Faster cross-platform UI development if iOS becomes an immediate requirement.
- Shared codebase for parent app across Android and iOS.
- Good productivity for form-heavy approval screens.

Cons:

- Adds platform-channel complexity for TDLib, notifications, background work, deep links, and secure local storage.
- Harder to reason about platform edge cases in the child Telegram client.
- Cross-platform benefit is limited while MVP scope is Android-first.
- Native Android issues still need native Android expertise to debug.

### Native Android

Pros:

- Best fit for TDLib and Android platform integration.
- Direct access to Android lifecycle, WorkManager, notification, intent, and secure storage APIs.
- Lower integration risk for child safety controls.
- Matches MVP Android-first direction.

Cons:

- iOS parent app will require a separate implementation later if V2 expands that path.
- Less UI code reuse across future platforms.
- Requires Android-specific engineering capacity.

### Hybrid Approach: Native Child App, Flutter Parent App

Pros:

- Keeps the complex child app native.
- Allows future iOS reuse for parent approval UI in V2.

Cons:

- Introduces two mobile stacks in MVP.
- Increases build, CI, release, design-system, and QA complexity.
- Parent app still needs native push-notification and auth integration.

## Consequences

- MVP velocity depends on Android engineering rather than cross-platform reuse.
- Future iOS work will require a new native iOS or Flutter implementation decision.
- TDLib integration risk is reduced for the child app.
- Child Android app can share platform conventions, CI patterns, and release tooling with future mobile surfaces.

## Implementation Notes

- Use Kotlin as the default Android language unless a separate ADR chooses otherwise.
- Keep business rules in the backend, not in Android clients.
- Treat the child app as untrusted even though it performs Telegram client operations.
- Revisit Flutter only when iOS becomes a committed roadmap item with near-term delivery pressure.
