export const PROTOCOL = "giggle-lab.qr-file-beam.v2";
export const DEFAULT_CHUNK_SIZE = 1200;
export const DEFAULT_BATCH_SIZE = 300;
export const MIN_BATCH_SIZE = 50;
export const MAX_BATCH_SIZE = 1000;
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export type FileMeta = {
  protocol: typeof PROTOCOL;
  type: "file-meta";
  id: string;
  name: string;
  mime: string;
  size: number;
  totalChunks: number;
  totalBatches: number;
  batchSize: number;
  chunkSize: number;
  encoding: "base64";
  checksum: string;
  checksumAlgorithm: "SHA-256";
  createdAt: number;
};
export type BatchMeta = {
  protocol: typeof PROTOCOL;
  type: "batch-meta";
  id: string;
  batchIndex: number;
  batchTotal: number;
  chunkStart: number;
  chunkCount: number;
};
export type Chunk = {
  protocol: typeof PROTOCOL;
  type: "chunk";
  id: string;
  batchIndex: number;
  index: number;
  data: string;
};
export type BatchFinal = {
  protocol: typeof PROTOCOL;
  type: "batch-final";
  id: string;
  batchIndex: number;
  chunkStart: number;
  chunkCount: number;
};
export type FileFinal = {
  protocol: typeof PROTOCOL;
  type: "file-final";
  id: string;
  totalChunks: number;
  totalBatches: number;
  checksum: string;
  size: number;
};
export type Packet = FileMeta | BatchMeta | Chunk | BatchFinal | FileFinal;

export function batchRange(
  batchIndex: number,
  batchSize: number,
  totalChunks: number,
) {
  const chunkStart = batchIndex * batchSize;
  const chunkCount = Math.max(
    0,
    Math.min(batchSize, totalChunks - chunkStart),
  );
  return { chunkStart, chunkCount };
}

export function buildBatchPackets(
  fileMeta: FileMeta,
  chunks: string[],
  batchIndex: number,
): Packet[] {
  const { chunkStart, chunkCount } = batchRange(
    batchIndex,
    fileMeta.batchSize,
    fileMeta.totalChunks,
  );
  const packets: Packet[] = [
    fileMeta,
    {
      protocol: PROTOCOL,
      type: "batch-meta",
      id: fileMeta.id,
      batchIndex,
      batchTotal: fileMeta.totalBatches,
      chunkStart,
      chunkCount,
    },
  ];

  for (let i = 0; i < chunkCount; i += 1) {
    const globalIndex = chunkStart + i;
    packets.push({
      protocol: PROTOCOL,
      type: "chunk",
      id: fileMeta.id,
      batchIndex,
      index: globalIndex,
      data: chunks[globalIndex] ?? "",
    });
  }

  packets.push({
    protocol: PROTOCOL,
    type: "batch-final",
    id: fileMeta.id,
    batchIndex,
    chunkStart,
    chunkCount,
  });

  if (batchIndex === fileMeta.totalBatches - 1) {
    packets.push({
      protocol: PROTOCOL,
      type: "file-final",
      id: fileMeta.id,
      totalChunks: fileMeta.totalChunks,
      totalBatches: fileMeta.totalBatches,
      checksum: fileMeta.checksum,
      size: fileMeta.size,
    });
  }

  return packets;
}

export function packetLabel(packet: Packet): string {
  switch (packet.type) {
    case "file-meta":
      return "file-meta";
    case "batch-meta":
      return `batch-meta · b${packet.batchIndex + 1}/${packet.batchTotal}`;
    case "chunk":
      return `chunk #${packet.index} · b${packet.batchIndex + 1}`;
    case "batch-final":
      return `batch-final · b${packet.batchIndex + 1}`;
    case "file-final":
      return "file-final";
  }
}
