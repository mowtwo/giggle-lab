import assert from "node:assert/strict";
import test from "node:test";

import {
  createComposeQueue,
  dropCompose,
  enqueueCompose,
  finishCompose,
  hasPendingCompose,
  prioritizeCompose,
} from "./compose-queue.ts";

test("enqueue starts the first unfinished project and ignores duplicates", () => {
  const queued = enqueueCompose(createComposeQueue(), ["a", "a", "b"]);
  assert.equal(queued.current, "a");
  assert.deepEqual(queued.waiting, ["b"]);
  const again = enqueueCompose(queued, ["b", "c"]);
  assert.equal(again.current, "a");
  assert.deepEqual(again.waiting, ["b", "c"]);
});

test("repeated interrupts put the previous project next", () => {
  let queue = enqueueCompose(createComposeQueue(), ["a", "b", "c"]);
  queue = prioritizeCompose(queue, "d");
  assert.equal(queue.current, "d");
  assert.deepEqual(queue.waiting, ["a", "b", "c"]);
  queue = prioritizeCompose(queue, "e");
  assert.equal(queue.current, "e");
  assert.deepEqual(queue.waiting, ["d", "a", "b", "c"]);
  queue = prioritizeCompose(queue, "b");
  assert.equal(queue.current, "b");
  assert.deepEqual(queue.waiting, ["e", "d", "a", "c"]);
});

test("broken projects leave the compose queue", () => {
  const queue = enqueueCompose(createComposeQueue(), ["broken", "next", "later"]);
  const droppedWaiting = dropCompose(queue, new Set(["later", "missing"]));
  assert.equal(droppedWaiting.current, "broken");
  assert.deepEqual(droppedWaiting.waiting, ["next"]);
  const droppedCurrent = dropCompose(droppedWaiting, new Set(["broken"]));
  assert.equal(droppedCurrent.current, "next");
  assert.deepEqual(droppedCurrent.waiting, []);
  assert.equal(droppedCurrent.generation, droppedWaiting.generation + 1);
  assert.equal(finishCompose(droppedCurrent, droppedWaiting.generation), droppedCurrent);
  assert.equal(dropCompose(droppedCurrent, new Set(["gone"])), droppedCurrent);
  assert.equal(hasPendingCompose(dropCompose(droppedCurrent, new Set(["next"]))), false);
});

test("prioritizing the current project does not reshuffle", () => {
  const queue = enqueueCompose(createComposeQueue(), ["a", "b"]);
  assert.equal(prioritizeCompose(queue, "a"), queue);
});

test("finish advances only the generation that is still current", () => {
  const queue = enqueueCompose(createComposeQueue(), ["a", "b"]);
  const interrupted = prioritizeCompose(queue, "c");
  assert.equal(finishCompose(interrupted, queue.generation), interrupted);
  const finished = finishCompose(interrupted, interrupted.generation);
  assert.equal(finished.current, "a");
  assert.deepEqual(finished.waiting, ["b"]);
  assert.equal(hasPendingCompose(finishCompose(finished, finished.generation)), true);
  const drained = finishCompose(
    finishCompose(finished, finished.generation),
    finishCompose(finished, finished.generation).generation,
  );
  assert.equal(drained.current, null);
  assert.equal(hasPendingCompose(drained), false);
});
