import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import * as THREE from "three";

import type { GestureFrame, MagicGesture } from "./gesture-recognition";

type Particle = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
};

type SpellSprite = {
  sprite: THREE.Sprite;
  frames?: THREE.Texture[];
  frameRate: number;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  growth: number;
  spin: number;
};

const MAX_PARTICLES = 1400;
const KENNEY_ROOT = "/magic-camera/kenney-particles";
const OGA_ROOT = "/magic-camera/oga-spells";
const LANDMARK_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
] as const;

const GESTURE_COLORS: Record<MagicGesture, string> = {
  idle: "#69d7ff",
  pinch: "#ffe66d",
  point: "#8affb8",
  "open-palm": "#ff7ab6",
  circle: "#b58cff",
};

function loadSequence(
  loader: THREE.TextureLoader,
  pathPrefix: string,
  frameCount: number,
) {
  return Array.from({ length: frameCount }, (_, index) =>
    loader.load(`${pathPrefix}${index + 1}.png`),
  );
}

export class MagicScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private readonly clock = new THREE.Clock();
  private readonly particles: Particle[] = [];
  private readonly positions = new Float32Array(MAX_PARTICLES * 3);
  private readonly colors = new Float32Array(MAX_PARTICLES * 3);
  private readonly particleGeometry = new THREE.BufferGeometry();
  private readonly particleMaterial = new THREE.PointsMaterial({
    size: 0.035,
    transparent: true,
    opacity: 0.96,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  private readonly landmarkGeometry = new THREE.BufferGeometry();
  private readonly landmarkMaterial = new THREE.LineBasicMaterial({
    color: "#e9fff8",
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
  });
  private readonly rings: THREE.Mesh[] = [];
  private readonly spellSprites: SpellSprite[] = [];
  private readonly textures: Record<string, THREE.Texture>;
  private readonly animatedTextures: Record<string, THREE.Texture[]>;
  private readonly handLines: THREE.LineSegments;
  private readonly sparks: THREE.Points;
  private width = 1;
  private height = 1;
  private aspect = 1;
  private mirrored = true;
  private readonly previousGestures = new Map<string, MagicGesture>();
  private readonly lastFocuses = new Map<string, THREE.Vector3>();
  private readonly previousFocuses = new Map<string, THREE.Vector3>();

  constructor(container: HTMLElement) {
    const loader = new THREE.TextureLoader();
    this.textures = {
      circle: loader.load(`${KENNEY_ROOT}/circle_03.png`),
      magicA: loader.load(`${KENNEY_ROOT}/magic_01.png`),
      magicB: loader.load(`${KENNEY_ROOT}/magic_02.png`),
      magicC: loader.load(`${KENNEY_ROOT}/magic_03.png`),
      magicD: loader.load(`${KENNEY_ROOT}/magic_05.png`),
      spark: loader.load(`${KENNEY_ROOT}/spark_02.png`),
      star: loader.load(`${KENNEY_ROOT}/star_03.png`),
      trace: loader.load(`${KENNEY_ROOT}/trace_04.png`),
      twirl: loader.load(`${KENNEY_ROOT}/twirl_02.png`),
    };
    this.animatedTextures = {
      energyBall: loadSequence(
        loader,
        `${OGA_ROOT}/energy-ball/aura_test_1_32_`,
        32,
      ),
      lightningBall: loadSequence(
        loader,
        `${OGA_ROOT}/lightning-ball/lighteningball_1_20_`,
        20,
      ),
      signOfFire: loadSequence(
        loader,
        `${OGA_ROOT}/sign-of-fire/spell_signoffire_`,
        20,
      ),
    };

    for (const texture of [
      ...Object.values(this.textures),
      ...Object.values(this.animatedTextures).flat(),
    ]) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.renderer.domElement.className = "absolute inset-0 h-full w-full";

    this.particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(this.colors, 3),
    );
    this.sparks = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.sparks);

    this.handLines = new THREE.LineSegments(
      this.landmarkGeometry,
      this.landmarkMaterial,
    );
    this.scene.add(this.handLines);

    this.resize();
  }

  resize() {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) {
      return;
    }

    const rect = parent.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.aspect = this.width / this.height;
    this.camera.left = -this.aspect;
    this.camera.right = this.aspect;
    this.camera.top = 1;
    this.camera.bottom = -1;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
  }

  setMirrored(mirrored: boolean) {
    this.mirrored = mirrored;
  }

  update(frames: GestureFrame[]) {
    const delta = Math.min(0.033, this.clock.getDelta());

    if (frames.length > 0) {
      this.updateHandLines(frames);
    } else {
      this.landmarkGeometry.setDrawRange(0, 0);
    }

    for (const frame of frames) {
      const focus = this.toScenePoint(frame.focus);
      const lastFocus =
        this.lastFocuses.get(frame.handKey) ?? new THREE.Vector3().copy(focus);
      const previousFocus =
        this.previousFocuses.get(frame.handKey) ?? new THREE.Vector3().copy(focus);
      previousFocus.copy(lastFocus);
      lastFocus.lerp(focus, 0.58);
      this.previousFocuses.set(frame.handKey, previousFocus);
      this.lastFocuses.set(frame.handKey, lastFocus);
      this.emitForGesture(frame.gesture, lastFocus, frame.confidence, previousFocus);

      const previousGesture = this.previousGestures.get(frame.handKey) ?? "idle";
      if (frame.gesture !== previousGesture) {
        this.handleGestureStart(frame.gesture, lastFocus);
      }
      this.previousGestures.set(frame.handKey, frame.gesture);
    }

    this.updateParticles(delta);
    this.updateSprites(delta);
    this.updateRings(delta);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.landmarkGeometry.dispose();
    this.landmarkMaterial.dispose();
    for (const ring of this.rings) {
      ring.geometry.dispose();
      if (Array.isArray(ring.material)) {
        ring.material.forEach((material) => material.dispose());
      } else {
        ring.material.dispose();
      }
    }
    for (const spellSprite of this.spellSprites) {
      this.scene.remove(spellSprite.sprite);
      spellSprite.sprite.material.dispose();
    }
    for (const texture of Object.values(this.textures)) {
      texture.dispose();
    }
    for (const texture of Object.values(this.animatedTextures).flat()) {
      texture.dispose();
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private toScenePoint(point: Pick<NormalizedLandmark, "x" | "y" | "z">) {
    return new THREE.Vector3(
      (this.mirrored ? 0.5 - point.x : point.x - 0.5) * this.aspect * 2,
      (0.5 - point.y) * 2,
      -Math.min(1, Math.max(-1, point.z ?? 0)) * 0.35,
    );
  }

  private updateHandLines(frames: GestureFrame[]) {
    const vertices = new Float32Array(
      frames.length * LANDMARK_CONNECTIONS.length * 2 * 3,
    );
    let offset = 0;

    for (const frame of frames) {
      for (const [from, to] of LANDMARK_CONNECTIONS) {
        const a = this.toScenePoint(frame.landmarks[from]);
        const b = this.toScenePoint(frame.landmarks[to]);
        vertices[offset++] = a.x;
        vertices[offset++] = a.y;
        vertices[offset++] = a.z;
        vertices[offset++] = b.x;
        vertices[offset++] = b.y;
        vertices[offset++] = b.z;
      }
    }

    this.landmarkGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3),
    );
    this.landmarkGeometry.setDrawRange(0, frames.length * LANDMARK_CONNECTIONS.length * 2);
  }

  private emitForGesture(
    gesture: MagicGesture,
    focus: THREE.Vector3,
    confidence: number,
    previousFocus: THREE.Vector3,
  ) {
    const color = new THREE.Color(GESTURE_COLORS[gesture]);

    if (gesture === "idle") {
      this.emit(focus, color, 2, 0.25, 0.55);
      return;
    }

    if (gesture === "pinch") {
      this.emit(focus, color, 9, 0.1, 0.9 + confidence * 0.5);
      this.addSprite("spark", focus, color, 0.12, 0.28, 0.28);
      return;
    }

    if (gesture === "point") {
      const direction = focus.clone().sub(previousFocus).multiplyScalar(8);
      this.emit(focus, color, 12, 0.18, 0.8, direction);
      this.addSprite("trace", focus, color, 0.18, 0.22, 0.2, direction);
      return;
    }

    if (gesture === "open-palm") {
      this.emit(focus, color, 5, 0.22, 0.7);
      return;
    }

    this.emit(focus, color, 14, 0.2, 0.95);
  }

  private handleGestureStart(gesture: MagicGesture, focus: THREE.Vector3) {
    if (gesture === "idle") {
      return;
    }

    const color = new THREE.Color(GESTURE_COLORS[gesture]);

    if (gesture === "open-palm") {
      this.emit(focus, color, 90, 0.75, 1.15);
      this.addRing(focus, color, 0.18, 1.65, 0.8);
      this.addSprite("magicD", focus, color, 0.55, 1.05, 0.72);
      this.addSprite("star", focus, new THREE.Color("#ffffff"), 0.38, 0.65, 0.5);
      this.addAnimatedSprite(
        "signOfFire",
        focus,
        new THREE.Color("#ffd36e"),
        0.9,
        0.42,
        0.75,
      );
      return;
    }

    if (gesture === "circle") {
      this.emit(focus, color, 120, 0.55, 1.3);
      this.addRing(focus, color, 0.28, 1.25, 1.15);
      this.addRing(focus, new THREE.Color("#8affb8"), 0.42, 1.8, 1.0);
      this.addSprite("circle", focus, color, 0.82, 1.4, 1.1);
      this.addSprite("twirl", focus, new THREE.Color("#8affb8"), 0.65, 1.1, 0.95);
      this.addAnimatedSprite(
        "lightningBall",
        focus,
        new THREE.Color("#bd9dff"),
        1.1,
        0.35,
        0.65,
      );
      return;
    }

    this.addRing(focus, color, 0.12, 0.52, 0.45);
    if (gesture === "pinch") {
      this.addAnimatedSprite(
        "energyBall",
        focus,
        new THREE.Color("#ffffff"),
        0.62,
        0.18,
        0.56,
      );
    }
    this.addSprite(
      gesture === "pinch" ? "magicB" : "magicA",
      focus,
      color,
      0.28,
      0.58,
      0.42,
    );
  }

  private emit(
    origin: THREE.Vector3,
    color: THREE.Color,
    count: number,
    speed: number,
    life: number,
    boost = new THREE.Vector3(),
  ) {
    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * speed;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (Math.random() - 0.5) * speed * 0.5,
      ).add(boost);

      this.particles.push({
        position: origin
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.04,
              (Math.random() - 0.5) * 0.04,
              0,
            ),
          ),
        velocity,
        color: color.clone().offsetHSL((Math.random() - 0.5) * 0.08, 0, 0),
        life: life * (0.7 + Math.random() * 0.6),
        maxLife: life,
      });
    }
  }

  private updateParticles(delta: number) {
    let drawCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= delta;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      particle.velocity.multiplyScalar(0.985);
      particle.position.addScaledVector(particle.velocity, delta);
      const alpha = Math.max(0, particle.life / particle.maxLife);
      const slot = drawCount * 3;
      this.positions[slot] = particle.position.x;
      this.positions[slot + 1] = particle.position.y;
      this.positions[slot + 2] = particle.position.z;
      this.colors[slot] = particle.color.r * alpha;
      this.colors[slot + 1] = particle.color.g * alpha;
      this.colors[slot + 2] = particle.color.b * alpha;
      drawCount += 1;
    }

    this.particleGeometry.setDrawRange(0, drawCount);
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
  }

  private addSprite(
    textureKey: keyof MagicScene["textures"],
    center: THREE.Vector3,
    color: THREE.Color,
    size: number,
    growth: number,
    life: number,
    velocity = new THREE.Vector3(),
  ) {
    if (this.spellSprites.length > 90) {
      const oldest = this.spellSprites.shift();
      if (oldest) {
        this.scene.remove(oldest.sprite);
        oldest.sprite.material.dispose();
      }
    }

    const material = new THREE.SpriteMaterial({
      map: this.textures[textureKey],
      color,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      rotation: Math.random() * Math.PI * 2,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(center);
    sprite.scale.setScalar(size);
    this.scene.add(sprite);
    this.spellSprites.push({
      sprite,
      frameRate: 0,
      velocity: velocity.clone().multiplyScalar(0.16),
      life,
      maxLife: life,
      growth,
      spin: (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 2.2),
    });
  }

  private addAnimatedSprite(
    textureKey: keyof MagicScene["animatedTextures"],
    center: THREE.Vector3,
    color: THREE.Color,
    size: number,
    growth: number,
    life: number,
    velocity = new THREE.Vector3(),
  ) {
    const frames = this.animatedTextures[textureKey];
    const material = new THREE.SpriteMaterial({
      map: frames[0],
      color,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      rotation: Math.random() * Math.PI * 2,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(center);
    sprite.scale.setScalar(size);
    this.scene.add(sprite);
    this.spellSprites.push({
      sprite,
      frames,
      frameRate: frames.length / life,
      velocity: velocity.clone().multiplyScalar(0.1),
      life,
      maxLife: life,
      growth,
      spin: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.2),
    });
  }

  private updateSprites(delta: number) {
    for (let i = this.spellSprites.length - 1; i >= 0; i -= 1) {
      const spellSprite = this.spellSprites[i];
      spellSprite.life -= delta;

      const progress = 1 - Math.max(0, spellSprite.life / spellSprite.maxLife);
      const alpha = Math.sin(Math.max(0, 1 - progress) * Math.PI * 0.5);
      const material = spellSprite.sprite.material;
      if (spellSprite.frames) {
        const frameIndex = Math.min(
          spellSprite.frames.length - 1,
          Math.floor(progress * spellSprite.frames.length),
        );
        material.map = spellSprite.frames[frameIndex];
      }
      material.opacity = alpha * 0.9;
      material.rotation += spellSprite.spin * delta;
      spellSprite.sprite.position.addScaledVector(spellSprite.velocity, delta);
      spellSprite.sprite.scale.addScalar(spellSprite.growth * delta);

      if (spellSprite.life <= 0) {
        this.scene.remove(spellSprite.sprite);
        material.dispose();
        this.spellSprites.splice(i, 1);
      }
    }
  }

  private addRing(
    center: THREE.Vector3,
    color: THREE.Color,
    radius: number,
    scaleSpeed: number,
    life: number,
  ) {
    const geometry = new THREE.TorusGeometry(radius, 0.012, 10, 96);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(center);
    ring.userData.life = life;
    ring.userData.maxLife = life;
    ring.userData.scaleSpeed = scaleSpeed;
    ring.rotation.z = Math.random() * Math.PI;
    this.rings.push(ring);
    this.scene.add(ring);
  }

  private updateRings(delta: number) {
    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      const ring = this.rings[i];
      ring.userData.life -= delta;
      ring.scale.addScalar(ring.userData.scaleSpeed * delta);
      ring.rotation.z += delta * 1.4;

      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, ring.userData.life / ring.userData.maxLife);

      if (ring.userData.life <= 0) {
        this.scene.remove(ring);
        ring.geometry.dispose();
        material.dispose();
        this.rings.splice(i, 1);
      }
    }
  }
}
