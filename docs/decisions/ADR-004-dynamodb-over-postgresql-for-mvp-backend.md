# ADR-004: DynamoDB Over PostgreSQL for MVP Backend

## Status

Proposed

## Context

The backend architecture prefers AWS serverless services and lists DynamoDB as the primary storage service. The MVP backend needs to store families, parents, children, Telegram account bindings, approval requests, approval decisions, audit events, notification state, and execution status.

The domain is workflow-oriented and event-driven. Most access patterns are expected to be key-based: fetch pending approvals for a parent, fetch approval history for a child, fetch a request by ID, update decision state, and append audit events.

## Decision

Use DynamoDB as the primary MVP operational database.

Use single-table or small-table DynamoDB design only after documenting concrete access patterns. Avoid relational modeling by default. PostgreSQL should be reconsidered if product requirements require complex relational querying, ad hoc reporting, strong multi-record transactions, or richer analytics than DynamoDB can comfortably support.

## Alternatives Considered

### DynamoDB

Pros:

- Strong fit with Lambda, API Gateway, EventBridge, and serverless scaling.
- Low operational overhead.
- Predictable key-value and query access for approval workflows.
- Native TTL support for expiring requests and tokens.
- Streams can support audit, projections, and event-driven consumers.

Cons:

- Requires access-pattern-first modeling.
- Poor fit for ad hoc relational queries.
- Secondary-index mistakes are expensive to unwind.
- Analytics usually require projections into another system.

### PostgreSQL

Pros:

- Natural relational modeling for family, parent, child, and approval entities.
- Strong query flexibility.
- Mature transactional semantics.
- Easier ad hoc reporting during early product discovery.

Cons:

- More operational overhead in an AWS serverless MVP.
- Connection management is more complex with Lambda.
- Requires RDS, Aurora Serverless, or a managed external provider.
- Scaling and availability design is heavier than DynamoDB for this workflow.

### Hybrid: DynamoDB Operational Store With PostgreSQL Analytics Later

Pros:

- Keeps MVP operational path serverless.
- Allows richer reporting once data shape is proven.

Cons:

- Adds data pipeline complexity.
- Requires clear ownership of source-of-truth vs derived views.

## Consequences

- Backend data models must be designed around known queries.
- Approval and audit writes should be idempotent and append-friendly.
- Reporting features may need read models, exports, or analytics storage later.
- Developers must avoid treating DynamoDB like a relational database.

## Implementation Notes

- Document access patterns before creating tables or GSIs.
- Use conditional writes for state transitions such as `PENDING` to `APPROVED` or `REJECTED`.
- Use TTL for expired approval tokens and stale pending requests where appropriate.
- Use DynamoDB Streams or EventBridge events for audit projections and notifications.
- Keep personally identifiable and Telegram metadata minimal.
