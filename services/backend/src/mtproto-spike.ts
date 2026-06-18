import "dotenv/config";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const defaultSessionFile = path.resolve(
  process.cwd(),
  ".telegram-mtproto-spike.session",
);

type SpikeCommand =
  | "auth"
  | "dialogs"
  | "channels"
  | "join-channel"
  | "join-invite"
  | "help";

interface SpikeConfig {
  apiId: number;
  apiHash: string;
  sessionFile: string;
}

interface DialogRow {
  id?: string;
  title?: string;
  kind: "user" | "bot" | "basic_group" | "channel" | "supergroup" | "unknown";
  username?: string;
  participantsCount?: number;
  unreadCount: number;
  archived: boolean;
  folderId?: number;
}

function printUsage(): void {
  console.log(
    `
Telegram MTProto spike

Usage:
  npm --prefix services/backend run mtproto:spike -- <command> [options]

Commands:
  auth                         Authenticate and save a reusable StringSession
  dialogs [--limit 50]         Retrieve current dialog/chat list
  channels [--limit 100]       Retrieve broadcast channels from dialogs
  join-channel --target NAME   Investigate public channel/supergroup join
  join-invite --invite LINK    Investigate private invite-link join

Join options:
  --execute                    Actually perform the join operation

Environment:
  TELEGRAM_API_ID              API ID from https://my.telegram.org
  TELEGRAM_API_HASH            API hash from https://my.telegram.org
  TELEGRAM_SESSION             Optional GramJS StringSession
  TELEGRAM_SESSION_FILE        Optional local session file path

Examples:
  npm --prefix services/backend run mtproto:spike -- auth
  npm --prefix services/backend run mtproto:spike -- dialogs --limit 25
  npm --prefix services/backend run mtproto:spike -- channels
  npm --prefix services/backend run mtproto:spike -- join-channel --target telegram --execute
  npm --prefix services/backend run mtproto:spike -- join-invite --invite https://t.me/+abc123
`.trim(),
  );
}

function getCommand(): SpikeCommand {
  const command = process.argv[2] ?? "help";
  if (
    command === "auth" ||
    command === "dialogs" ||
    command === "channels" ||
    command === "join-channel" ||
    command === "join-invite" ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    return command === "--help" || command === "-h" ? "help" : command;
  }

  throw new Error(`Unknown command: ${command}`);
}

