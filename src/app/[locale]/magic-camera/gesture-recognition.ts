import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type MagicGesture = "idle" | "pinch" | "point" | "open-palm" | "circle";

type Point3 = {
  x: number;
  y: number;
  z: number;
};

export type GestureFrame = {
  handKey: string;
  gesture: MagicGesture;
  labelKey: string;
  landmarks: NormalizedLandmark[];
  focus: Point3;
  palm: Point3;
  confidence: number;
};

type Point2 = {
  x: number;
  y: number;
};

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;

function distance(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function distance2(a: Point2, b: Point2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function toPoint3(point: NormalizedLandmark): Point3 {
  return {
    x: point.x,
    y: point.y,
    z: point.z ?? 0,
  };
}

function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): Point3 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
  };
}

function isFingerExtended(
  landmarks: NormalizedLandmark[],
  tipIndex: number,
  pipIndex: number,
) {
  const wrist = landmarks[WRIST];
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];

  return distance(wrist, tip) > distance(wrist, pip) * 1.13;
}

function getPalm(landmarks: NormalizedLandmark[]): Point3 {
  const wrist = landmarks[WRIST];
  const index = landmarks[5];
  const pinky = landmarks[17];

  return {
    x: (wrist.x + index.x + pinky.x) / 3,
    y: (wrist.y + index.y + pinky.y) / 3,
    z: ((wrist.z ?? 0) + (index.z ?? 0) + (pinky.z ?? 0)) / 3,
  };
}

export function createGestureRecognizer() {
  const indexTrail: Point2[] = [];
  let circleCooldown = 0;

  return {
    update(landmarks: NormalizedLandmark[], handKey = "hand"): GestureFrame {
      const indexTip = landmarks[INDEX_TIP];
      const thumbTip = landmarks[THUMB_TIP];
      const pinchDistance = distance(indexTip, thumbTip);
      const indexExtended = isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP);
      const middleExtended = isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP);
      const ringExtended = isFingerExtended(landmarks, RING_TIP, RING_PIP);
      const pinkyExtended = isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP);
      const extendedCount = [
        indexExtended,
        middleExtended,
        ringExtended,
        pinkyExtended,
      ].filter(Boolean).length;
      const palm = getPalm(landmarks);

      indexTrail.push({ x: indexTip.x, y: indexTip.y });
      if (indexTrail.length > 44) {
        indexTrail.shift();
      }
      circleCooldown = Math.max(0, circleCooldown - 1);

      const circleScore = getCircleScore(indexTrail);
      const isCircle = circleCooldown === 0 && circleScore > 0.5;

      let gesture: MagicGesture = "idle";
      let focus = toPoint3(indexTip);
      let confidence = 0.35;

      if (isCircle) {
        gesture = "circle";
        confidence = circleScore;
        circleCooldown = 18;
        indexTrail.length = 0;
      } else if (pinchDistance < 0.055) {
        gesture = "pinch";
        focus = midpoint(indexTip, thumbTip);
        confidence = 1 - pinchDistance / 0.055;
      } else if (extendedCount >= 4 && distance(indexTip, thumbTip) > 0.11) {
        gesture = "open-palm";
        focus = palm;
        confidence = Math.min(1, extendedCount / 4);
      } else if (indexExtended && !middleExtended && !ringExtended) {
        gesture = "point";
        confidence = pinkyExtended ? 0.72 : 0.9;
      }

      return {
        handKey,
        gesture,
        labelKey: `gesture.${gesture}`,
        landmarks,
        focus,
        palm,
        confidence,
      };
    },
  };
}

function getCircleScore(points: Point2[]) {
  if (points.length < 14) {
    return 0;
  }

  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );
  center.x /= points.length;
  center.y /= points.length;

  const radii = points.map((point) => distance2(point, center));
  const avgRadius = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;

  if (avgRadius < 0.028) {
    return 0;
  }

  const radiusVariance =
    radii.reduce((sum, radius) => sum + Math.abs(radius - avgRadius), 0) /
    radii.length /
    avgRadius;

  let signedAngleTravel = 0;
  let absoluteAngleTravel = 0;
  let previous = Math.atan2(points[0].y - center.y, points[0].x - center.x);

  for (const point of points.slice(1)) {
    const angle = Math.atan2(point.y - center.y, point.x - center.x);
    let delta = angle - previous;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    signedAngleTravel += delta;
    absoluteAngleTravel += Math.abs(delta);
    previous = angle;
  }

  const signedTurns = Math.abs(signedAngleTravel) / (Math.PI * 2);
  const absoluteTurns = absoluteAngleTravel / (Math.PI * 2);
  const startEndDistance = distance2(points[0], points[points.length - 1]);
  const closureScore = Math.max(0, 1 - startEndDistance / (avgRadius * 2.2));
  const shapeScore = Math.max(0, 1 - radiusVariance * 1.5);
  const turnScore = Math.min(1, signedTurns / 0.48);
  const motionScore = Math.min(1, absoluteTurns / 0.68);

  return shapeScore * turnScore * 0.65 + closureScore * motionScore * 0.35;
}
