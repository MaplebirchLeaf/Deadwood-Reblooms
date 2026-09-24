// ./src/script/VanillaPlus/Deviancy.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Beyond Nature'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.deviancy.feat.title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.deviancy.feat.description');
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
  maplebirch.dynamic.regStateEvent('gate', 'deviancy-max', {
    output: 'earnFeat "Beyond Nature"',
    cond: () => V.VanillaPlus != null && maplebirch.VP.deviancy.max && !V.feats.currentSave['Beyond Nature']
  });

  const discover = (mirror: 'home' | 'farm' | 'tower') => `<<run maplebirch.VP.deviancy.discover('${mirror}')>>`;

  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-reblooms-deviancy-mirror-exits', passage: 'Tentacle Plains' },
    { widget: 'deadwood-reblooms-deviancy-conduct-link', passage: 'Gwylan Ritual Select' }
  );

  // 记录镜面探索与仪式结算，并扩展异种癖上限。
  maplebirch.tool.zone.inject({
    locationPassage: {
      Mirror: [
        // 在卧室普通镜子执行 effects 后记录 home 镜面发现状态，不影响原版镜子内容。
        { src: '<<effects>>', applyafter: discover('home') }
      ],
      'Farm Mirror': [
        // 在农场镜子执行 effects 后记录 farm 镜面发现状态，供后续镜面通路判断。
        { src: '<<effects>>', applyafter: discover('farm') },
        // 在原版 mirror 宏前插入农场镜面进入链接，保留原版镜像渲染与其他选项。
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "farm">>\n' }
      ],
      'Bird Tower Mirror': [
        // 在鸟塔镜子执行 effects 后记录 tower 镜面发现状态，供跨镜移动判断。
        { src: '<<effects>>', applyafter: discover('tower') },
        // 在原版 mirror 宏前插入鸟塔镜面进入链接，不替换鸟塔自身的镜子内容。
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "tower">>\n' }
      ],
      'Eerie Mirror': [
        // 在诡异镜执行 effects 后同样记录 home 镜面，兼容卧室的两种镜子 Passage。
        { src: '<<effects>>', applyafter: discover('home') },
        // 在诡异镜原版标记图标前加入镜面进入链接，使入口位于原版操作列表中。
        {
          src: '<<crimeicon "mark">>',
          applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "home">>\n'
        }
      ]
    },
    widgetPassage: {
      Cheats: [
        // 将作弊面板的异种癖滑条上限改为 100/150 动态值，保留原版反向显示。
        {
          src: '$deviancy "deviancy" {reverse: true}',
          to: '$deviancy "deviancy" {max: $VanillaPlus.lock.deviancy ? 150 : 100, reverse: true}'
        }
      ],
      'Gwylan Ritual Sex Widgets': [
        // 在获得 Wildsong feat 后记录仪式完成标记，作为异种癖突破条件之一。
        {
          src: '<<earnFeat "Wildsong">>',
          applyafter: '<<set $VanillaPlus.deviancy.wildsong to true>>'
        },
        // 在原版清除 $sexRitual 前提交仪式结果，避免状态被 unset 后无法判断过程。
        {
          src: '<<unset $sexRitual>>',
          applybefore: '<<run maplebirch.VP.deviancy.finish($sexRitual)>>'
        }
      ],
      'Widgets Deviancy': [
        // 替换第一处阶段上限计算，使第六阶段在突破锁定后显示 150 上限。
        {
          src: '<<set $_scaledDeviancyMax to 20 * $_n>>',
          to: '<<set $_scaledDeviancyMax to $_n is 6 and $VanillaPlus.lock.deviancy ? 150 : 20 * $_n>>'
        },
        // 替换同组件第二处阶段上限计算，覆盖另一种异种癖增减显示路径。
        {
          src: '<<set $_scaledDeviancyMax to 20 * $_n>>',
          to: '<<set $_scaledDeviancyMax to $_n is 6 and $VanillaPlus.lock.deviancy ? 150 : 20 * $_n>>'
        },
        // 非战斗五级行为完整执行原版结算后，每四次折算一点六级进度，再应用突破后的 150 上限。
        {
          src: '<<arousal `$_n * 100`>><<garousal>>\n\t<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: "<<arousal `$_n * 100`>><<garousal>>\n\t<<if $_n is 5 and $VanillaPlus.lock.deviancy and $deviancy gte 100 and $deviancy lt 150>>\n\t\t<<set $VanillaPlus.deviancy.levelFiveProgress to ($VanillaPlus.deviancy.levelFiveProgress || 0) + 1>>\n\t\t<<if $VanillaPlus.deviancy.levelFiveProgress gte 4>>\n\t\t\t<<set $VanillaPlus.deviancy.levelFiveProgress -= 4>>\n\t\t\t<<set $deviancy to Math.clamp($deviancy + 1, 100, 150)>>\n\t\t<</if>>\n\t<</if>>\n\t<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? 150 : 100)>>",
          expected: 1
        },
        // 战斗五级行为保留原版结算；仅自愿行为按相同四比一比例折算六级进度。
        {
          src: '<<arousal `$_n * 100`>>\n\t<</if>>\n\t<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: "<<arousal `$_n * 100`>>\n\t<</if>>\n\t<<if $_n is 5 and $VanillaPlus.lock.deviancy and $deviancy gte 100 and $deviancy lt 150 and $consensual is 1>>\n\t\t<<set $VanillaPlus.deviancy.levelFiveProgress to ($VanillaPlus.deviancy.levelFiveProgress || 0) + 1>>\n\t\t<<if $VanillaPlus.deviancy.levelFiveProgress gte 4>>\n\t\t\t<<set $VanillaPlus.deviancy.levelFiveProgress -= 4>>\n\t\t\t<<set $deviancy to Math.clamp($deviancy + 1, 100, 150)>>\n\t\t<</if>>\n\t<</if>>\n\t<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? 150 : 100)>>",
          expected: 1
        }
      ],
      'Widgets Clamp': [
        // 替换全局异种癖钳制公式，使非专用组件触发的数值变化也遵守突破边界。
        {
          src: '<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: "<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? 150 : 100)>>"
        }
      ]
    }
  });
}
