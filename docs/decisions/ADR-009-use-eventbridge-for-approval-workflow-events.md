# ADR-009: Use EventBridge for Approval Workflow Events

## Status

Proposed

## Context

The MVP approval workflow has multiple side effects: parent notification, child notification, audit logging, analytics, and optional Telegram Bot notifications. These side effects should not be tightly coupled to synchronous API request handling.

The backend architecture already identifies EventBridge as the event backbone.

## Decision

Use EventBridge for approval workflow domain events.

API handlers persist source-of-truth state in DynamoDB and publish domain events such as `JoinRequestCreated`, `JoinRequestApproved`, and `JoinExecutionSucceeded`. Event consumers handle notifications, audit projections, and future analytics.

## Alternatives Considered

### EventBridge

Pros:

- Native AWS event bus with Lambda integration.
- Decouples approval state changes from notification side effects.
- Supports multiple consumers per event.
- Fits serverless MVP architecture.
- Enables later Telegram Bot and analytics consumers without changing core APIs.

Cons:

- Adds eventual consistency for side effects.
- Requires idempotent consumers.
- Event schema discipline is required.
- Debugging distributed workflows is harder than synchronous calls.

### Direct Synchronous Calls

Pros:

- Simpler local control flow.
- Easier to trace in early prototypes.
- Immediate failure visibility.

Cons:

- Couples API latency to notification and audit side effects.
- Harder to add new consumers.
- Retry behavior can duplicate side effects if not carefully designed.

### SNS Only

Pros:

- Simple fanout mechanism.
- Good fit for notification-oriented events.

Cons:

- Less expressive event routing than EventBridge.
- Weaker fit for domain-event taxonomy and future consumers.
- Event discovery and rule management are less aligned with domain workflows.

## Consequences

- Domain events must have stable names and schemas.
- Event consumers must be idempotent.
- API success means source-of-truth state was written, not necessarily that notifications were delivered.
- Notification failures must be observable and retryable.

## Implementation Notes

- Use event version fields from the first implementation.
- Include correlation IDs, aggregate IDs, family IDs, child IDs, and request IDs where safe.
- Avoid sensitive Telegram payloads in event bodies.
- Persist audit-critical facts before publishing events.
- Configure dead-letter handling or failure alarms for event consumers.
