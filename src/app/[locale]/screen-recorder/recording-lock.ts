export type RecordingPhase = "idle" | "recording" | "saving" | "ready";

export function isProjectLocked(
  phase: RecordingPhase,
  recordingId: string | null,
  projectId: string,
) {
  return recordingId === projectId && (phase === "recording" || phase === "saving");
}

export function lockedProjectId(phase: RecordingPhase, recordingId: string | null) {
  if (!isProjectLocked(phase, recordingId, recordingId ?? "")) return null;
  return recordingId;
}
