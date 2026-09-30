// ./src/script/VanillaPlus/Deviancy.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Beyond the Mirror'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:feats:Beyond the Mirror:name');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:feats:Beyond the Mirror:text');
      },
      difficulty: 2,
      series: '',
      filter: ['All', 'General']
    };
  });

  maplebirch.tool.onInit(() => {
    setup.feats['Beyond Nature'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:deviancy:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:deviancy:feat:description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'deviancy-unlock', {
    output: 'deadwood-reblooms-deviancy-unlock',
    cond: () => V.VanillaPlus != null && maplebirch.VP.deviancy.unlock
  });
  maplebirch.dynamic.regStateEvent('append', 'deviancy-max', {
    output: 'earnFeat "Beyond Nature"',
    cond: () => V.feats?.currentSave['Beyond Nature'] === undefined && V.VanillaPlus != null && maplebirch.VP.deviancy.max
  });

  const discover = (mirror: 'home' | 'farm' | 'tower' | 'temple') => `<<run maplebirch.VP.deviancy.discover('${mirror}')>>`;

  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-reblooms-deviancy-mirror-exits', passage: 'Tentacle Plains' },
    { widget: 'deadwood-reblooms-deviancy-conduct-link', passage: 'Gwylan Ritual Select' }
  );
  // 诡异镜的“放逐”选项可能占据首位；入口始终紧邻原版“观察”选项。
  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: [0, 'deadwood-reblooms-deviancy-eerie-mirror-link 0'], passage: 'Eerie Mirror' },
    { widget: [1, 'deadwood-reblooms-deviancy-eerie-mirror-link 1'], passage: 'Eerie Mirror' }
  );

  // 记录镜面探索与仪式结算，并扩展异种癖上限。
  maplebirch.tool.inject({
    locationPassage: {
      Mirror: [
        // 在卧室普通镜子执行 effects 后记录 home 镜面发现状态，不影响原版镜子内容。
        { src: '<<effects>>', applyafter: discover('home'), expected: 1 }
      ],
      'Farm Mirror': [
        // 在农场镜子执行 effects 后记录 farm 镜面发现状态，供后续镜面通路判断。
        { src: '<<effects>>', applyafter: discover('farm'), expected: 1 },
        // 镜子菜单会局部重绘；链接区若插进菜单内部，会在重绘后消失。
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "farm">>\n', expected: 1 }
      ],
      'Bird Tower Mirror': [
        // 在鸟塔镜子执行 effects 后记录 tower 镜面发现状态，供跨镜移动判断。
        { src: '<<effects>>', applyafter: discover('tower'), expected: 1 },
        // 在原版 mirror 宏前插入鸟塔镜面进入链接，不替换鸟塔自身的镜子内容。
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "tower">>\n', expected: 1 }
      ],
      'Temple Mirror': [
        // 神殿床铺镜的原版 mirror 带显示文字，取共用前缀以兼容中英文原版。
        { src: '<<effects>>', applyafter: discover('temple'), expected: 1 },
        { src: '<<mirror ', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "temple">>\n', expected: 1 }
      ],
      'Eerie Mirror': [
        // 在诡异镜执行 effects 后同样记录 home 镜面，兼容卧室的两种镜子 Passage。
        { src: '<<effects>>', applyafter: discover('home'), expected: 1 }
      ]
    },
    widgetPassage: {
      Cheats: [
        // 将作弊面板的异种癖滑条上限按突破倍率计算，保留原版反向显示。
        {
          src: '$deviancy "deviancy" {reverse: true}',
          to: '$deviancy "deviancy" {max: $VanillaPlus.lock.deviancy ? maplebirch.VP.ceiling("deviancy") : maplebirch.VP.normalCeiling("deviancy"), reverse: true}',
          expected: 1
        }
      ],
      'Gwylan Ritual Sex Widgets': [
        // 在获得 Wildsong feat 后记录仪式完成标记，作为异种癖突破条件之一。
        {
          src: '<<earnFeat "Wildsong">>',
          applyafter: '<<set $VanillaPlus.deviancy.wildsong to true>>',
          expected: 1
        },
        // 在原版清除 $sexRitual 前提交仪式结果，避免状态被 unset 后无法判断过程。
        {
          src: '<<unset $sexRitual>>',
          applybefore: '<<run maplebirch.VP.deviancy.finish($sexRitual)>>',
          expected: 1
        }
      ],
      'Gwylan Hypnosis Widgets': [
        // “超越禁忌”只保证格威岚意志检定成功；需求计时与错过惩罚仍完全由原版处理。
        {
          src: '<<if !$hypnosis_traits.devotion or $hypnosis_traits.devotion lt $_level>>',
          to: '<<if $VanillaPlus.traits.deviancy or !$hypnosis_traits.devotion or $hypnosis_traits.devotion lt $_level>>',
          expected: 1
        }
      ],
      'Widgets Deviancy': [
        // 两处相同的阶段上限作为明确的批量替换，避免依赖补丁先后顺序。
        {
          srcmatchgroup: /<<set \$_scaledDeviancyMax to 20 \* \$_n>>/g,
          to: '<<set $_scaledDeviancyMax to $_n is 6 and $VanillaPlus.lock.deviancy ? maplebirch.VP.ceiling("deviancy") : 20 * $_n>>',
          expected: 2
        },
        // 非战斗的成长接在唯一的原版兴奋结算后，不匹配后续钳制语句。
        {
          src: '<<arousal `$_n * 100`>><<garousal>>',
          applyafter:
            "\n\t<<if $_n is 5 and $VanillaPlus.lock.deviancy and $deviancy gte maplebirch.VP.normalCeiling('deviancy') and $deviancy lt maplebirch.VP.ceiling('deviancy')>>\n\t\t<<set $VanillaPlus.deviancy.levelFive to ($VanillaPlus.deviancy.levelFive || 0) + 1>>\n\t\t<<if $VanillaPlus.deviancy.levelFive gte 4>>\n\t\t\t<<set $VanillaPlus.deviancy.levelFive -= 4>>\n\t\t\t<<set $deviancy to Math.clamp($deviancy + 1, maplebirch.VP.normalCeiling('deviancy'), maplebirch.VP.ceiling('deviancy'))>>\n\t\t<</if>>\n\t<</if>>",
          expected: 1
        },
        // 战斗成长插在唯一的耳液行为记录前，避免捕获外层 if 结尾。
        {
          src: '<<earSlimeSeenActions "deviancy" $_n 5>>',
          applybefore:
            "<<if $_n is 5 and $VanillaPlus.lock.deviancy and $deviancy gte maplebirch.VP.normalCeiling('deviancy') and $deviancy lt maplebirch.VP.ceiling('deviancy') and $consensual is 1>>\n\t\t<<set $VanillaPlus.deviancy.levelFive to ($VanillaPlus.deviancy.levelFive || 0) + 1>>\n\t\t<<if $VanillaPlus.deviancy.levelFive gte 4>>\n\t\t\t<<set $VanillaPlus.deviancy.levelFive -= 4>>\n\t\t\t<<set $deviancy to Math.clamp($deviancy + 1, maplebirch.VP.normalCeiling('deviancy'), maplebirch.VP.ceiling('deviancy'))>>\n\t\t<</if>>\n\t<</if>>\n\t",
          expected: 1
        },
        // 两处原版钳制语句内容完全相同，用最短表达式成组替换并锁定数量。
        {
          srcmatchgroup: /<<set \$deviancy to Math\.clamp\(\$deviancy, 0, 100\)>>/g,
          to: "<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? maplebirch.VP.ceiling('deviancy') : maplebirch.VP.normalCeiling('deviancy'))>>",
          expected: 2
        }
      ],
      'Widgets Clamp': [
        // 替换全局异种癖钳制公式，使非专用组件触发的数值变化也遵守突破边界。
        {
          src: '<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: "<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? maplebirch.VP.ceiling('deviancy') : maplebirch.VP.normalCeiling('deviancy'))>>",
          expected: 1
        }
      ]
    }
  });
}
