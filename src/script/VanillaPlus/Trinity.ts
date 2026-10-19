// ./src/script/VanillaPlus/Trinity.ts

export default function (maplebirch: typeof window.maplebirch) {
  const transformation = maplebirch.char.transformation as typeof maplebirch.char.transformation & TrinityTransformation;
  const active = () => maplebirch.get('VanillaPlus')?.divineTransformations.trinity === true && V.settings.transformDivineEnabled;

  transformation.hooks.change.add('deadwood-trinity', context => {
    if (active() && ['angel', 'fallen', 'demon'].includes(context.name) && context.change < 0) context.change = 0;
  });
  transformation.hooks.divine.add(
    'deadwood-trinity',
    context => {
      if (!active()) return;
      // 各形态每次只结算一次，沿用原版阶段、部件与提示。
      context.widget = undefined;
      if (V.angel > 0 || V.angelbuild >= 25) transformation.wikifier('angelTransform', V.angel);
      if (V.demon > 0 || V.demonbuild >= 5) transformation.wikifier('demonTransform', V.demon);
      if (V.fallenangel >= 2) transformation.wikifier('fallenButNotOut', V.fallenangel);
      V.specialTransform = V.angel > 0 || V.demon > 0 || V.fallenangel >= 2 ? 1 : 0;
    },
    100
  );

  let growth: { purity: number; angel: number; demon: number; fallen: number; fallenBuild: number } | undefined;
  transformation.hooks.update.add('deadwood-trinity-growth', stage => {
    if (stage !== 'before' || !growth) return;
    const snapshot = growth;
    growth = undefined;
    if (!active()) return;
    // 在原版阶段更新前补齐点数，达到门槛的当天即可成长。
    if (snapshot.purity >= 1000 && V.angelbuild <= snapshot.angel) transformation._transform('angel', 1);
    if (snapshot.purity <= 0 && snapshot.fallen >= 2 && V.demonbuild <= snapshot.demon) transformation._transform('demon', 1);
    // 不硬编码堕天使阶段上限；成长点数交给框架，扩展阶段仍由已加载的原版 widget 判定。
    if (snapshot.purity >= 900 && snapshot.fallen >= 2 && V.fallenbuild <= snapshot.fallenBuild) transformation._transform('fallen', 1);
  });

  maplebirch.once(':storyready', () => {
    const daily = window.dailyTransformationEffects;
    window.dailyTransformationEffects = () => {
      if (!active()) return daily();
      growth = { purity: V.purity, angel: V.angelbuild, demon: V.demonbuild, fallen: V.fallenangel, fallenBuild: V.fallenbuild };
      try {
        return daily();
      } finally {
        growth = undefined;
      }
    };
  });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Mirror': [
        {
          // 重复使用原版整张形态卡，保留每种部件的样式、颜色与隐藏选项。
          srcmatch: /<<if _divine>>(?=\s*<div @class="_animal)/,
          applybefore:
            '<<set _trinityDivine to _divine>>' +
            '<<for _divine range (maplebirch.get("VanillaPlus")?.divineTransformations.trinity ? ["angel", "fallenangel", "demon"].filter(name => V[name] > 1) : [_divine])>>',
          expected: 1
        },
        {
          src: '<<if $angel gt 1',
          applyafter: ' and _divine is "angel"',
          expected: 1
        },
        {
          src: '<<elseif $fallenangel gt 1',
          applyafter: ' and _divine is "fallenangel"',
          expected: 1
        },
        {
          src: '<<elseif $demon gt 1',
          applyafter: ' and _divine is "demon"',
          expected: 1
        },
        {
          src: '<<if _animal>>',
          applybefore: '<</for>><<set _divine to _trinityDivine>>',
          expected: 1
        }
      ],
      'Transformation Widgets': [
        {
          // 三位一体保留堕天使，不再由原版互斥分支强制替换成另一种形态。
          srcmatch: /(<<widget "(?:fallenDescend|fallenTransform)">>)([\s\S]*?)(<<\/widget>>)/g,
          to: '$1<<if not ($settings.transformDivineEnabled and maplebirch.get("VanillaPlus")?.divineTransformations.trinity)>>$2<</if>>$3',
          expected: 2
        },
        {
          src: '$specialTransform isnot 1>>',
          to: '($specialTransform isnot 1 or maplebirch.get("VanillaPlus")?.divineTransformations.trinity)>>',
          expected: 1
        }
      ]
    },
    locationPassage: {
      // 复用原版本次祈祷的 $rng。81–90 共十个结果，保留三种原版存在的区间。
      'Temple Prayer': [
        {
          src: '<<if $rng is 100 or $rng gte 91 and $worn.neck.name is "holy pendant">>',
          to:
            '<<if maplebirch.get("VanillaPlus").divineTransformations.canContact and $rng gte 81 and $rng lte 90>>' +
            '<<deadwood-trinity-contact>>' +
            '<<elseif $rng is 100 or $rng gte 91 and $worn.neck.name is "holy pendant">>' +
            '<<set $VanillaPlus.divineTransformations.prayer.holy to true>>',
          expected: 1
        },
        {
          src: '<<elseif $rng is 99 or $rng gte 91 and $worn.neck.name is "stone pendant">>',
          applyafter: '<<set $VanillaPlus.divineTransformations.prayer.stone to true>>',
          expected: 1
        },
        {
          src: '<<elseif $rng is 98 or $rng gte 91 and $worn.neck.name is "dark pendant">>',
          applyafter: '<<set $VanillaPlus.divineTransformations.prayer.dark to true>>',
          expected: 1
        }
      ]
    }
  });

  maplebirch.tool.patch.traits.add({
    title: 'Special Traits',
    name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:divineTransformations:trait:trinity:name'),
    colour: 'deadwood-trinity',
    has: () => maplebirch.get('VanillaPlus')!.divineTransformations.trinity,
    text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:divineTransformations:trait:trinity:text')
  });
}
