// SoldierPool — weighted soldier/general draw pools.
//
// Faithful reconstruction of the original bundle's `v` class (game hub F.hh),
// reconstruction/reference/bundle.pretty.js lines ~627-961. Pure data: three
// 108-entry weighted pools of soldier types (刀/弓/枪/骑/铲) and general name
// chars, used when rolling a new unit. startGame/gameOver are empty in the
// bundle. The three pools (hh/eh/ah) are identical in the published data but are
// kept as separate fields to match the source exactly.

const POOL: string[] = [
  "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀", "刀",
  "刀", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓", "弓",
  "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "枪", "骑", "骑",
  "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "骑", "铲", "铲", "铲", "铲", "铲",
  "铲", "铲", "铲", "铲", "铲", "铲", "刘", "赵", "赵", "云", "关", "羽", "平", "兴", "马", "马", "超", "张", "张", "飞",
  "苞", "翼", "黄", "黄", "忠", "盖", "祖", "备",
];

export class SoldierPool {
  readonly hh: string[] = POOL.slice();
  readonly eh: string[] = POOL.slice();
  readonly ah: string[] = POOL.slice();

  startGame(): void {}
  gameOver(): void {}
}
