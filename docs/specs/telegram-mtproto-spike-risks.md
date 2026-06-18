# Telegram MTProto Spike Risks

## Status

Spike risk notes.

## Scope

These risks apply to the local MTProto proof of concept and to any future design
that directly operates a Telegram user session. This document does not define
production architecture.

## Account and Terms Risk

Direct MTProto clients operate as real Telegram user clients. Testing can affect
the account used for the spike.

Risks:

- Login attempts can trigger rate limits or flood waits.
- Join testing can subscribe the test account to real groups or channels.
- Repeated automated behavior can look abusive.
- Telegram API behavior and enforcement can change without notice.

Mitigations for the spike:

- Use disposable accounts or Telegram test accounts where possible.
- Keep join commands dry-run unless intentionally testing with `--execute`.
- Avoid repeated login and join loops.
- Do not run this against a child or personal primary account.

## Session Custody Risk

The GramJS `StringSession` is equivalent to sensitive Telegram login material.
Anyone with the session and API credentials may be able to operate the account.

Risks:

- Session leakage through shell history, logs, crash reports, or copied output.
- Session file theft from the developer machine.
- Accidental commit of `.env` or session files.

Mitigations in the spike:

- The default session file is ignored by git.
- Session file writes use mode `0600`.
- The proof of concept does not send session material to backend services.

Remaining concern:

- The CLI prints the session after auth for developer convenience. Treat that
  terminal output as sensitive.

## Privacy Risk

Retrieving dialogs exposes account relationship and membership data.

Risks:

- Dialog titles and peer IDs may identify private contacts, groups, and channels.
- Invite checks may reveal private group metadata.
- Console output can be captured by terminal logs or CI logs.

Mitigations:

- Run the spike locally only.
- Do not run in CI with real Telegram credentials.
- Do not paste raw output into tickets or public documents.

## Mutation Risk

Join operations mutate Telegram account state.

Risks:

- `channels.JoinChannel` joins public channels and public supergroups.
- `messages.ImportChatInvite` joins private invite targets or sends a join
  request where Telegram requires admin approval.
- Already-joined or stale invite states need explicit handling before production
  use.

Mitigations in the spike:

- Join commands are dry-run by default.
- `--execute` is required for mutating requests.
- Public targets are resolved and printed before execution.
- Private invites are checked before execution.

## Coverage Risk

The spike confirms basic method access, but it does not cover full Telegram
client behavior.

Not covered:

- Update stream reconciliation after joins.
- Message history retrieval.
- Media handling.
- Logout and session revocation.
- QR login.
- Telegram test DC setup.
- Flood wait retry policy.
- Device-level bypass through other Telegram clients.
- Mobile packaging, storage, or TDLib integration.

## Library Risk

GramJS is a third-party MTProto library.

Risks:

- Protocol layer support can lag Telegram changes.
- Security and storage behavior require separate review.
- Runtime behavior may differ from TDLib on Android.
- It may be useful for exploration but still be the wrong fit for the mobile MVP.

Mitigation:

- Treat this as a proof of concept and protocol investigation tool.
- Keep the production mobile decision separate from this spike.
- Prefer TDLib for the child app unless a later spike proves it cannot meet a
  hard requirement.

## Bypass Risk

A Telegram Kids client can gate joins only inside that client.

Risks:

- Official Telegram, Telegram Web, Telegram Desktop, and other third-party
  clients can join groups or channels outside this app's controls.
- Another already-authenticated device can mutate account state.
- Direct additions by other Telegram users may occur without going through the
  child app join flow.

Mitigation direction:

- Pair app-level controls with device-level parental controls.
- Detect unapproved memberships when the child client receives updates.
- Treat detection, hiding, leaving, and parent notification as separate product
  decisions.
