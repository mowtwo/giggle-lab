import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const MEDIAPIPE_VERSION = "0.10.35";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

export type TrackedHand = {
  landmarks: NormalizedLandmark[];
  handedness: string;
};

export class HandTracker {
  private landmarker: HandLandmarker | null = null;

  async load() {
    if (this.landmarker) {
      return;
    }

    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    try {
      this.landmarker = await createLandmarker(fileset, "GPU");
    } catch {
      this.landmarker = await createLandmarker(fileset, "CPU");
    }
  }

  detect(video: HTMLVideoElement, timestamp: number): TrackedHand[] {
    if (!this.landmarker) {
      return [];
    }

    const result: HandLandmarkerResult = this.landmarker.detectForVideo(
      video,
      timestamp,
    );

    return result.landmarks.map((landmarks, index) => ({
      landmarks,
      handedness: result.handedness[index]?.[0]?.categoryName ?? `Hand ${index + 1}`,
    }));
  }

  close() {
    this.landmarker?.close();
    this.landmarker = null;
  }
}

function createLandmarker(
  fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  delegate: "CPU" | "GPU",
) {
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: HAND_MODEL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.55,
    minTrackingConfidence: 0.5,
  });
}
