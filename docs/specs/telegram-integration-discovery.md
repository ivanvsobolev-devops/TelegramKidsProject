# Telegram Integration Discovery

## Status

Draft discovery specification.

## Problem

Telegram Kids must let a child use Telegram while preventing group joins and channel subscriptions until a parent approves them. Telegram itself does not provide a native parental approval primitive for another application to enforce across all Telegram clients. The product therefore needs a technical integration model that can:

- authenticate the child into Telegram;
- read and send messages as a Telegram user;
- detect or intercept group and channel join attempts in the Telegram Kids child client;
- delay actual Telegram join execution until backend approval;
- record approval and execution state in the backend;
- communicate clear limitations when the child can use the official Telegram app or another client.

## Scope

This specification covers technical discovery and recommendations for:

- MTProto support.
- Alternative Telegram client integration approaches.
- Authentication.
- Channel subscription workflow.
- Group join workflow.
- Delayed execution of joins.
- Limitations of the parental approval flow.
- Bypass risks through the official Telegram app and other Telegram clients.

## Out of Scope

- Source code implementation.
- Final UI designs.
- Content moderation, contact approval, screen time, and school mode.
- Legal review of Telegram API terms.
- Production security assessment of TDLib or any MTProto library.
- Full mobile device management design.

## Source References

- Telegram APIs: https://core.telegram.org/api
- TDLib: https://core.telegram.org/tdlib
- User authorization: https://core.telegram.org/api/auth
- Two-factor authentication: https://core.telegram.org/api/srp
- Invites: https://core.telegram.org/api/invites
- Channels and groups: https://core.telegram.org/api/channel
- `channels.joinChannel`: https://core.telegram.org/method/channels.joinChannel
- `messages.checkChatInvite`: https://core.telegram.org/method/messages.checkChatInvite
- `messages.importChatInvite`: https://core.telegram.org/method/messages.importChatInvite
- Google Family Link app controls: https://support.google.com/families/answer/7103028
- Apple Screen Time parental controls: https://support.apple.com/en-us/105121

## Discovery Summary

Telegram provides three relevant API families:

- Bot API: HTTPS API for bot accounts. It is useful for parent approval bot interactions, but it cannot act as the child user and cannot subscribe the child account to channels or groups.
- Telegram API over MTProto: full user-client API. It can build a custom Telegram client and can call user-only join methods after authentication.
- TDLib: official Telegram client library over MTProto. It handles networking, encryption, local storage, updates, and cross-platform behavior.

The recommended child-client integration is TDLib on Android, with backend-enforced approval state and local client guards that do not call Telegram join methods until approval exists. Raw MTProto should be avoided for MVP unless TDLib cannot meet a hard requirement.

## MTProto Support

Telegram's full client API uses MTProto. Telegram documents the Telegram API as the way to build customized Telegram clients, and requires application registration for `api_id` and `api_hash`.

Relevant capabilities:

- User authentication creates an authorized session bound to the client encryption key.
- User-only methods can join public channels, supergroups, and private invite links.
- Updates are returned after join actions and must be reconciled with local and backend state.
- Rate limits and flood errors are real constraints, including login limits during testing.

Implementation implications:

- A child Telegram account needs a real Telegram user session in the child app.
- The backend should not perform Telegram user operations unless the architecture intentionally stores or operates child user sessions server-side, which is not recommended for MVP.
- The child client must be treated as untrusted for approval decisions, but it is still the practical executor of the final Telegram join because the Telegram session lives there.

## Alternative Telegram Clients

### Option A: TDLib in the Child Android App

Use TDLib as the embedded Telegram client engine.

Pros:

- Official Telegram library.
- Supports full Telegram client behavior.
- Handles MTProto details, encryption, local storage, update ordering, and unreliable networks.
- Better fit for Android MVP than maintaining raw protocol code.

Cons:

- Native library integration and packaging complexity.
- Local Telegram session exists on the child device.
- Join execution depends on the child app being installed, authenticated, and online.
- Requires careful wrapping so restricted actions are gated by backend approval.

### Option B: Raw MTProto Client Library

Use a third-party MTProto library directly.

Pros:

- Potentially smaller abstraction surface for specific workflows.
- More direct control over protocol calls.

Cons:

- Higher security and maintenance risk.
- Need to implement more Telegram client behavior manually.
- Library quality, protocol layer freshness, and update handling vary.
- More expensive to validate for a child-safety product.

### Option C: Server-Side Userbot

Store child Telegram sessions in backend infrastructure and execute joins from Lambda or containers.

Pros:

- Backend directly controls actual Telegram join execution.
- Delayed joins can happen even if the child app is offline.

Cons:

- High privacy and security risk because backend controls child Telegram sessions.
- Poor fit for AWS Lambda because MTProto clients keep state, local storage, and long-running update loops.
- Higher abuse/account-risk profile.
- Increases blast radius if secrets or sessions are compromised.

