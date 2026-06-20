# Adou Laya — Reconstruction Class Map

> Source of truth: `vendor/original/game/js/bundle.js` (minified esbuild output).
> Beautified for reading at `reconstruction/reference/bundle.pretty.js` (~38.9k lines).
> **Rule:** behaviour is recovered from the bundle, never invented. Every rebuilt
> class MUST keep the exact `@regClass("<uuid>")` and the exact `_$var` field
> names used by the original `.ls`/`.lh`, so the original resources bind unchanged.

## How resources bind to code (verified)

- Each `scene/*.ls`, `dialog/*.lh`, `prefab/*.lh` carries a `_$runtime":"<uuid>"`.
- The **engine runtime** (`libs/laya.core.js`) owns `regClass` / `getClass` /
  `_classMap` and instantiates the `_$runtime` class when it loads the resource.
- In the bundle, classes are registered with `<Class> = r([<dec>("<uuid>")], <Class>)`
  where `r` is the esbuild `__decorateClass` helper and `<dec>` is the minified
  `regClass`. Fields are bound with the minified `@property` decorator.
- So: keep the resources as-is, register our rebuilt classes under the same UUIDs.

## Boot path (verified live)

`js/index.js` → `Laya.init` + `loadPackage` (resources/anim|music|sound|img) →
`startupScene: scene/LoadScene.ls` → LoadScene preloads → `MainScene.ls`.
M0 confirmed: MainScene renders with all original art; scene tree shows
`scene/MainScene.ls` instantiated and `resources/img/mainUI/bg1.png` bound.

## Registered classes (33) — UUID → minified class → identity

Line numbers are in `reconstruction/reference/bundle.pretty.js`.

### Scenes (11) — `scene/*.ls`
| Resource | UUID | min | line |
|---|---|---|---|
| LoadScene | nFCDlT3GRD-9N62vwVVE4Q | `to` | 34831 |
| LoadMaskScene | K7V1RL0SQeqnS0qn8GuwsA | `qr` | 34522 |
| MainScene | dKvUsPTsTBGGfiZxHMSqtg | `eo` | 35591 |
| MatchScene | dxhrI-d-T2icEkklUGt-kQ | `uo` | 36000 |
| BattleScene | a1VsRozfQfKce35jblVR3w | `Hr` | 33553 |
| GameOverScene | 36WnNn_bSKilkYpbnYn_9A | `jr` | 34490 |
| ShopScene | NsqY3ju_Tc-HfHc8t5EVgA | `bo` | 37337 |
| WeaponScene | 2W4HBomWSJ6oNhdw0SDA8A | `Ao` | 38577 |
| RankScene | z4oz-zSESq64GebLHKczEg | `Lo` | 36145 |
| SettingScene | 6DGqZNBLRhuPudJfulUNKw | `vo` | 36298 |
| AvatarSettingScene | B_zOi-00Tk29O7ykm753NA | `Fr` | 31644 |

### Dialogs (17) — `dialog/*.lh`
| Resource | UUID | min | line |
|---|---|---|---|
| AuthorizeDialog | 3eZSn-DMTuy8MOPQB13plA | `Et` | 8432 |
| BossTipDialog | 3PtiqZCFQj2dH_DSHFFblw | `ts` | 9162 |
| DeckDialog | zavuCnlJRrqJycITCILMqg | `Qa` | 25302 |
| DeletePropsTipDialog | 2xXyn9S9TgW7FJIlQLz9sA | `Ja` | 25324 |
| GetStaminaDialog | Jalv-8i7TNKXVIuvZLMTWA | `Gn` | 29944 |
| GMDialog | -qW2t8JqR0Kw45kO5UtX4w | `On` | 29809 |
| NewWeaponDialog | J_UH_VTZTxqrZGBtVTiZww | `zn` | 30129 |
| PauseDialog | XxMayroKT9Kz-_jp3ylB1w | `Nn` | 30260 |
| PrivacyPolicyDialog | dw3oSzA5R1aHXjnmpzT31A | `Qn` | 30358 |
| RankRewardDialog | E1wtzHmxTJG-Q8D_3rV0oA | `Jn` | 30414 |
| RecycleWeaponDialog | q5V7n3ojRiqC1NpUBDx5hQ | `nr` | 30638 |
| ReplacePropsTipDialog | z_0pDWBpS5eRL3Ag4IUahQ | `lr` | 30711 |
| ShareLpDialog | mbG6BPycS4q-Lgejps0EJQ | `pr` | 30732 |
| SidebarDialog | irtwUqZURnaRTWyZp6g4tw | `gr` | 30768 |
| TipDialog | CJKmj7QTRLij_2W9UGw0DQ | `mr` | 30817 |
| UnitInfoDialog | FO3V8791TVqW8hJVO95S4g | `_r` | 31203 |
| WeaponIntroDialog | HbyZPlGGQuCLkT5uT4N45g | `br` | 31227 |

