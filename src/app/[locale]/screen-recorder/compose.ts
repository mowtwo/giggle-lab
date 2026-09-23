import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

import {
  discard,
  enqueueFfmpeg,
  execFfmpeg,
  readOutput,
  threadArgs,
} from "./ffmpeg-runner";

export const RECORDING_SOURCE = {
  name: "Giggle Lab",
  owner: "mowtwo",
  url: "https://giggle-lab.mowtwo.com",
  app: "screen-recorder",
} as const;

export const FILE_CREDIT = `Recorded with Giggle Lab by mowtwo (${RECORDING_SOURCE.url})`;

function withSourceMetadata(args: string[]) {
  const output = args.at(-1);
  if (!output) return args;
  return [
    ...args.slice(0, -1),
    "-metadata",
    "title=Giggle Lab",
    "-metadata",
    "artist=mowtwo",
    "-metadata",
    "album=Giggle Lab",
    "-metadata",
    `comment=${FILE_CREDIT}`,
    "-metadata",
    `copyright=mowtwo / Giggle Lab ${RECORDING_SOURCE.url}`,
    "-metadata",
    "encoder=Giggle Lab screen recorder",
    output,
  ];
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function writeInput(
  ffmpeg: FFmpeg,
  name: string,
  data: Blob | Uint8Array | string,
) {
  if (typeof data === "string") {
    await ffmpeg.writeFile(name, data);
    return;
  }
  if (data instanceof Uint8Array) {
    await ffmpeg.writeFile(name, data.slice());
    return;
  }
  await ffmpeg.writeFile(name, await fetchFile(data));
}

export async function transcodeSegmentToFlv(blob: Blob) {
  return enqueueFfmpeg(async (ffmpeg) => {
    await writeInput(ffmpeg, "segment.in", blob);
    const attempts = [
      ["-i", "segment.in", "-c", "copy", "-f", "flv", "segment.flv"],
      [
        "-i",
        "segment.in",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-tune",
        "zerolatency",
        "-crf",
        "28",
        ...threadArgs(),
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-f",
        "flv",
        "segment.flv",
      ],
      [
        "-i",
        "segment.in",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-tune",
        "zerolatency",
        "-crf",
        "28",
        ...threadArgs(),
        "-f",
        "flv",
        "segment.flv",
      ],
    ];
    let lastError: unknown;
    for (const args of attempts) {
      try {
        await execFfmpeg(ffmpeg, withSourceMetadata(args));
        const bytes = await readOutput(ffmpeg, "segment.flv");
        await discard(ffmpeg, "segment.in");
        await discard(ffmpeg, "segment.flv");
        return bytes;
      } catch (error) {
        if (isAbort(error)) throw error;
        lastError = error;
        await discard(ffmpeg, "segment.flv");
      }
    }
    await discard(ffmpeg, "segment.in");
    throw lastError instanceof Error
      ? lastError
      : new Error("Could not mux this segment into FLV");
  });
}

export async function concatFlvToMp4(parts: Uint8Array[]) {
  if (parts.length === 0) throw new Error("No FLV parts");
  if (parts.length === 1) return flvToMp4(parts[0]);
  return enqueueFfmpeg(async (ffmpeg) => {
    const names = ["list.txt", "output.mp4"];
    try {
      for (let index = 0; index < parts.length; index += 1) {
        const name = `p${index}.flv`;
        names.push(name);
        await writeInput(ffmpeg, name, parts[index]);
      }
      await writeInput(
        ffmpeg,
        "list.txt",
        parts.map((_, index) => `file p${index}.flv`).join("\n"),
      );
      const attempts = [
        [
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "list.txt",
          "-c",
          "copy",
          "-bsf:a",
          "aac_adtstoasc",
          "-movflags",
          "+faststart",
          "output.mp4",
        ],
        [
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "list.txt",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          ...threadArgs(),
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          "output.mp4",
        ],
        [
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "list.txt",
          "-an",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          ...threadArgs(),
          "-movflags",
          "+faststart",
          "output.mp4",
        ],
      ];
      let lastError: unknown;
      for (const args of attempts) {
        try {
          await execFfmpeg(ffmpeg, withSourceMetadata(args));
          return await readOutput(ffmpeg, "output.mp4");
        } catch (error) {
          if (isAbort(error)) throw error;
          lastError = error;
          await discard(ffmpeg, "output.mp4");
        }
      }
      throw lastError instanceof Error ? lastError : new Error("MP4 compose failed");
    } finally {
      for (const name of names) await discard(ffmpeg, name);
    }
  });
}

async function flvToMp4(flv: Uint8Array) {
  return enqueueFfmpeg(async (ffmpeg) => {
    await writeInput(ffmpeg, "input.flv", flv);
    const attempts = [
      [
        "-i",
        "input.flv",
        "-c",
        "copy",
        "-bsf:a",
        "aac_adtstoasc",
        "-movflags",
        "+faststart",
        "output.mp4",
      ],
      [
        "-i",
        "input.flv",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        ...threadArgs(),
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "output.mp4",
      ],
      [
        "-i",
        "input.flv",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        ...threadArgs(),
        "-movflags",
        "+faststart",
        "output.mp4",
      ],
    ];
    let lastError: unknown;
    for (const args of attempts) {
      try {
        await execFfmpeg(ffmpeg, withSourceMetadata(args));
        const bytes = await readOutput(ffmpeg, "output.mp4");
        await discard(ffmpeg, "input.flv");
        await discard(ffmpeg, "output.mp4");
        return bytes;
      } catch (error) {
        if (isAbort(error)) throw error;
        lastError = error;
        await discard(ffmpeg, "output.mp4");
      }
    }
    await discard(ffmpeg, "input.flv");
    throw lastError instanceof Error ? lastError : new Error("FLV decode failed");
  });
}

export function captureCoverFromVideo(media: Blob) {
  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(media);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    let settled = false;
    let timer = 0;
    const finish = (error?: Error, blob?: Blob) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      if (error || !blob) reject(error ?? new Error("Cover capture failed"));
      else resolve(blob);
    };
    timer = window.setTimeout(() => finish(new Error("cover-timeout")), 15_000);
    const draw = () => {
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      if (!sourceWidth || !sourceHeight) {
        finish(new Error("Cover capture failed"));
        return;
      }
      const width = 320;
      const height = Math.max(2, Math.round((width * sourceHeight) / sourceWidth / 2) * 2);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        finish(new Error("Cover capture failed"));
        return;
      }
      context.drawImage(video, 0, 0, width, height);
      canvas.toBlob((jpeg) => {
        if (!jpeg) finish(new Error("Cover capture failed"));
        else finish(undefined, jpeg);
      }, "image/jpeg", 0.82);
    };
    video.addEventListener("error", () => finish(new Error("Cover capture failed")));
    video.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = duration > 0.3 ? Math.min(0.4, duration / 2) : 0;
      if (target === 0) {
        draw();
        return;
      }
      video.addEventListener("seeked", () => draw(), { once: true });
      video.currentTime = target;
    });
    video.src = url;
  });
}

export async function captureCover(media: Blob, extension: "flv" | "mp4") {
  return enqueueFfmpeg(async (ffmpeg) => {
    const input = `cover.${extension}`;
    await writeInput(ffmpeg, input, media);
    const attempts = [
      ["-ss", "0", "-i", input],
      ["-ss", "0.5", "-i", input],
    ];
    let lastError: unknown;
    try {
      for (const inputArgs of attempts) {
        try {
          await execFfmpeg(ffmpeg, [
            "-threads",
            "1",
            ...inputArgs,
            "-an",
            "-frames:v",
            "1",
            "-vf",
            "scale=320:-2",
            "-q:v",
            "12",
            "-update",
            "1",
            "cover.jpg",
          ]);
          return await readOutput(ffmpeg, "cover.jpg");
        } catch (error) {
          if (isAbort(error)) throw error;
          lastError = error;
          await discard(ffmpeg, "cover.jpg");
        }
      }
      throw lastError instanceof Error ? lastError : new Error("Cover capture failed");
    } finally {
      await discard(ffmpeg, input);
      await discard(ffmpeg, "cover.jpg");
    }
  });
}