### Option D: Telegram Bot API Only

Use a bot for all integration.

Pros:

- Simple HTTPS integration.
- Good for parent approvals, notifications, and admin workflows.

Cons:

- Bot accounts cannot act as the child user.
- Cannot provide full Telegram client behavior.
- Cannot join channels or groups on behalf of the child account.

## Authentication

The child app must authenticate the child Telegram account using Telegram user authorization. The expected flow is:

1. Child enters phone number.
2. Telegram sends an authorization code using available delivery methods.
3. Child enters the code.
4. If the account requires 2FA, child enters the Telegram 2FA password using the SRP flow.
5. TDLib stores the local Telegram session encrypted with a local key.
6. Backend stores a `TelegramAccount` record containing Telegram user ID, child ID, session status, and metadata, but not the Telegram auth key.

Authentication requirements:

- Use Telegram test DC accounts for automated and manual auth-flow testing before production DC testing.
- Handle `SESSION_PASSWORD_NEEDED`.
- Handle login flood limits.
- Support logout and session revocation flows.
- Never transmit Telegram login codes, 2FA passwords, or TDLib local database encryption keys to the backend.
- Do not store child Telegram session material in Cognito, DynamoDB, S3, logs, analytics, or crash reports.

Open questions:

- Whether product onboarding assumes an existing child Telegram account or creates one during setup.
- Whether parent must be physically present for the initial Telegram login.
- Whether the parent app needs visibility into active Telegram sessions reported by Telegram.

## Channel Subscription Workflow

Public channel workflow:

1. Child opens a `t.me/<username>` link, `tg://` deep link, search result, forwarded channel, or in-app channel preview.
2. Child app resolves the channel metadata.
3. If the child is not already subscribed, the app creates a backend `ChannelJoinRequest` instead of calling `channels.joinChannel`.
4. Backend records request state as `PENDING` and notifies parent.
5. Parent approves or rejects.
6. On approval, backend records `APPROVED` and returns an executable approval token to the child app.
7. Child app calls the Telegram join method only after verifying the backend approval.
8. Child app reports execution result to backend.
9. Backend records `EXECUTED`, `FAILED`, `EXPIRED`, or `STALE`.

Private invite workflow:

1. Child opens a private invite link.
2. Child app extracts invite hash.
3. Child app calls a safe preview/check operation such as `messages.checkChatInvite` to collect title, type, participant count, request-needed flag, and available preview metadata.
4. Child app creates a backend request with normalized invite metadata.
5. After parent approval, child app calls `messages.importChatInvite`.
6. If Telegram returns `INVITE_REQUEST_SENT`, backend records that Telegram admin approval is still pending separately from parent approval.

Functional requirements:

- All join attempts from the Telegram Kids client must create backend requests when no valid approval exists.
- Request metadata must identify the target as channel, supergroup, basic group, unknown invite, or already joined.
- Approval must be target-specific and child-specific.
- Approval must expire.
- Execution result must be audited.

## Group Join Workflow

Telegram group handling differs by group type:

- Basic groups do not have public usernames and are often joined by invite or direct addition.
- Supergroups are represented by channel constructors with the `megagroup` flag.
- Channels use the same join method family as supergroups for public username joins.

Public supergroup workflow follows the channel public workflow and uses the public peer plus `channels.joinChannel`.

Private group or supergroup invite workflow follows the private invite workflow and uses `messages.importChatInvite` after approval.

Direct additions by other users are a separate risk. If another Telegram user adds the child to a group outside the Telegram Kids client, the product may only detect it after the Telegram update arrives in the child app. The MVP should treat detected unapproved membership as a policy violation event and either:

- leave the group automatically if technically supported and product-approved; or
- hide/lock the chat in the Telegram Kids client and notify the parent.

This behavior requires a separate specification because it can remove the child from legitimate groups and may create confusing Telegram-side side effects.

## Delayed Execution of Joins

Recommended model:

- Backend owns approval decisions and request state.
- Child app owns Telegram session and Telegram API execution.
- Backend emits approval events through EventBridge/SNS/push notification.
- Child app executes pending approved joins when it next syncs and is online.

State model:

- `DRAFT`: client has discovered a target but not submitted.
- `PENDING`: parent decision needed.
- `REJECTED`: parent denied.
- `APPROVED`: parent approved, not yet executed.
- `EXECUTING`: child app has started Telegram join.
- `EXECUTED`: Telegram confirmed join/subscription.
- `FAILED`: Telegram join failed.
- `EXPIRED`: request or approval expired before execution.
- `ADMIN_APPROVAL_PENDING`: Telegram accepted a join request but group/channel admin approval is still pending.
- `STALE`: target metadata changed materially before execution.

Delayed execution rules:

