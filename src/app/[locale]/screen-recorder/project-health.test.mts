import assert from "node:assert/strict";
import test from "node:test";

import { classifyProject, idsNeedingCompose } from "./project-health.ts";

test("a project with no usable media is broken", () => {
  assert.equal(classifyProject({ flvParts: [], outputMp4Bytes: null }, 0, false), "broken");
  assert.equal(classifyProject({ flvParts: [{}], outputMp4Bytes: null }, 0, false), "broken");
});

test("flv that matches the manifest can be composed, and a readable mp4 is ready", () => {
  assert.equal(classifyProject({ flvParts: [{}], outputMp4Bytes: null }, 1, false), "needs-compose");
  assert.equal(classifyProject({ flvParts: [{}], outputMp4Bytes: 10 }, 1, true), "ready");
  assert.equal(classifyProject({ flvParts: [], outputMp4Bytes: 10 }, 0, true), "ready");
  assert.equal(classifyProject({ flvParts: [{}], outputMp4Bytes: 10 }, 1, false), "needs-compose");
});

test("a mismatched flv count or a previous compose failure is damaged", () => {
  assert.equal(classifyProject({ flvParts: [{}, {}], outputMp4Bytes: null }, 1, false), "broken");
  assert.equal(classifyProject({ flvParts: [{}, {}], outputMp4Bytes: 10 }, 1, true), "broken");
  assert.equal(
    classifyProject({ flvParts: [{}], outputMp4Bytes: null, damaged: true }, 1, false),
    "broken",
  );
  assert.equal(
    classifyProject({ flvParts: [{}], outputMp4Bytes: 10, damaged: true }, 1, true),
    "broken",
  );
});

test("damaged projects are not queued for compose", () => {
  const ids = idsNeedingCompose(
    [
      { id: "broken", flvParts: [], outputMp4Bytes: null },
      { id: "missing-file", flvParts: [{}], outputMp4Bytes: null },
      { id: "partial", flvParts: [{}, {}], outputMp4Bytes: null },
      { id: "failed", flvParts: [{}], outputMp4Bytes: null, damaged: true },
      { id: "pending", flvParts: [{}], outputMp4Bytes: null },
      { id: "done", flvParts: [{}], outputMp4Bytes: 4 },
    ],
    (id) => {
      if (id === "pending") return { readableFlvCount: 1, mp4Readable: false };
      if (id === "partial") return { readableFlvCount: 1, mp4Readable: false };
      if (id === "failed") return { readableFlvCount: 1, mp4Readable: false };
      if (id === "done") return { readableFlvCount: 1, mp4Readable: true };
      return { readableFlvCount: 0, mp4Readable: false };
    },
  );
  assert.deepEqual(ids, ["pending"]);
});
