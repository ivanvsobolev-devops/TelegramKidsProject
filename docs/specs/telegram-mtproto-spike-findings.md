# Telegram MTProto Spike Findings

## Status

Spike implemented.

## Scope

This document records findings from a proof of concept that uses GramJS, a
TypeScript MTProto client, from the existing backend workspace. This is not a
production architecture recommendation.

## Proof of Concept

The runnable spike is implemented at:

- `services/backend/src/mtproto-spike.ts`

Install dependencies:

```bash
npm install --prefix services/backend
```

Set Telegram API credentials from https://my.telegram.org:

```bash
export TELEGRAM_API_ID=123456
export TELEGRAM_API_HASH=your_api_hash
```

Authenticate a Telegram user:

```bash
npm --prefix services/backend run mtproto:spike -- auth
```

Retrieve dialogs:

```bash
npm --prefix services/backend run mtproto:spike -- dialogs --limit 50
```

Retrieve broadcast channels:

```bash
npm --prefix services/backend run mtproto:spike -- channels --limit 100
```

Investigate public channel or public supergroup join:

```bash
npm --prefix services/backend run mtproto:spike -- join-channel --target telegram
```

Execute public channel or public supergroup join:

```bash
npm --prefix services/backend run mtproto:spike -- join-channel --target telegram --execute
```

Investigate private invite join:

```bash
npm --prefix services/backend run mtproto:spike -- join-invite --invite https://t.me/+invite_hash
```

Execute private invite join:

```bash
npm --prefix services/backend run mtproto:spike -- join-invite --invite https://t.me/+invite_hash --execute
```

## Authentication

The spike authenticates a real Telegram user session with:

- Telegram API ID.
- Telegram API hash.
- Phone number.
- Login code.
- Optional Telegram 2FA password.

GramJS stores the authorized session as a `StringSession`. The spike supports:

- `TELEGRAM_SESSION` for an existing session string.
- `TELEGRAM_SESSION_FILE` for a local session file.
- `.telegram-mtproto-spike.session` as the default local session file.

The default session file is ignored by git.

## Chat List Retrieval

The spike uses `client.iterDialogs({ limit })`.

Observed dialog categories are normalized as:

- `user`
- `bot`
- `basic_group`
- `channel`
- `supergroup`
- `unknown`

Returned fields include:

- Telegram peer ID.
- Display title.
- Username when available.
- Participant count when available.
- Unread count.
- Archive/folder metadata.

## Channel Retrieval

Telegram represents both broadcast channels and supergroups with the MTProto
`Channel` constructor.

The spike's `channels` command filters dialogs to `Api.Channel` entities with
the `broadcast` flag. Supergroups remain visible in the `dialogs` command with
`kind=supergroup`.

## Public Channel Join

Public channels and public supergroups can be joined with:

- MTProto method: `channels.JoinChannel`
- GramJS request: `new Api.channels.JoinChannel({ channel })`

The spike resolves a public `@username` or `t.me/<username>` target before
execution and prints the resolved entity. The command is dry-run unless
`--execute` is supplied.

## Private Group or Channel Join

Private invite links are handled as invite hashes.

The spike checks invite metadata with:

- MTProto method: `messages.CheckChatInvite`
- GramJS request: `new Api.messages.CheckChatInvite({ hash })`

It executes the join with:

- MTProto method: `messages.ImportChatInvite`
- GramJS request: `new Api.messages.ImportChatInvite({ hash })`

This path applies to private channels, private supergroups, and invite-based
basic groups. The command is dry-run unless `--execute` is supplied.

## Group Join Findings

Telegram group behavior depends on group type:

- Basic groups usually require invite links or member-added flows.
- Public supergroups behave like public channels for join purposes and use
  `channels.JoinChannel`.
- Private supergroups use invite hashes and `messages.ImportChatInvite`.

The spike does not attempt direct member-add flows. That is a separate
permission and abuse-risk area.

## Open Follow-Up

- Validate against Telegram test DC accounts before repeated production account
  testing.
- Capture concrete error mappings from real join attempts, including expired
  invites, join-request-required invites, already-joined targets, flood waits,
  and too-many-channel limits.
- Decide whether the mobile MVP should use TDLib only, or whether GramJS remains
  useful for local tooling and protocol exploration.
