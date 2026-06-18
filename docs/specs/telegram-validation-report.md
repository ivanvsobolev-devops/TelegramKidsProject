# Telegram Validation Report

## Status

Validation complete for MVP feasibility decision.

Validated areas:

- Authentication.
- Dialog retrieval.
- Channel retrieval.
- Public channel or public supergroup join.
- Private invite join.

Recommendation: proceed to MVP architecture.

## Summary

The Telegram integration spike confirms that the core user-client capabilities required by the MVP are technically available through MTProto:

- A Telegram user session can be authenticated.
- Existing dialogs can be retrieved and classified.
- Broadcast channels can be identified from account dialogs.
- Public channels and public supergroups can be joined by a user client.
- Private invite links can be checked before execution and imported after approval.

This validates the central MVP assumption: Telegram Kids can operate as a Telegram user client and place an application-level approval gate before group and channel join operations.

The validation does not prove global enforcement across Telegram. That remains outside app-level control and must be handled through device-level controls, onboarding, detection, and audit.

## Confirmed Assumptions

### Telegram User Authentication

Confirmed:

- A real Telegram user session can be established with API ID, API hash, phone number, login code, and optional 2FA password.
- Reusable session material can be stored locally and used for subsequent requests.
- The backend does not need Telegram auth keys to support the MVP approval workflow.

Architecture impact:

- Keeping child Telegram session material on the child device remains the correct MVP boundary.
- Parent identity and approval authority should stay separate from Telegram user authentication.

### Dialogs

Confirmed:

- The user-client session can retrieve Telegram dialogs.
- Dialogs can be normalized into useful categories including users, bots, basic groups, broadcast channels, supergroups, and unknown entities.
- Dialog data can provide enough metadata for local UI, membership reconciliation, and policy checks.

Architecture impact:

- The child app can render a useful Telegram experience and reconcile observed membership state.
- The backend can receive normalized, minimal metadata rather than raw Telegram session data.

### Channels

Confirmed:

- Broadcast channels are represented as Telegram channel entities.
- Supergroups also use channel-shaped Telegram entities, but are distinguished by flags.
- Existing channel memberships can be identified from dialogs.

Architecture impact:

- The product must model target type explicitly, because "channel" at the protocol layer can mean broadcast channel or supergroup.
- Parent approval UI should show normalized target type, title, username or invite indicator, and available participant metadata.

### Public Join

Confirmed:

- Public channels and public supergroups can be joined through `channels.JoinChannel`.
- A public username or `t.me/<username>` target can be resolved before execution.
- The join command can be treated as a mutating operation and guarded behind approval.

Architecture impact:

- The child app should create a join request after target resolution and before calling the Telegram join method.
- Approved execution should be scoped to the exact resolved target or target fingerprint.

### Private Invite Join

Confirmed:

- Private invite links can be normalized into invite hashes.
- Invite metadata can be checked with `messages.CheckChatInvite` before execution.
- Private channels, private supergroups, and invite-based basic groups can be joined or requested with `messages.ImportChatInvite`.

Architecture impact:

- Invite metadata is sufficient to create a parent approval request before execution.
- Approval should expire or become stale when invite metadata changes materially, the invite is revoked, or Telegram requires a different execution path.

## Remaining Unknowns

The following items should not block MVP architecture, but they must be resolved before production release:

- TDLib parity: the spike used GramJS; MVP child app should validate the same flows through TDLib on Android.
- Error taxonomy: expired invites, revoked invites, already-joined targets, flood waits, too-many-channel limits, paid subscriptions, account restrictions, and private-channel failures need concrete mappings.
- Join-request-required behavior: Telegram admin approval is separate from parent approval and needs clear state handling.
- Update reconciliation: the app must confirm whether Telegram membership state changed after execution or through another device.
- Direct member additions: other Telegram users may add the child to a group without the child initiating a join in Telegram Kids.
- Session lifecycle: logout, session revocation, device migration, and lost-device recovery are not validated yet.
- Mobile storage: TDLib local database encryption, backup behavior, crash logging, and Android lifecycle behavior need implementation validation.
- Test DC coverage: repeated automated validation should use Telegram test DC accounts where possible.
- Rate limits and abuse controls: flood waits and repeated join attempts need conservative retry and backoff rules.
- Device-control effectiveness: parent onboarding must be validated against Android Family Link or equivalent supervised-device controls.

## Threat Model

### Assets

- Child Telegram session material.
- Parent identity and family permissions.
- Join approval decisions.
- Approval execution tokens.
- Telegram target metadata and invite fingerprints.
- Audit history.
- Child account membership state.

### Actors

- Child using Telegram Kids normally.
- Child attempting to bypass approval.
- Parent approving or rejecting requests.
- External Telegram users sending invite links or adding the child to groups.
- Malicious party with access to a child device, parent device, logs, or session files.
- Telegram platform enforcing rate limits, account restrictions, and changing protocol behavior.

### Trust Boundaries

- Child app is not trusted for authorization decisions.
- Backend is authoritative for family, approval, decision, and audit state.
- Parent app decisions must be authenticated and authorized through backend family membership checks.
- Telegram session material remains on the child device.
- Telegram API is an external dependency and the source of truth for actual Telegram membership.
- Push notifications are hints; backend state is authoritative.

