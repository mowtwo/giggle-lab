import { FILE_CREDIT, RECORDING_SOURCE } from "./compose";
import type { RecordingStore } from "./storage";
import type { ProjectManifest } from "./types";

export async function buildRecordingZip(store: RecordingStore, project: ProjectManifest) {
  if (project.flvParts.length === 0) {
    throw new Error("no-flv");
  }
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const config = {
    ...project,
    source: { ...RECORDING_SOURCE },
    files: project.flvParts.map((part) => `flv/${part.name}`),
  };
  zip.file("recording.json", JSON.stringify(config, null, 2), {
    compression: "DEFLATE",
    comment: FILE_CREDIT,
  });
  const ordered = [...project.flvParts].sort((a, b) => a.index - b.index);
  for (const part of ordered) {
    const blob = await store.readBytes(project.id, `flv/${part.name}`);
    zip.file(`flv/${part.name}`, blob, {
      compression: "STORE",
      comment: FILE_CREDIT,
    });
  }
  return zip.generateAsync({
    type: "blob",
    comment: FILE_CREDIT,
  });
}
