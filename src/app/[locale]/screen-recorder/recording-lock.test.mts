import assert from "node:assert/strict";
import test from "node:test";

import { isProjectLocked, lockedProjectId } from "./recording-lock.ts";

test("only the project being recorded or saved is locked", () => {
  assert.equal(isProjectLocked("recording", "live", "live"), true);
  assert.equal(isProjectLocked("saving", "live", "live"), true);
  assert.equal(isProjectLocked("recording", "live", "other"), false);
  assert.equal(isProjectLocked("ready", "live", "live"), false);
  assert.equal(isProjectLocked("idle", null, "live"), false);
  assert.equal(lockedProjectId("recording", "live"), "live");
  assert.equal(lockedProjectId("saving", "live"), "live");
  assert.equal(lockedProjectId("ready", "live"), null);
});