### Primary Threats

- Child joins a group or channel without parent approval.
- Child uses another Telegram client to bypass Telegram Kids.
- Approval token is replayed for a different target.
- Invite metadata changes after parent approval.
- Session material leaks from device storage, logs, terminal output, or crash reports.
- Parent account compromise leads to unauthorized approvals.
- Backend records stale or false execution state from an untrusted child client.
- Telegram rate limits or account restrictions prevent approved execution.

### Required Mitigations

- Require backend approval before executing restricted Telegram join methods in Telegram Kids.
- Bind approval execution tokens to child ID, Telegram account ID, request ID, target fingerprint, action, and expiry.
- Re-resolve or re-check Telegram target metadata immediately before execution.
- Record every request, decision, execution attempt, and final outcome as auditable state.
- Store minimum Telegram metadata needed for decision and audit.
- Never log login codes, 2FA passwords, auth keys, approval tokens, raw invite hashes, or raw session material.
- Detect unapproved membership changes from Telegram updates where possible.
- Educate parents and require device-level controls to block other Telegram clients on supervised child devices.

## Bypass Analysis

### In-App Bypass

Risk: a child uses Telegram Kids UI paths, deep links, search results, forwarded links, or previews to reach a join action.

Assessment:

- This is controllable inside Telegram Kids if all restricted join paths route through one approval gate.
- The app must guard both public joins and invite imports.
- The app must treat deep links, public usernames, invite links, search results, forwarded links, and already-open previews as equivalent join-entry surfaces.

MVP requirement:

- No call to `channels.joinChannel` or `messages.importChatInvite` may occur unless a fresh backend approval exists for the exact target.

### Alternate Client Bypass

Risk: a child uses official Telegram, Telegram Web, Telegram Desktop, another third-party Telegram client, or another already-authenticated device.

Assessment:

- This cannot be prevented by Telegram Kids at the app layer.
- This is the main enforcement boundary and must be stated clearly in product and onboarding.

MVP requirement:

- Parents must configure device-level restrictions to block other Telegram clients.
- Telegram Kids should detect new unapproved memberships when the child app observes them and report policy violations where feasible.

### Direct Addition Bypass

Risk: another Telegram user adds the child to a group without a child-initiated join request.

Assessment:

- This may bypass the approval gate because the mutation can originate outside Telegram Kids.
- Telegram Kids can only detect and respond after the membership appears in updates or dialogs.

MVP requirement:

- Treat detected unapproved membership as a policy event.
- Product must decide whether MVP hides the chat, prompts the parent, leaves the group, or records audit-only state.

### Approval Replay or Target Swap

Risk: an approved request is reused for another group or channel, or an invite points to a changed target.

Assessment:

- This is controllable with scoped execution tokens, target fingerprints, expiry, and pre-execution re-checks.

MVP requirement:

- Approval tokens must be single-purpose and short-lived.
- The child app must revalidate target metadata before execution and mark the request `STALE` if it changed materially.

### Backend or Parent Account Abuse

Risk: compromised parent credentials or backend authorization bugs allow unauthorized approvals.

Assessment:

- This is standard application security scope and must be handled by Cognito-backed authentication, backend authorization, audit logs, and least-privilege API design.

MVP requirement:

- Every parent decision must be authorized against family membership and child access.
- All approval decisions must be auditable.

## MVP Feasibility Assessment

MVP is feasible.

The validated Telegram capabilities are sufficient for the core product promise when the promise is scoped precisely:

> Children cannot join groups or channels through Telegram Kids without parental approval.

The validated capabilities are not sufficient for this stronger claim:

> Children cannot join Telegram groups or channels anywhere without parental approval.

That stronger claim would require control over all Telegram clients, all authenticated devices, and all direct-add paths. Telegram does not provide that global parental-control primitive to third-party apps.

Feasible MVP scope:

- Child authenticates into Telegram through Telegram Kids.
- Child can view dialogs, read channels, and use messaging features.
- Child attempts to join public channels, public supergroups, private channels, private supergroups, or invite-based groups.
- Telegram Kids creates a backend approval request instead of executing the join.
- Parent approves or rejects in the parent app.
- Child app executes only approved joins and reports final state.
- Backend keeps auditable approval and execution state.
- Onboarding tells parents that device-level controls are required to reduce alternate-client bypass.

Not feasible as app-only MVP scope:

- Preventing joins through official Telegram or another client.
- Preventing joins from another already-authenticated device.
- Preventing all external direct additions before they happen.
- Guaranteeing Telegram admin approval after parent approval.

## Recommendation

Proceed to MVP architecture.

The spike validates the protocol-level operations needed for the MVP approval workflow. The remaining unknowns are implementation, hardening, and product-scope details rather than blockers to architecture.

Architecture should proceed with these constraints:

- Use TDLib on the child device for production mobile integration.
- Keep child Telegram session material on the child device.
- Keep backend approval state authoritative.
- Execute Telegram joins from the child app only after backend approval.
- Design approval tokens around exact target binding, single use, and expiry.
- Include bypass disclosure and supervised-device setup in parent onboarding.
- Build audit and reconciliation from the first MVP implementation, not as a later add-on.

Proceeding is recommended because the MVP can validate parent demand and the approval workflow without requiring impossible global Telegram enforcement.
