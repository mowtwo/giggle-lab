import type { AdouSoundKey, AdouMusicKey } from "./assets";
import type { AdouPoint } from "./map";
import type { AdouCoreEvent } from "./reducer";

export type AdouFeedbackAnimationKind =
  | "adou-entry"
  | "adou-hurt"
  | "boss-entry"
  | "damage-number"
  | "dig"
  | "hand-refresh"
  | "heart"
  | "mantou-fly"
  | "merge"
  | "place-unit"
  | "skill"
  | "trap"
  | "unit-attack"
  | "unit-return"
  | "unit-upgrade";

export type AdouFeedbackCue = {
  sound?: AdouSoundKey;
  music?: AdouMusicKey;
  animation?: {
    kind: AdouFeedbackAnimationKind;
    point?: AdouPoint;
    asset?: string;
  };
  message?: string;
};

export function getAdouCoreEventFeedback(event: AdouCoreEvent): readonly AdouFeedbackCue[] {
  if (event.type === "phase") {
    if (event.phase === "spawning") return [{ sound: "match_drum", message: `第 ${event.round} 波` }];
    return [];
  }

  if (event.type === "enemy-spawned") {
    if (event.enemy.kind === "boss") {
      return [
        { sound: "boss_entrance", animation: { kind: "boss-entry", asset: "prefab/boss.lh" } },
      ];
    }
    return [];
  }

  if (event.type === "hand-refreshed") {
    return [{ sound: "soldier_buy_enable", animation: { kind: "hand-refresh" } }];
  }

  if (event.type === "hand-merged") {
    return [{ sound: "soldier_merge_upgrade", animation: { kind: "merge" } }];
  }

  if (event.type === "hand-card-created") {
    return [{ sound: "soldier_create", animation: { kind: "hand-refresh" } }];
  }

  if (event.type === "unit-placed") {
    return [
      {
        sound: "soldier_set",
        animation: {
          kind: "place-unit",
          point: { col: event.unit.col, row: event.unit.row },
          asset: "prefab/setSoldierEff.lh",
        },
      },
    ];
  }

  if (event.type === "unit-returned") {
    return [{ sound: "open_deck", animation: { kind: "unit-return" } }];
  }

  if (event.type === "unit-upgraded") {
    return [
      {
        sound: "soldier_merge_upgrade",
        animation: {
          kind: "unit-upgrade",
          point: { col: event.unit.col, row: event.unit.row },
          asset: "prefab/lvlUpEff.lh",
        },
      },
    ];
  }

  if (event.type === "unit-attack") {
    return [{ sound: event.visual.sound, animation: { kind: "unit-attack" } }];
  }

  if (event.type === "skill-used") {
    return [{ sound: event.plan.sound, animation: { kind: "skill" }, message: event.plan.message }];
  }

  if (event.type === "mantou") {
    return [
      {
        sound: "mantou_add",
        animation: {
          kind: "mantou-fly",
          point: event.point,
          asset: "prefab/goldUp.lh",
        },
      },
    ];
  }

  if (event.type === "trap-triggered") {
    return [{ sound: "trap_trigger", animation: { kind: "trap", asset: "prefab/trail.lh" } }];
  }

  if (event.type === "adou-damaged") {
    return [
      { sound: "adou_hit", animation: { kind: "adou-hurt" } },
      { animation: { kind: "heart", asset: "prefab/loveHeart.lh" }, message: `${event.hp}` },
    ];
  }

  if (event.type === "ended") {
    if (event.winner === "player") return [{ sound: "game_win", music: "bg_mainScene" }];
    if (event.winner === "ai") return [{ sound: "game_lose", music: "bg_mainScene" }];
    return [{ sound: "game_lose", music: "bg_mainScene" }];
  }

  if (event.type === "enemy-escaped") {
    return [{ sound: "danger_tip" }];
  }

  if (event.type === "boss-skill") {
    return [{ sound: event.plan.sound, animation: { kind: "skill" }, message: event.plan.message }];
  }

  if (event.type === "action-failed") {
    return [{ sound: "popup_notification", message: event.message }];
  }

  return [];
}

export function collectAdouCoreEventFeedback(
  events: readonly AdouCoreEvent[],
): readonly AdouFeedbackCue[] {
  return events.flatMap((event) => getAdouCoreEventFeedback(event));
}
