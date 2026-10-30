// ./src/module/MoreTransformations/Undead.ts

import Transformation from './Transformation';
import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

class Undead extends Transformation {
  constructor() {
    super(
      'undead',
      'curse',
      {
        parts: [],
        build: 1,
        level: 1,
        update: [1],
        decay: false,
        suppress: false,
        message: {
          CN: { up: ['你的心跳停了下来，皮肤逐渐失去血色。'], down: ['你的胸口再次传来心跳，皮肤也恢复了血色。'] },
          EN: { up: ['Your heart stops beating, and the colour drains from your skin.'], down: ['Your heart beats again, and colour returns to your skin.'] }
        },
        pre: Undead.skin,
        translations: { undead: { EN: 'Undead', CN: '亡灵' } }
      },
      { pre: Undead.skin }
    );
  }

  public get active(): boolean {
    return (V.maplebirch?.transformation?.undead?.level ?? 0) > 0;
  }

  public arousal(amount: number): number {
    return this.active && amount > 0 ? amount * 0.25 : amount;
  }

  private static skin(options: CanvasModelOptionsData): void {
    if (!maplebirch.get('MoreTransformations')?.Undead.active || !options.filters) return;
    // 原版侧栏使用无透明度的怨灵肤色。晒痕槽同为皮肤滤镜，不改头发或衣物配色。
    const skin = setup.colours.getSkinFilter('wraith', 0);
    for (const slot of ['body', 'tan', 'breasts', 'penis', 'swimshorts', 'swimsuitTop', 'swimsuitBottom', 'bikiniTop', 'bikiniBottom']) {
      if (options.filters[slot]) options.filters[slot] = skin;
    }
  }

  protected override extend(core: MaplebirchCore): void {
    // 特写与透视使用独立模型，接入各自的 PC 皮肤层。
    core.char.use('pre', Undead.skin, name => name.startsWith('combatClose') || name.startsWith('combatXray'));

    core.tool.patch.traits.add(
      ...['undying', 'desire', 'restless', 'undead'].map(trait => ({
        title: 'Transformation Traits',
        name: () => core.t(`deadwood-reblooms:Traits:${trait}:name`),
        colour: 'silver',
        has: () => this.active,
        text: () => core.t(`deadwood-reblooms:Traits:${trait}:text`)
      }))
    );

    // 按实际耗时结算诅咒代价，短时行动与整夜睡眠共用一次时间回调。
    core.dynamic.regTimeEvent('onSec', 'deadwood-undead-curse', {
      cond: () => this.active,
      action: data => {
        V.pain = 0;
        const hours = (data.passed ?? 0) / 3600;
        core.get('Psyche')?.change(-2 * hours);
        window.statChange.stress(hours);
      }
    });
  }
}

export default Undead;