function getOption(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function getLimit(defaultValue: number): number {
  const rawLimit = getOption("limit") ?? process.env.TELEGRAM_DIALOG_LIMIT;
  if (!rawLimit) {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Invalid --limit value: ${rawLimit}`);
  }

  return parsed;
}

function getConfig(): SpikeConfig {
  const rawApiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!rawApiId || !apiHash) {
    throw new Error("TELEGRAM_API_ID and TELEGRAM_API_HASH are required.");
  }

  const apiId = Number.parseInt(rawApiId, 10);
  if (!Number.isFinite(apiId)) {
    throw new Error(`TELEGRAM_API_ID must be numeric. Received: ${rawApiId}`);
  }

  return {
    apiId,
    apiHash,
    sessionFile: path.resolve(
      process.env.TELEGRAM_SESSION_FILE ?? defaultSessionFile,
    ),
  };
}

async function readSession(sessionFile: string): Promise<string> {
  if (process.env.TELEGRAM_SESSION) {
    return process.env.TELEGRAM_SESSION.trim();
  }

  try {
    return (await readFile(sessionFile, "utf8")).trim();
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

async function saveSession(
  sessionFile: string,
  session: string,
): Promise<void> {
  await mkdir(path.dirname(sessionFile), { recursive: true });
  await writeFile(sessionFile, `${session}\n`, { mode: 0o600 });
}

async function createClient(config: SpikeConfig): Promise<{
  client: TelegramClient;
  stringSession: StringSession;
}> {
  const session = await readSession(config.sessionFile);
  const stringSession = new StringSession(session);
  const client = new TelegramClient(
    stringSession,
    config.apiId,
    config.apiHash,
    {
      connectionRetries: 5,
    },
  );

  return { client, stringSession };
}

async function authenticate(
  client: TelegramClient,
  stringSession: StringSession,
  sessionFile: string,
): Promise<void> {
  const prompts = createInterface({ input, output });

  try {
    await client.start({
      phoneNumber: async () => prompts.question("Telegram phone number: "),
      phoneCode: async () => prompts.question("Telegram login code: "),
      password: async () =>
        prompts.question("Telegram 2FA password, if prompted: "),
      onError: (error) => {
        console.error("Telegram auth error:", formatError(error));
      },
    });
  } finally {
    prompts.close();
  }

  const savedSession = stringSession.save();
  await saveSession(sessionFile, savedSession);

  const me = await client.getMe();
  console.log("Authenticated as:");
  console.log(JSON.stringify(summarizeUser(me), null, 2));
  console.log(`Saved session file: ${sessionFile}`);
  console.log("TELEGRAM_SESSION value:");
  console.log(savedSession);
}

async function runDialogs(
  client: TelegramClient,
  limit: number,
): Promise<void> {
  const rows: DialogRow[] = [];

  for await (const dialog of client.iterDialogs({ limit })) {
    rows.push(dialogToRow(dialog));
  }

  console.log(JSON.stringify({ count: rows.length, dialogs: rows }, null, 2));
}

async function runChannels(
  client: TelegramClient,
  limit: number,
): Promise<void> {
  const rows: DialogRow[] = [];

  for await (const dialog of client.iterDialogs({ limit })) {
    const entity = dialog.entity;
    if (entity instanceof Api.Channel && entity.broadcast) {
      rows.push(dialogToRow(dialog));
    }
  }

  console.log(
    JSON.stringify(
      {
        count: rows.length,
        note: "Only broadcast channels are included. Supergroups appear in dialogs with kind=supergroup.",
        channels: rows,
      },
      null,
      2,
    ),
  );
}

async function investigateJoinChannel(
  client: TelegramClient,
  target: string,
  execute: boolean,
): Promise<void> {
  const normalizedTarget = normalizePublicTarget(target);
  const entity = await client.getEntity(normalizedTarget);

  const result = {
    target: normalizedTarget,
    execute,
    resolved: summarizeEntity(entity),
    mtprotoMethod: "channels.JoinChannel",
    note: "This method applies to public channels and public supergroups. Basic groups normally require an invite link or member invite.",
  };

  console.log(JSON.stringify(result, null, 2));

  if (!execute) {
    console.log("Dry run only. Add --execute to perform the join.");
    return;
  }

  const update = await client.invoke(
    new Api.channels.JoinChannel({ channel: normalizedTarget }),
  );
  console.log("Join result:");
  console.log(JSON.stringify(summarizeUpdates(update), null, 2));
}

async function investigateJoinInvite(
  client: TelegramClient,
  invite: string,
  execute: boolean,
): Promise<void> {
  const hash = extractInviteHash(invite);
  const checked = await client.invoke(
    new Api.messages.CheckChatInvite({ hash }),
  );

  console.log(
    JSON.stringify(
      {
        inviteHash: hash,
        execute,
        checked: summarizeInvite(checked),
        mtprotoMethod: "messages.ImportChatInvite",
        note: "ImportChatInvite is the raw MTProto join path for private channel, private supergroup, and private group invite hashes.",
      },
      null,
      2,
    ),
  );

  if (!execute) {
    console.log("Dry run only. Add --execute to perform the join.");
    return;
  }

  const update = await client.invoke(
    new Api.messages.ImportChatInvite({ hash }),
  );
  console.log("Join result:");
  console.log(JSON.stringify(summarizeUpdates(update), null, 2));
}

function dialogToRow(dialog: {
  id?: { toString(): string };
  title?: string;
  entity?: unknown;
  unreadCount: number;
  archived: boolean;
  folderId?: number;
}): DialogRow {
  const entity = dialog.entity;
  const row: DialogRow = {
    id: dialog.id?.toString(),
    title: dialog.title,
    kind: classifyEntity(entity),
    unreadCount: dialog.unreadCount,
    archived: dialog.archived,
    folderId: dialog.folderId,
  };

  if (entity instanceof Api.Channel || entity instanceof Api.User) {
    row.username = entity.username;
  }

  if (entity instanceof Api.Channel || entity instanceof Api.Chat) {
    row.participantsCount = entity.participantsCount;
  }

  return row;
}

function classifyEntity(entity: unknown): DialogRow["kind"] {
  if (entity instanceof Api.User) {
    return entity.bot ? "bot" : "user";
  }

  if (entity instanceof Api.Chat) {
    return "basic_group";
  }

  if (entity instanceof Api.Channel) {
    if (entity.megagroup) {
      return "supergroup";
    }

    if (entity.broadcast) {
      return "channel";
    }
  }

  return "unknown";
}

function summarizeUser(user: unknown): object {
  if (user instanceof Api.User) {
    return {
      id: user.id.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ? "[present]" : undefined,
      bot: user.bot ?? false,
    };
  }

  return summarizeEntity(user);
}

function summarizeEntity(entity: unknown): object {
  if (entity instanceof Api.User) {
    return {
      type: "user",
      id: entity.id.toString(),
      username: entity.username,
      firstName: entity.firstName,
      lastName: entity.lastName,
      bot: entity.bot ?? false,
    };
  }

  if (entity instanceof Api.Chat) {
    return {
      type: "basic_group",
      id: entity.id.toString(),
      title: entity.title,
      participantsCount: entity.participantsCount,
      deactivated: entity.deactivated ?? false,
    };
  }

  if (entity instanceof Api.Channel) {
    return {
      type: entity.megagroup ? "supergroup" : "channel",
      id: entity.id.toString(),
      title: entity.title,
      username: entity.username,
      broadcast: entity.broadcast ?? false,
      megagroup: entity.megagroup ?? false,
      joinRequest: entity.joinRequest ?? false,
      participantsCount: entity.participantsCount,
    };
  }

  return { type: "unknown", className: getClassName(entity) };
}

function summarizeInvite(invite: Api.TypeChatInvite): object {
  if (invite instanceof Api.ChatInviteAlready) {
    return {
      type: "already_joined",
      chat: summarizeEntity(invite.chat),
    };
  }

  if (invite instanceof Api.ChatInvite) {
    return {
      type: "invite",
      title: invite.title,
      broadcast: invite.broadcast ?? false,
      megagroup: invite.megagroup ?? false,
      requestNeeded: invite.requestNeeded ?? false,
      participantsCount: invite.participantsCount,
    };
  }

  return { type: "unknown", className: getClassName(invite) };
}

function summarizeUpdates(updates: Api.TypeUpdates): object {
  return {
    type: getClassName(updates),
    rawClassName: getClassName(updates),
  };
}

function normalizePublicTarget(target: string): string {
  const trimmed = target.trim();
  const match = trimmed.match(/^(?:https?:\/\/)?t\.me\/([^/?#]+).*$/i);
  const value = match?.[1] ?? trimmed;

  if (value.startsWith("+") || value === "joinchat") {
    throw new Error(
      "Private invite links must use join-invite --invite, not join-channel --target.",
    );
  }

  return value.replace(/^@/, "");
}

function extractInviteHash(invite: string): string {
  const trimmed = invite.trim();
  const match = trimmed.match(
    /^(?:https?:\/\/)?t\.me\/(?:(?:joinchat\/)|(?:\+))([^/?#]+).*$/i,
  );

  return match?.[1] ?? trimmed.replace(/^\+/, "");
}

function getClassName(value: unknown): string | undefined {
  if (
    value &&
    typeof value === "object" &&
    "className" in value &&
    typeof value.className === "string"
  ) {
    return value.className;
  }

  return value?.constructor?.name;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

async function main(): Promise<void> {
  const command = getCommand();

  if (command === "help") {
    printUsage();
    return;
  }

  const config = getConfig();
  const { client, stringSession } = await createClient(config);

  try {
    await authenticate(client, stringSession, config.sessionFile);

    if (command === "auth") {
      return;
    }

    if (command === "dialogs") {
      await runDialogs(client, getLimit(50));
      return;
    }

    if (command === "channels") {
      await runChannels(client, getLimit(100));
      return;
    }

    if (command === "join-channel") {
      const target = getOption("target");
      if (!target) {
        throw new Error("join-channel requires --target.");
      }

      await investigateJoinChannel(client, target, hasFlag("execute"));
      return;
    }

    if (command === "join-invite") {
      const invite = getOption("invite");
      if (!invite) {
        throw new Error("join-invite requires --invite.");
      }

      await investigateJoinInvite(client, invite, hasFlag("execute"));
    }
  } finally {
    await client.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
