import { ADOU_BOSS_DEFS } from "./battle-rules";
import {
  damageAdou,
  type AdouBattleEvent,
  type AdouBattleState,
  type AdouEnemy,
} from "./battle-state";
import { planAdouBossSkill, type AdouBossSkillPlan } from "./boss-skills";

export type AdouEnemyUpdateEvent =
  | AdouBattleEvent
  | { type: "enemy-escaped"; enemy: AdouEnemy }
  | { type: "boss-skill"; enemy: AdouEnemy; plan: AdouBossSkillPlan };

const ADOU_ENEMY_PROGRESS_SPEED_SCALE = 0.01;

function tickAdouEnemyTimers(enemy: AdouEnemy, dt: number): AdouEnemy {
  return {
    ...enemy,
    stunTimer: Math.max(0, enemy.stunTimer - dt),
    burnTimer: Math.max(0, enemy.burnTimer - dt),
    skillTimer: enemy.skillTimer - dt,
  };
}

function moveAdouEnemy(state: AdouBattleState, enemy: AdouEnemy, dt: number): AdouEnemy {
  const runtime = state.sides[enemy.targetSide];
  if (enemy.stunTimer > 0) return enemy;
  const inkSlow = runtime.enemySlowTimer > 0 ? 0.42 : 1;
  return {
    ...enemy,
    progress:
      enemy.progress +
      enemy.speed *
        ADOU_ENEMY_PROGRESS_SPEED_SCALE *
        enemy.speedMultiplier *
        runtime.enemyMoveMultiplier *
        inkSlow *
        dt,
  };
}

export function updateAdouEnemies(
  state: AdouBattleState,
  dt: number,
  rng: () => number = Math.random,
) {
  const events: AdouEnemyUpdateEvent[] = [];
  const nextEnemies: AdouEnemy[] = [];

  for (const rawEnemy of state.enemies) {
    let enemy = tickAdouEnemyTimers(rawEnemy, dt);

    if (enemy.bossId !== undefined && enemy.skillTimer <= 0) {
      const plan = planAdouBossSkill(state, enemy, rng);
      if (plan) events.push({ type: "boss-skill", enemy, plan });
      enemy = {
        ...enemy,
        skillTimer: ADOU_BOSS_DEFS[enemy.bossId]?.cooldownSeconds ?? 8,
      };
    }

    enemy = moveAdouEnemy(state, enemy, dt);
    const routeEnd = state.map.routes[enemy.targetSide].length - 1;
    if (enemy.progress >= routeEnd) {
      events.push({ type: "enemy-escaped", enemy });
      events.push(damageAdou(state, enemy.targetSide, enemy.damage));
      continue;
    }

    nextEnemies.push(enemy);
  }

  state.enemies = nextEnemies;
  return events;
}
