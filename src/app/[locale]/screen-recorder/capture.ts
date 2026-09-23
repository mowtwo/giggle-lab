import { ffmpegPlatformSupport } from "./ffmpeg-platform";

const SEGMENT_MS = 4000;

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
}

export type CaptureSupport = "ok" | "phone" | "missing" | "wasm";

export function screenCaptureSupport(): CaptureSupport {
  const ua = navigator.userAgent;
  const mobileHint = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData?.mobile;
  const phone =
    /iPhone|iPod/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua)) ||
    (mobileHint === true && !/iPad|Tablet/i.test(ua));
  if (phone) return "phone";
  if (ffmpegPlatformSupport() !== "ok") return "wasm";
  if (typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
    return "missing";
  }
  return "ok";
}

export type CaptureSession = {
  stream: MediaStream;
  stop: () => void;
};

export async function openCapture(mic: boolean): Promise<CaptureSession> {
  const display = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30 },
    audio: true,
  });
  const extraTracks: MediaStreamTrack[] = [];
  let context: AudioContext | null = null;
  let tracks = [...display.getTracks()];

  if (mic) {
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    extraTracks.push(...micStream.getAudioTracks());
    context = new AudioContext();
    const dest = context.createMediaStreamDestination();
    const displayAudio = display.getAudioTracks();
    if (displayAudio.length > 0) {
      context.createMediaStreamSource(new MediaStream(displayAudio)).connect(dest);
    }
    context.createMediaStreamSource(micStream).connect(dest);
    tracks = [...display.getVideoTracks(), ...dest.stream.getAudioTracks()];
  }

  const stream = new MediaStream(tracks);
  return {
    stream,
    stop() {
      for (const track of display.getTracks()) track.stop();
      for (const track of extraTracks) track.stop();
      void context?.close();
    },
  };
}

export class SegmentRecorder {
  private recorder: MediaRecorder | null = null;
  private timer = 0;
  private index = 0;
  private stopped = false;

  constructor(
    private readonly stream: MediaStream,
    private readonly mimeType: string,
    private readonly onSegment: (index: number, blob: Blob) => void,
  ) {}

  start() {
    this.stopped = false;
    this.openRecorder();
  }

  stop() {
    this.stopped = true;
    window.clearTimeout(this.timer);
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
  }

  private openRecorder() {
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(
      this.stream,
      this.mimeType
        ? { mimeType: this.mimeType, videoBitsPerSecond: 2_500_000 }
        : { videoBitsPerSecond: 2_500_000 },
    );
    this.recorder = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, {
        type: this.mimeType || recorder.mimeType,
      });
      const index = this.index;
      this.index += 1;
      const live = this.stream
        .getVideoTracks()
        .some((track) => track.readyState === "live");
      if (!this.stopped && live) this.openRecorder();
      if (blob.size > 0) this.onSegment(index, blob);
    };
    recorder.start();
    this.timer = window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, SEGMENT_MS);
  }
}
