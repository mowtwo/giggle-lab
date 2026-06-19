export type OriginalAssetHandle = {
  path: string;
  native?: unknown;
};

export type OriginalTweenTarget = Record<string, unknown>;

export type OriginalTweenSpec = {
  to: Record<string, number>;
  durationMs: number;
  delayMs?: number;
  ease?: string;
};

export type OriginalRuntimePorts = {
  assets: {
    resolve(path: string): string;
    load(paths: string[]): Promise<Map<string, OriginalAssetHandle>>;
    has(path: string): boolean;
  };
  audio: {
    playSound(name: string): void;
    playMusic(name: string, loop?: boolean): void;
    stopMusic(): void;
  };
  animation: {
    tween(target: OriginalTweenTarget, spec: OriginalTweenSpec): Promise<void>;
    playFrames(target: OriginalTweenTarget, frames: string[], frameMs: number, loop?: boolean): () => void;
    playSpine(target: OriginalTweenTarget, skeletonPath: string, animationName: string, loop?: boolean): void;
  };
  platform: {
    showTip(message: string): void;
    showRewardedAd(onSuccess: () => void, onFail?: () => void): void;
  };
};

export function createOriginalNullPorts(basePath = "/songjiang-duel/original/"): OriginalRuntimePorts {
  return {
    assets: {
      resolve: (path) => `${basePath}${path}`,
      load: async (paths) =>
        new Map(paths.map((path) => [path, { path: `${basePath}${path}` }])),
      has: () => false,
    },
    audio: {
      playSound: () => {},
      playMusic: () => {},
      stopMusic: () => {},
    },
    animation: {
      tween: async (target, spec) => {
        Object.assign(target, spec.to);
      },
      playFrames: () => () => {},
      playSpine: () => {},
    },
    platform: {
      showTip: () => {},
      showRewardedAd: (onSuccess) => onSuccess(),
    },
  };
}
