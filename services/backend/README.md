# Telegram Kids Backend

TypeScript backend scaffold for the MVP.

## Scope

This package contains only bootstrap code and build tooling. It does not implement authentication, family management, approvals, Telegram integration, notifications, or persistence yet.

## Commands

```bash
npm install
npm run format
npm run lint
npm test
npm run build
```

## Telegram MTProto Spike

This package includes a local proof of concept for direct MTProto user-client
operations through GramJS. It is a spike only and is not production backend
architecture.

Required environment:

```bash
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_api_hash
```

Commands:

```bash
npm run mtproto:spike -- auth
npm run mtproto:spike -- dialogs --limit 25
npm run mtproto:spike -- channels
npm run mtproto:spike -- join-channel --target telegram
npm run mtproto:spike -- join-invite --invite https://t.me/+invite_hash
```

Join commands are dry-run by default. Add `--execute` only when intentionally
testing with a disposable account or Telegram test account.