### Prefab map backgrounds (3) — `prefab/mapBg*.lh`
| Resource | UUID | min | line |
|---|---|---|---|
| mapBg1 | I1X2DTP7QtuEKv4qk8ADig | `Ar` | 31265 |
| mapBg2 | wo_uSxbPRmu2BIwUD9qAEg | `Ir` | 31273 |
| mapBg3 | zTfXeYvTTjKXRZ9xkCRmsw | `Rr` | 31335 |

### Components (2)
| Identity | UUID | min | line | notes |
|---|---|---|---|---|
| self-rotation effect ("自转速度"/`rotateSpeed`) | K3e-0XdrRnGaQwVEqKxSSA | `Co` | 38924 | attached component |
| `ro` (result/printer helper) | yS9mPSRtQhKucXkb9gwQjQ | `ro` | 35642 | non-scene registered class |

## Prefabs WITHOUT a runtime class (data-only composites)

Loaded as plain node trees; the game manipulates their children by name (no
custom class to rebuild — but they MUST keep loading):

`attChangeTip, boss, crackEff, damageNum, generalEquipItem, goldUp, heart,
lotteryItem, loveHeart, lvlDownEff, lvlUpEff, maChaoPike, mapBg0, mapItem, mob,
rankItem, setSoldierEff, shopItem, shopPropsItem, shovelGrass, talkBox, trail,
treasure, weaponFragment, weaponSceneGeneralItem, weaponSceneWeaponItem`

## Non-class systems in the bundle (singletons / factories / data)

Identified from logs and string literals (to be detailed during reconstruction):
- Event bus singleton (`extends Laya.EventDispatcher`, `_instance`).
- `MathE` math helpers (distance, weightedRandom, angle, …).
- Weapon system: `WeaponFactory` + bullet classes (`SimpleDynamicArrow`,
  `SimpleHitAreaBullet`, `PikeBullet`, `KnifeBullet`) registered to a
  `BulletFactory`. Log: "武器注册文件已加载".
- Data tables: Map(54) (generals/units?), Map(44) (weapons), weapon-by-quality
  arrays; loaded from `data/weapon.json`, `data/weaponTxt.json`, `data/rank.json`.
- PlatMgr / load-flow ("启动主流程", "[LoadScene] startLoadFlow1/2",
  "[PlatMgr] runLoadScenePreloadTasks"). Platform glue is stubbed for static
  hosting by `js/adou-local-bootstrap.js` (XHR/fetch interception + h5api shim).

## Reconstruction order (Task #4)

1. LoadScene (`to`) + LoadMaskScene (`qr`) — boot + preload flow.
2. MainScene (`eo`) — navigation hub (start, bag, settings, rank, shop).
3. Core battle: BattleScene (`Hr`) + weapon/bullet system + mob/boss/effect
   prefabs + GameOverScene (`jr`).
4. Meta systems: WeaponScene (`Ao`), ShopScene (`bo`), RankScene (`Lo`),
   MatchScene (`uo`), Setting/AvatarSetting (`vo`/`Fr`).
5. Dialogs (17) as each owning scene needs them.

Each rebuilt class is swapped into the esbuild bundle incrementally and verified
against the running original before moving on.
