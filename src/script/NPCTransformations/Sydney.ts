// ./src/script/NPCTransformations/Sydney.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type { MacroContext } from 'twine-sugarcube';

export default function Sydney(maplebirch: MaplebirchCore): void {
  const forms = {
    angel: { levels: [25, 30, 35, 40, 45, 50], parts: { angel_halo: 4, angel_wings: 6 } },
    fallen: { levels: [1, 21, 31], parts: { fallen_halo: 1, fallen_wings: 1 } },
    demon: { levels: [5, 10, 15, 20, 25, 30], max: 100, parts: { demon_horns: 2, demon_tail: 4, demon_wings: 6 } }
  } as const;

  for (const [form, config] of Object.entries(forms)) {
    maplebirch.npc.Transformation.add('Sydney', form, {
      ...config,
      type: form,
      // 保留原图配色，避免羽翼和光环被悉尼的发色染色。
      parts: Object.fromEntries(Object.entries(config.parts).map(([part, level]) => [part, { level, filter: {} }])),
      sidebar(nnpc, state) {
        const visible = !!maplebirch.get('NPCSidebarPortrait') && V.settings.transformDivineEnabled;
        for (const [part, level] of Object.entries(config.parts)) nnpc[`${part}_type`] = visible && state.level >= level ? 'default' : 'disabled';
        if (form === 'fallen' && visible && state.level >= 3) nnpc.fallen_wings_type = 'fallenplus';
        if (form !== 'demon' || !visible) return;
        const filter = {
          blend: ColourUtils.toHslString(window.Transformations.defaults.demon.colour),
          blendMode: 'hard-light',
          brightness: 0,
          contrast: 1,
          desaturate: false
        };
        for (const part of Object.keys(config.parts)) nnpc.tf_filters![part] = filter;
      }
    });
  }

  maplebirch.tool.inject({
    widgetPassage: {
      // 只在悉尼本人的完整收尾结算，不叠加公共高潮或场景刷新入口。
      'Widgets Ejaculation-SYDNEY': [{ src: '<</widget>>', applybefore: '\t<<if _args[0] isnot "short">><<deadwood-sydney-angelic>><</if>>\n', expected: 1 }],
      'Widgets Temple': [
        {
          // 共同行为在点击并完成祈祷后才结算，保留原版事件与时间优先级。
          src: '<<pass 60>><<set $phase to 2>>',
          applybefore: '<<set $_steadfast to _sydneyPray and $location is "temple", $_source to $passage, $_day to Math.floor(Time.date.timeStamp / TimeConstants.secondsPerDay)>>',
          expected: 1
        },
        {
          src: '<<pass 60>><<set $phase to 2>>',
          applyafter: '<<if $_steadfast and $passage is $_source and Math.floor(Time.date.timeStamp / TimeConstants.secondsPerDay) is $_day>><<deadwood-sydney-steadfast>><</if>>',
          expected: 1
        },
        { src: '<<lawareness>><<lstress>><<larousal>>', applyafter: '<<if _sydneyPray>><<deadwood-sydney-steadfast "hint">><</if>>', expected: 1 }
      ]
    }
  });

  maplebirch.once(':storyready', () => {
    const macros = maplebirch.SugarCube.Macro;
    for (const name of ['combatInseminate', 'npcPregnancyRoll'] as const) {
      const original = macros.get(name);
      if (!original) continue;
      macros.delete(name);
      macros.add(name, {
        ...original,
        handler(this: MacroContext) {
          if (V.consensual !== 1) return original.handler.call(this);
          const npc = name === 'combatInseminate' ? V.NPCList[this.args[0]] : undefined;
          const applies =
            name === 'combatInseminate'
              ? npc?.fullDescription === 'Sydney' && ['vagina', 'vaginadouble', 'anus', 'anusdouble'].includes(npc.penis)
              : this.args[0] === 'Sydney' && this.args[2] === 'pc' && (this.args[5] ?? 'deep') === 'deep';
          if (!applies || !maplebirch.get('NPCTransformations') || !V.settings.transformDivineEnabled || V.statFreeze || V.replayScene || C.npc.Sydney?.init !== 1 || C.npc.Sydney.state !== 'active')
            return original.handler.call(this);
          const demon = maplebirch.npc.Transformation.get('Sydney', 'demon');
          if (demon.level < 6 || demon.build < 90) return original.handler.call(this);
          // 临时复用双方自愿场景的原版标记；防护、开关及受孕资格仍由原处理器判断。
          const variables = name === 'combatInseminate' ? V : T;
          const overrides = name === 'combatInseminate' ? { vaginaaction: 'forceImpregnation', anusaction: 'forceImpregnation' } : { npcForceImpregnation: true };
          const previous = Object.keys(overrides).map(key => [key, Object.getOwnPropertyDescriptor(variables, key)] as const);
          try {
            Object.assign(variables, overrides);
            return original.handler.call(this);
          } finally {
            for (const [key, descriptor] of previous) {
              if (descriptor) Object.defineProperty(variables, key, descriptor);
              else delete variables[key];
            }
          }
        }
      });
    }
  });

  maplebirch.dynamic.regTimeEvent('onDay', 'sydney-divine', {
    exact: true,
    action({ prevDate, currentDate }) {
      // 框架跨多日只发一次事件，日范围交给 Twee 按当前人物状态结算。
      const seconds = TimeConstants.secondsPerDay;
      maplebirch.SugarCube.Wikifier.wikifyEval(`<<deadwood-sydney-divine ${Math.floor(prevDate!.timeStamp / seconds)} ${Math.floor(currentDate!.timeStamp / seconds)}>>`);
    }
  });
}
