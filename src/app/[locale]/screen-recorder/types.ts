import { RECORDING_SOURCE } from "./compose";

export type StorageTier = "directory" | "opfs" | "indexeddb" | "memory";

type SegmentMeta = {
  index: number;
  name: string;
  bytes: number;
};

export type ProjectManifest = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mimeType: string;
  flvParts: SegmentMeta[];
  outputMp4Bytes: number | null;
  coverBytes: number | null;
  damaged?: boolean;
  source: {
    name: string;
    owner: string;
    url: string;
    app: string;
  };
};

export function segmentFileName(index: number, extension: string) {
  return `${String(index).padStart(6, "0")}.${extension}`;
}

export function emptyManifest(
  id: string,
  title: string,
  mimeType: string,
): ProjectManifest {
  const now = Date.now();
  return {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    mimeType,
    flvParts: [],
    outputMp4Bytes: null,
    coverBytes: null,
    damaged: false,
    source: { ...RECORDING_SOURCE },
  };
}
