# MVP Bot Approval Flow Specification

## Problem

Telegram Kids needs the smallest end-to-end MVP that proves parental approval for Telegram joins.

The MVP must allow a child to request access to a Telegram group or channel, notify the parent in Telegram, accept the parent's approval, and execute the approved join.

## Scope

In scope:

- Child Flutter App.
- Backend.
- Parent Telegram Bot.
- Child Telegram authentication.
- Parent Telegram Bot account linking.
- Join request creation.
- Telegram Bot approval message.
- Parent approve action.
- Backend-executed Telegram join.
- Audit state for request, decision, and execution.

Out of scope:

- Parent Android App.
- Parent approval history UI outside Telegram Bot.
- Multi-parent conflict resolution beyond idempotent first valid decision.
- Rich family management UI.
- Content moderation.
- Blocking official Telegram or other Telegram clients.
- Production-grade anti-abuse automation beyond conservative MVP safeguards.

## User Stories

- As a child, I want to request access to a group or channel so my parent can approve it.
- As a parent, I want to receive a Telegram message when my child requests a join so I can approve quickly.
- As a parent, I want the approval message to show enough target context to make a decision.
- As the system, I want to execute the Telegram join only after a valid parent approval.
- As the system, I want every request, approval, and execution result recorded for audit.

## Functional Requirements

### Child Flutter App

- The child app authenticates the child Telegram account.
- The child app detects restricted join attempts before executing them.
- The child app resolves or previews the join target when possible.
- The child app creates an `ApprovalRequest` through the backend.
- The child app does not execute restricted joins directly in the MVP.
- The child app displays request status returned by the backend.

### Backend

- The backend stores child, parent, Telegram account, bot link, approval request, approval decision, execution, and audit records.
- The backend validates that a child can create an approval request for the linked family.
- The backend creates an `ApprovalRequest` with status `PENDING`.
- The backend sends a Telegram Bot message to the linked parent.
- The backend validates Telegram Bot callback actions.
- The backend records the parent approval decision.
- The backend executes the Telegram join after approval.
- The backend records execution result state.
- The backend treats approval and execution operations as idempotent.

### Parent Telegram Bot

- The bot receives outbound approval messages from the backend.
- The bot displays child name, target title, target type, public username or invite indicator, and available risk context.
- The bot provides an approve action.
- The bot sends callback updates to the backend.
- The bot must not be the source of truth for approval state.

## Core Domain Objects

### ApprovalRequest

Required fields:

- `approvalRequestId`
- `familyId`
- `childId`
- `childTelegramAccountId`
- `targetType`
- `targetFingerprint`
- `targetTitle`
- `targetUsername`
- `inviteFingerprint`
- `status`
- `createdAt`
- `expiresAt`

Statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `EXPIRED`
- `EXECUTING`
- `EXECUTED`
- `FAILED`
- `STALE`
- `ADMIN_APPROVAL_PENDING`

### ApprovalDecision

Required fields:

- `approvalDecisionId`
- `approvalRequestId`
- `parentId`
- `decision`
- `decisionSource`
- `decidedAt`

Decision source for this MVP:

- `TELEGRAM_BOT`

### JoinExecution

Required fields:

- `joinExecutionId`
- `approvalRequestId`
- `executor`
- `telegramMethod`
- `startedAt`
- `finishedAt`
- `resultStatus`
- `telegramErrorCode`
- `telegramErrorMessage`

Executor for this MVP:

- `BACKEND`

## Acceptance Criteria

- A child can request a join from the Child Flutter App.
- The backend creates exactly one active `ApprovalRequest` for the same child and target within the request window.
- The linked parent receives a Telegram Bot approval message.
- The parent can approve from Telegram.
- The backend records the parent decision.
- The backend executes the Telegram join after approval.
- The backend records final execution state.
- A join is not executed before approval.
- Duplicate Telegram Bot callbacks do not create duplicate decisions or duplicate join execution.
- Expired or materially changed targets are not executed silently.

## Non-functional Requirements

- Security: never log login codes, 2FA passwords, Telegram auth keys, raw session strings, bot tokens, callback secrets, approval tokens, or raw invite hashes.
- Privacy: store only Telegram metadata needed for approval, execution, and audit.
- Reliability: approval callbacks and execution attempts must be idempotent.
- Observability: correlate request creation, bot message delivery, callback handling, join execution, and final state.
- Latency: approval message delivery should be near real time, but backend state remains authoritative if notification delivery is delayed.
- Abuse control: use conservative retry and backoff for Telegram errors and flood waits.

## Open Questions

- Whether MVP supports reject action in the bot or only approve plus expiry.
- Whether backend session custody uses GramJS for MVP or TDLib in a backend worker.
- Whether backend execution runs in Lambda only or a small stateful worker for Telegram session lifecycle.
- How parent Telegram Bot linking is bootstrapped without a Parent Android App.
- Whether direct additions outside the approval flow are audit-only or trigger automatic leave.
