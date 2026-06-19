export type SongjiangAssetId =
  | "paperFrame"
  | "tileKit"
  | "songjiangTarget"
  | "propsSheet"
  | "bossSymbols";

export type SongjiangAssetEntry = {
  id: SongjiangAssetId;
  src: string;
  role: string;
};

export type SongjiangAssetManifest = {
  version: number;
  theme: string;
  assets: SongjiangAssetEntry[];
};

export const SONGJIANG_ASSET_MANIFEST_URL = "/songjiang-duel/assets.json";
export const SONGJIANG_ORIGINAL_ATLAS_MANIFEST_URL =
  "/songjiang-duel/original/atlases.generated.json";

export type OriginalAtlasFrame = {
  frameName: string;
  frame: {
    idx: number;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  sourceSize: {
    w: number;
    h: number;
  };
  spriteSourceSize: {
    x: number;
    y: number;
  };
};

export type OriginalAtlasEntry = {
  configPath: string;
  prefix: string;
  image: string;
  atlas: string;
  frameCount: number;
  frames: Record<string, OriginalAtlasFrame>;
};

export type SongjiangOriginalAtlasManifest = {
  generatedAt: string;
  sourceBase: string;
  atlases: OriginalAtlasEntry[];
  framePaths: string[];
};

export async function loadSongjiangAssetManifest() {
  const response = await fetch(SONGJIANG_ASSET_MANIFEST_URL);
  if (!response.ok) {
    throw new Error(`Unable to load Songjiang asset manifest: ${response.status}`);
  }
  return (await response.json()) as SongjiangAssetManifest;
}

export async function loadSongjiangOriginalAtlasManifest() {
  const response = await fetch(SONGJIANG_ORIGINAL_ATLAS_MANIFEST_URL);
  if (!response.ok) {
    throw new Error(`Unable to load Songjiang original atlas manifest: ${response.status}`);
  }
  return (await response.json()) as SongjiangOriginalAtlasManifest;
}
