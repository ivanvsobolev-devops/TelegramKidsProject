import assert from "node:assert/strict";
import { test } from "node:test";

import { bootstrapStatus, serviceName } from "../src/index.ts";

test("exports backend scaffold metadata", () => {
  assert.equal(serviceName, "telegram-kids-backend");
  assert.equal(bootstrapStatus(), "backend scaffold ready");
});
