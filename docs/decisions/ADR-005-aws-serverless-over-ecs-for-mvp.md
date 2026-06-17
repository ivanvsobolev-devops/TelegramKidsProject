# ADR-005: AWS Serverless Over ECS for MVP

## Status

Proposed

## Context

The deployment architecture prefers AWS, Terraform, API Gateway, Lambda, DynamoDB, EventBridge, SNS, Cognito, S3, Secrets Manager, CloudWatch, and GitHub Actions. The MVP backend is mostly API, workflow, notification, approval, audit, and integration logic.

The product does not currently require long-running backend workers for child Telegram sessions because ADR-002 recommends client-executed approved joins. This keeps the backend aligned with event-driven serverless execution.

## Decision

Use AWS serverless architecture for the MVP backend instead of ECS.

Use Lambda for API handlers and event consumers, API Gateway for HTTP entry points, DynamoDB for operational state, EventBridge/SNS for asynchronous workflows, Cognito for identity, Secrets Manager for secrets, and CloudWatch for logging and metrics.

## Alternatives Considered

### AWS Serverless

Pros:

- Lowest operational overhead for MVP.
- Scales naturally for bursty approval and notification workloads.
- Good fit for event-driven approval workflows.
- Keeps infrastructure small and consistent with existing architecture docs.
- Pay-per-use cost model is favorable during validation.

Cons:

- Lambda cold starts and execution limits must be considered.
- Local development and integration testing require discipline.
- Long-running persistent connections are a poor fit.
- Vendor coupling to AWS services increases.

### ECS

Pros:

- Better fit for long-running services and persistent connections.
- Familiar container deployment model.
- Easier to run stateful workers that need process-local lifecycle control.
- More portable than a heavily serverless AWS design.

Cons:

- More infrastructure to operate for MVP.
- Requires service scaling, deployment, health checks, networking, and capacity decisions.
- Less natural fit for simple event-driven approval workflows.
- Higher baseline operational cost and complexity.

### Hybrid: Serverless API With ECS Workers

Pros:

- Keeps API and workflow serverless while supporting long-running workloads if needed.
- Useful if backend-held Telegram sessions are later approved.

Cons:

- Adds two execution models.
- Requires clearer operational boundaries and monitoring.
- Premature unless a long-running workload is confirmed.

## Consequences

- Backend services must be designed as short-lived, idempotent handlers.
- Long-running Telegram user-session work is explicitly out of MVP backend scope.
- Terraform modules should focus on serverless primitives first.
- If future features require persistent workers, a new ADR should decide whether to add ECS.

## Implementation Notes

- Use EventBridge events for approval lifecycle transitions.
- Use SNS or platform push notification services for parent and child notifications.
- Use Lambda reserved concurrency and retry policies deliberately for external integrations.
- Keep handlers small and domain-oriented.
- Add structured logging, request IDs, and audit event correlation from the start.