- Approval must include target identity, child ID, request ID, expiry, and target fingerprint.
- The child app must revalidate target metadata immediately before execution when possible.
- If an invite expired, became paid, requires Telegram admin approval, or points to a materially different target, do not execute silently. Mark stale or failed and require a new parent decision.
- Parent approval is not equivalent to Telegram admin approval.
- Delays should be explicit in the parent UI: approved does not always mean joined.

Alternative: server-side delayed execution.

- This gives stronger backend control but requires backend custody of child Telegram sessions.
- It is not recommended for MVP due to privacy, security, and operational risk.

## Limitations of Parental Approval Flow

The approval flow can only reliably control actions performed through the Telegram Kids child app. It cannot globally change Telegram's account-level behavior across all clients.

Known limitations:

- A child who logs into the official Telegram app can join groups and channels there unless the device or account environment blocks that app.
- A child who logs into Telegram Web, Telegram Desktop, or another third-party Telegram client can bypass Telegram Kids controls.
- Telegram does not expose a parent-controlled policy hook that prevents a user account from joining chats across all clients.
- Invites with Telegram admin join requests create a second approval layer outside Telegram Kids.
- Paid channel subscriptions, invite expiry, revoked links, membership caps, flood limits, frozen accounts, and private-channel errors can prevent execution after parent approval.
- If the child app is offline, deleted, force-stopped, or logged out, approved joins may not execute.
- If Telegram sends updates for membership changes caused elsewhere, the app can record and react, but it cannot prevent the external action before it happens.

## Risks of Bypassing Restrictions Using Official Telegram App

Risk: child installs official Telegram and logs in.

- Impact: child can join channels and groups without Telegram Kids approval.
- Mitigation: require Family Link or equivalent Android parental controls to block official Telegram and unknown app installation on supervised devices.
- Residual risk: controls vary by OS, device version, account age, and parent configuration.

Risk: child uses Telegram Web or Desktop on another device.

- Impact: bypasses mobile app controls entirely.
- Mitigation: parent education, OS/browser controls, account session review, and alerts if Telegram Kids sees new authorization updates.
- Residual risk: Telegram account is not technically locked to Telegram Kids.

Risk: child receives login code in another Telegram session.

- Impact: child can authorize another client.
- Mitigation: parent-assisted onboarding, education not to share login codes, session review, and optional parent alerts for new authorization updates.
- Residual risk: Telegram login is controlled by Telegram, not this product.

Risk: app sideloading or alternate app stores.

- Impact: child can install unofficial clients.
- Mitigation: device-level parental controls, disable unknown sources where available, restrict app installs.
- Residual risk: device compromise or unmanaged devices remain outside product control.

Risk: parent assumes backend approval is absolute.

- Impact: misplaced trust in a control that is app-scoped.
- Mitigation: product copy and onboarding must state the boundary clearly: Telegram Kids controls Telegram Kids, while device controls must block other Telegram clients.

## Non-functional Requirements

- Security: backend must never store Telegram login codes, 2FA passwords, auth keys, or local TDLib database keys.
- Privacy: store only the minimum Telegram metadata required for approval, audit, and parent display.
- Reliability: all approval decisions and join execution results must be idempotent.
- Auditability: every request, decision, executor, execution attempt, and Telegram error must be recorded.
- Resilience: approved joins must survive child app restarts and network loss.
- Observability: capture metrics for pending requests, approval latency, execution latency, failed joins, stale approvals, and bypass detection events.
- Maintainability: isolate Telegram client integration behind a domain service boundary.

## Acceptance Criteria

- The discovery identifies that TDLib is the recommended MVP Telegram client approach.
- The discovery explains why Bot API alone is insufficient for child user joins.
- The discovery defines authentication requirements and sensitive data that must not leave the child device.
- The discovery defines public channel, private invite, and group join approval workflows.
- The discovery defines delayed execution states and failure handling.
- The discovery states that approval is app-scoped and cannot stop official Telegram or other clients without device-level controls.
- The discovery includes major alternatives and tradeoffs.

## Implementation Recommendations

1. Use TDLib in the Android child app for MVP Telegram integration.
2. Keep Telegram user session material on the child device only.
3. Use the backend as the source of truth for approval requests, decisions, expiry, audit, and parent notifications.
4. Use Bot API only for parent-facing approval bot workflows, not for child account operations.
5. Implement join gating in the child app as a wrapper around all UI paths that can call Telegram join methods.
6. Normalize all join targets into a backend `JoinTarget` model with type, stable Telegram identifiers when available, invite hash fingerprint, title, username, request-needed flag, and observed metadata timestamp.
7. Add a separate post-MVP specification for detecting and responding to unapproved memberships caused outside Telegram Kids.
8. Make device-level blocking of official Telegram, Telegram Web, and unknown Telegram clients a documented onboarding requirement for parents.
9. Build production auth only after test DC authorization flows pass for phone-code, 2FA, logout, flood-limit, and session-recovery cases.
10. Add a security review before any proposal to store or execute child Telegram sessions in backend infrastructure.
