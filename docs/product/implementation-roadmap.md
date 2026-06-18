# Implementation Roadmap

## Purpose

This roadmap defines the implementation phases for the bot-first MVP:

- Child Flutter App.
- Backend.
- Parent Telegram Bot.
- Backend-executed approved joins.

It does not include a Parent Android App in MVP scope.

## Phase 1: Repository Bootstrap

### Goals

- Establish a working monorepo foundation.
- Create repeatable local development commands.
- Add project documentation structure.
- Keep all future implementation work easy to validate.

### Deliverables

- Repository layout for `apps`, `services`, `docs`, `infra`, and `scripts`.
- Backend package scaffold.
- Child Flutter App scaffold.
- Shared scripts for bootstrap, build, lint, format, and test.
- Initial documentation for product, specs, architecture, and ADRs.
- Basic CI-ready command structure.

### Dependencies

- None.

### Acceptance Criteria

- A new developer can install dependencies from the repo root.
- Backend scaffold builds or passes its bootstrap checks.
- Child app scaffold builds or passes its bootstrap checks.
- Standard scripts exist for `bootstrap`, `build`, `lint`, `format`, and `test`.
- Documentation indexes link to core product, architecture, spec, and ADR documents.

## Phase 2: Backend Foundation

### Goals

- Build the backend core needed for onboarding, identity linking, approval state, audit, and Telegram integration boundaries.
- Define durable domain models before adding bot and child app behavior.
- Establish safe storage boundaries for Telegram session material.

### Deliverables

- Backend HTTP API structure.
- Operational data model for `Family`, `Parent`, `Child`, `Device`, `BotLink`, `VerificationChallenge`, `ApprovalRequest`, `ApprovalDecision`, `JoinExecution`, and `AuditEvent`.
- Persistence adapter for MVP storage.
- Domain services for onboarding, verification, approval request lifecycle, and audit logging.
- Secrets configuration for Telegram Bot token and Telegram API credentials.
- Encrypted session-store interface for child Telegram session custody.
- Idempotency and correlation ID strategy.
- Backend tests for domain state transitions.

### Dependencies

- Phase 1 repository bootstrap.
- Final decision on local/dev storage versus AWS-backed MVP storage.
- Telegram API credentials for integration testing.

### Acceptance Criteria

- Backend can create and read family, parent, child, device, and bot-link records.
- Backend can create, verify, expire, and fail verification challenges.
- Backend can create an `ApprovalRequest` in `PENDING` state.
- Backend records audit events for onboarding and approval state changes.
- Sensitive values are excluded from logs and audit records.
- Domain tests cover successful and failed state transitions.

## Phase 3: Parent Telegram Bot

### Goals

- Make the Telegram Bot the MVP parent interface.
- Support family creation, parent verification, bot linking, child pairing confirmation, and approval callbacks.
- Ensure bot actions are authorized by backend state.

### Deliverables

- Telegram Bot webhook endpoint.
- Bot command handling for `/start`, setup resume, family creation, linking, child pairing, and recovery entry points.
- Inline approval callback handling.
- Bot message templates for onboarding, pairing, approval request, approval result, failure, and recovery.
- Telegram webhook verification or secret-token validation.
- Bot-link authorization checks by Telegram user ID and chat ID.
- Idempotent callback handling.
- Bot integration tests with mocked Telegram updates.

### Dependencies

- Phase 2 backend foundation.
- Telegram Bot token.
- Public webhook endpoint or local tunnel for manual integration testing.

### Acceptance Criteria

- Parent can start the bot and create or resume a family setup session.
- Parent Telegram user and chat are linked to a backend `Parent` and `BotLink`.
- Parent can confirm a child pairing code through the bot.
- Bot rejects callbacks from unlinked or mismatched Telegram users.
- Duplicate callbacks do not duplicate state changes.
- Bot messages never expose raw secrets, raw invite hashes, or session material.

## Phase 4: Child App Shell

### Goals

- Build the minimum Child Flutter App shell needed for onboarding and join-request creation.
- Support child verification and Telegram account linking.
- Avoid implementing full Telegram client UX before the approval loop works.

