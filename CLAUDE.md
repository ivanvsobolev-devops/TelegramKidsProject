# Telegram Kids

Read these documents before making any changes:

- docs/product/vision.md
- docs/product/mvp.md
- docs/product/roadmap-v2.md
- docs/architecture/system-overview.md
- docs/architecture/development-process.md
- docs/architecture/backend-architecture.md
- docs/architecture/deployment-architecture.md

## Core Rules

- Follow Spec Driven Development.
- No implementation before specification.
- Backend is the single source of truth.
- Child client is never trusted.
- Prefer AWS serverless architecture.
- Prefer simple and maintainable solutions.
- Use ADRs for major decisions.
- Every major recommendation must include alternatives and tradeoffs.

## Development Workflow

For every request:

1. Analyze architecture impact.
2. Create or update specification.
3. Create ADR if required.
4. Produce implementation plan.
5. Implement code.
6. Update documentation.

## Pull Requests

Every PR must reference:

- Specification
- ADRs
- Acceptance criteria

## Quality

Required:

- Unit tests
- Documentation updates
- CI validation

No feature is complete without documentation.