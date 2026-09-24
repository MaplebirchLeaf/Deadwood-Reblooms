// ./src/script/VanillaPlus/Exhibitionism.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Beyond Shame'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.exhibitionism.feat.title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.exhibitionism.feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'exhibitionism-unlock', {
    output: 'deadwood-reblooms-exhibitionism-unlock',
    cond: () => V.VanillaPlus != null && maplebirch.VP.exhibitionism.unlock
  });
  maplebirch.dynamic.regStateEvent('gate', 'exhibitionism-max', {
    output: 'earnFeat "Beyond Shame"',
    cond: () => V.VanillaPlus != null && maplebirch.VP.exhibitionism.max && !V.feats.currentSave['Beyond Shame']
  });

  // 记录原版裸露挑战结果，并扩展暴露癖上限。
  maplebirch.tool.zone.inject({
    locationPassage: {
      'Photo High Start': [
        // 在拍摄初始化后清空商业街裸奔临时标记，防止上一次拍摄结果污染新事件。
        {
          src: '<<photo_init>>',
          applyafter: '<<set $VanillaPlus.exhibitionism.highStreetRun to false>>'
        }
      ],
      'Swimming Lesson Naked Backstroke': [
        // 在裸泳阶段判断后记录累计次数达标结果，保留原版课程阶段控制。
        {
          src: '<<if $phase is 1>>',
          applyafter: '<<if $swimnudecounter gte 5>><<set $VanillaPlus.exhibitionism.swimming to true>><</if>>'
        }
      ],
      'Avery Party Dance Naked': [
        // 在原版授予 Ballroom Show-off feat 后记录宴会裸舞成就，作为突破条件。
        {
          src: '<<earnFeat "Ballroom Show-off">>',
          applyafter: '<<set $VanillaPlus.exhibitionism.ballroom to true>>'
        }
      ],
      'Photo High Exhibitionism Run Face': [
        // 在场景 effects 后按阶段与传单数记录成功裸奔，避免仅进入 Passage 就算完成。
        {
          src: '<<effects>>',
          applyafter: '<<if $phase is 2 and $photo_flyers gte 250>><<set $VanillaPlus.exhibitionism.highStreetRun to true>><</if>>'
        }
      ],
      'Photo High End Street': [
        // 在原版清理拍摄变量前把本次裸奔结果写入永久商业街标记。
        {
          src: '<<photo_unset>>',
          applybefore: '<<if $VanillaPlus.exhibitionism.highStreetRun>><<set $VanillaPlus.exhibitionism.highStreet to true>><</if>>'
        }
      ]
    },
    widgetPassage: {
      Cheats: [
        // 将作弊面板暴露癖滑条上限改为 100/150 动态值，保留原版反向显示。
        {
          src: '$exhibitionism "exhibitionism" {reverse: true}',
          to: '$exhibitionism "exhibitionism" {max: $VanillaPlus.lock.exhibitionism ? 150 : 100, reverse: true}'
        }
      ],
      'Widgets Exhibitionism': [
        // 在原版清除 desperateaction 前应用突破特质效果，确保仍能读取本次行动阶段。
        {
          src: '<<unset $desperateaction>>',
          applybefore: '<<deadwood-reblooms-exhibitionism-trait-effects $_n>>'
        },
        // 完整保留原版五级结算后，每四次非绝望行为折算一点六级进度，再应用突破后的 150 上限。
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: '<<if $_n is 5 and $VanillaPlus.lock.exhibitionism and $exhibitionism gte 100 and $exhibitionism lt 150 and $desperateaction isnot 1 and $desperateaction isnot 2 and typeof $desperateaction isnot "string">>\n\t<<set $VanillaPlus.exhibitionism.levelFiveProgress to ($VanillaPlus.exhibitionism.levelFiveProgress || 0) + 1>>\n\t<<if $VanillaPlus.exhibitionism.levelFiveProgress gte 4>>\n\t\t<<set $VanillaPlus.exhibitionism.levelFiveProgress -= 4>>\n\t\t<<set $exhibitionism to Math.clamp($exhibitionism + 1, 100, 150)>>\n\t<</if>>\n<</if>>\n<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.VP.minimum(\'exhibitionism\'), $VanillaPlus.lock.exhibitionism ? 150 : 100)>>',
          expected: 1
        }
      ],
      'Widgets Clamp': [
        // 替换全局暴露癖钳制公式，使其他来源的数值变化同样遵守突破边界。
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: "<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.VP.minimum('exhibitionism'), $VanillaPlus.lock.exhibitionism ? 150 : 100)>>"
        }
      ]
    }
  });
}
