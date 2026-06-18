import assert from "node:assert/strict";
import { test } from "node:test";

import { bootstrapStatus, serviceName } from "../src/index.js";

test("exports telegram bot scaffold metadata", () => {
  assert.equal(serviceName, "telegram-kids-telegram-bot");
  assert.equal(bootstrapStatus(), "telegram bot scaffold ready");
});
