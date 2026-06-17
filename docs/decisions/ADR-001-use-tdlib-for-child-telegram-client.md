# ADR-001: Use TDLib for Child Telegram Client Integration

## Status

Proposed

## Context

Telegram Kids needs a full Telegram user-client experience for the child app: authentication, chat list, direct messaging, channel reading, receiving messages, sending messages, and gated joins for groups and channels.

Telegram's Bot API is for bot accounts and cannot act as the child user. Raw MTProto can support full user-client behavior, but it requires substantially more protocol, storage, update, and security work. TDLib is Telegram's official cross-platform client library and handles MTProto networking, encryption, local storage, and update ordering.

## Decision

Use TDLib inside the Android child app as the MVP Telegram client engine.

The backend remains the source of truth for family, child, approval request, approval decision, and audit state. TDLib session material remains on the child device and is not stored in backend services.

## Alternatives Considered

### Raw MTProto Library

Pros:

- Direct protocol control.
- Potentially narrower dependency surface.

Cons:

- Higher implementation and security risk.
- More Telegram client behavior must be implemented by the team.
- Third-party protocol support may lag Telegram API layers.
- Higher maintenance cost for MVP.

### Server-Side Userbot

Pros:

- Backend can directly execute approved joins.
- Joins can happen while the child app is offline.

Cons:

- Backend custody of child Telegram sessions creates high privacy and security risk.
- Poor fit for Lambda-first serverless operations.
- Higher account abuse and operational risk.
- Larger blast radius if backend secrets are compromised.

### Bot API Only

Pros:

- Simple HTTPS integration.
- Useful for parent bot approvals and notifications.

Cons:

- Cannot act as the child user.
- Cannot join groups or channels on behalf of the child.
- Cannot provide a full Telegram client experience.

## Consequences

- The Android app must package and operate TDLib.
- The child device holds the Telegram session.
- Backend approval controls are authoritative for Telegram Kids, but not global to all Telegram clients.
- Approved joins execute when the child app is available and online.
- Additional mitigations are required for bypass through official Telegram and other clients.

## Implementation Notes

- Create a narrow Telegram gateway abstraction around TDLib.
- Gate every join-capable UI path before any TDLib join call is made.
- Encrypt TDLib local data with a local app-managed key.
- Never send Telegram auth keys, login codes, 2FA passwords, or local database keys to the backend.
- Use Telegram test DCs before production authorization testing.