### Deliverables

- Child app setup screens.
- Backend environment configuration.
- Child pairing-code flow.
- Device registration and status polling.
- Telegram authentication entry point.
- Telegram account metadata submission.
- Session custody handoff or session-linking flow required by backend-executed joins.
- Minimal join-target entry or deep-link capture UI for MVP testing.
- Request status view.

### Dependencies

- Phase 2 backend foundation.
- Phase 3 bot pairing confirmation.
- Telegram authentication integration approach.
- Security review for session-linking/session-custody mechanics.

### Acceptance Criteria

- Child app can start setup and display a pairing code.
- Child app becomes verified only after parent confirmation.
- Child app can authenticate or link the child Telegram account.
- Backend records active child device and Telegram account metadata.
- Child app can submit a candidate join target to the backend.
- Child app displays pending, approved, executing, executed, failed, expired, or stale request status.

## Phase 5: Approval Workflow

### Goals

- Implement the core MVP approval loop.
- Create approval requests from child join attempts.
- Notify the parent through Telegram Bot.
- Execute approved joins from the backend.
- Record final execution state.

### Deliverables

- `POST /approval-requests` API.
- `GET /approval-requests/{id}` status API.
- Target normalization and fingerprinting.
- Approval request de-duplication for same child and target.
- Telegram Bot approval message with inline approve action.
- Parent approval callback handling.
- Backend join executor.
- Telegram error mapping to `EXECUTED`, `FAILED`, `EXPIRED`, `STALE`, and `ADMIN_APPROVAL_PENDING`.
- Execution idempotency by approval request and target fingerprint.
- Audit trail for request, notification, decision, execution start, and final result.

### Dependencies

- Phase 2 backend domain and storage.
- Phase 3 Telegram Bot callbacks.
- Phase 4 child join-target submission.
- Working backend Telegram session custody.
- Valid Telegram test account or disposable account for join testing.

### Acceptance Criteria

- Child can create an `ApprovalRequest` for a join target.
- Parent receives a Telegram Bot approval message.
- Parent approval changes the request from `PENDING` to `APPROVED`.
- Backend executes the join only after a valid approval.
- Duplicate approvals or retried callbacks do not execute duplicate joins.
- Expired or materially changed targets are not executed silently.
- Final execution state is visible to child app and parent bot.
- All workflow transitions are audited.

## Phase 6: End-to-End MVP

### Goals

- Validate the complete MVP from first install through approved Telegram join.
- Harden reliability, recovery, observability, and bypass messaging enough for a controlled MVP pilot.
- Produce a release candidate for internal or limited external testing.

### Deliverables

- Complete first-install onboarding flow.
- Family creation through Telegram Bot.
- Parent verification and bot linking.
- Child verification and Telegram account linking.
- Device replacement flow.
- Parent account recovery flow.
- Child account recovery flow.
- End-to-end approval workflow.
- Manual QA checklist.
- Observability dashboard or log queries for onboarding and approval workflow.
- Security checklist for secrets, session custody, callback validation, and logging.
- Deployment instructions for MVP environment.

### Dependencies

- Phases 1 through 5.
- Stable Telegram Bot webhook deployment.
- Stable backend environment.
- Test devices and Telegram test/disposable accounts.
- Product copy for bypass boundaries and device-control guidance.

### Acceptance Criteria

- A parent can create a family using only Telegram Bot.
- A child can install the app, pair with the family, and link Telegram.
- A child can request a join.
- Parent receives and approves the request in Telegram Bot.
- Backend executes the approved join.
- Child app and bot show final status.
- Device replacement works without leaving the old device active.
- Parent recovery revokes the old bot link.
- Child recovery revokes stale child device/session records.
- Sensitive data is not present in logs.
- End-to-end flow passes on a clean environment using documented steps.

## Related Documents

- [Onboarding Specification](../specs/onboarding.md)
- [MVP Bot Approval Flow Specification](../specs/mvp-bot-approval-flow.md)
- [MVP Bot Architecture](../architecture/mvp-bot-architecture.md)
- [Telegram Validation Report](../specs/telegram-validation-report.md)
