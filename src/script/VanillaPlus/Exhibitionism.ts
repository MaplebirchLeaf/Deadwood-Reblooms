// ./src/script/VanillaPlus/Exhibitionism.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Beyond Shame'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:exhibitionism:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:exhibitionism:feat:description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };

    // 原版地图移动直接调用 mapMove，不会执行 link_table 中的链接效果。
    if (window.mapMove.deadwoodPublicWalk) return;
    const originalMapMove = window.mapMove;
    window.mapMove = destination => {
      if (maplebirch.VP.exhibitionism.canRoamTown && V.map.available?.[V.passage]?.includes(destination) && V.link_table.some((link: string) => link.includes('|' + destination + ']]'))) {
        Wikifier.wikifyEval('<<exhibitionism6>><<fameexhibitionism 5>>');
      }
      originalMapMove(destination);
    };
    window.mapMove.deadwoodPublicWalk = true;
  });

  maplebirch.dynamic.regStateEvent('gate', 'exhibitionism-unlock', {
    output: 'deadwood-reblooms-exhibitionism-unlock',
    cond: () => V.VanillaPlus != null && maplebirch.VP.exhibitionism.unlock
  });
  maplebirch.dynamic.regStateEvent('gate', 'exhibitionism-max', {
    output: 'earnFeat "Beyond Shame"',
    cond: () => V.VanillaPlus != null && maplebirch.VP.exhibitionism.max
  });

  // 记录原版裸露挑战结果，并扩展暴露癖上限。
  maplebirch.tool.inject({
    locationPassage: {
      Orphanage: [
        {
          // 仅扩展强制回卧室分支的裸露判断，保留原版及其他模组的后续条件。
          src: '<<elseif $exposed gte 1',
          to: '<<elseif $exposed gte 1 and !maplebirch.VP.exhibitionism.canRoamTown',
          expected: 1
        }
      ],
      Garden: [
        {
          src: '<<elseif $exposed gte 1',
          to: '<<elseif $exposed gte 1 and !maplebirch.VP.exhibitionism.canRoamTown',
          expected: 1
        }
      ],
      'Photo High Start': [
        // 在拍摄初始化后清空商业街裸奔临时标记，防止上一次拍摄结果污染新事件。
        {
          src: '<<photo_init>>',
          applyafter: '<<set $VanillaPlus.exhibitionism.highStreetRun to false>>',
          expected: 1
        }
      ],
      'Swimming Lesson Naked Backstroke': [
        // 在裸泳阶段判断后记录累计次数达标结果，保留原版课程阶段控制。
        {
          src: '<<if $phase is 1>>',
          applyafter: '<<if $swimnudecounter gte 5>><<set $VanillaPlus.exhibitionism.swimming to true>><</if>>',
          expected: 1
        }
      ],
      'Avery Party Dance Naked': [
        // 在原版授予 Ballroom Show-off feat 后记录宴会裸舞成就，作为突破条件。
        {
          src: '<<earnFeat "Ballroom Show-off">>',
          applyafter: '<<set $VanillaPlus.exhibitionism.ballroom to true>>',
          expected: 1
        }
      ],
      'Photo High Exhibitionism Run Face': [
        // 在场景 effects 后按阶段与传单数记录成功裸奔，避免仅进入 Passage 就算完成。
        {
          src: '<<effects>>',
          applyafter: '<<if $phase is 2 and $photo_flyers gte 250>><<set $VanillaPlus.exhibitionism.highStreetRun to true>><</if>>',
          expected: 1
        }
      ],
      'Photo High End Street': [
        // 在原版清理拍摄变量前把本次裸奔结果写入永久商业街标记。
        {
          src: '<<photo_unset>>',
          applybefore: '<<if $VanillaPlus.exhibitionism.highStreetRun>><<set $VanillaPlus.exhibitionism.highStreet to true>><</if>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widget displayLinks': [
        {
          // 先扩充 link_table 再由原版 displayLinks 渲染；渲染后的链接区无法补做这一步。
          src: '<<widget "displayLinks">>',
          applyafter: '\n\t<<deadwood-reblooms-public-walk-links>>',
          expected: 1
        }
      ],
      'Widgets Home': [
        {
          src: '<<if $exposed gte 1>>',
          to: '<<if maplebirch.VP.exhibitionism.canRoamTown>>\n\t\t<<deadwood-reblooms-public-home-exit>>\n\t<<elseif $exposed gte 1>>',
          expected: 1
        }
      ],
      Cheats: [
        // 将作弊面板暴露癖滑条上限按突破倍率计算，保留原版反向显示。
        {
          src: '$exhibitionism "exhibitionism" {reverse: true}',
          to: '$exhibitionism "exhibitionism" {max: $VanillaPlus.lock.exhibitionism ? maplebirch.VP.ceiling("exhibitionism") : maplebirch.VP.normalCeiling("exhibitionism"), reverse: true}',
          expected: 1
        }
      ],
      'Widgets Exhibitionism': [
        // 在原版清除 desperateaction 前应用突破特质效果，确保仍能读取本次行动阶段。
        {
          src: '<<unset $desperateaction>>',
          applybefore: '<<deadwood-reblooms-exhibitionism-trait-effects $_n>>',
          expected: 1
        },
        // 完整保留原版五级结算后，每四次非绝望行为折算一点六级进度，再应用倍率上限。
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: '<<if $_n is 5 and $VanillaPlus.lock.exhibitionism and $exhibitionism gte maplebirch.VP.normalCeiling("exhibitionism") and $exhibitionism lt maplebirch.VP.ceiling("exhibitionism") and $desperateaction isnot 1 and $desperateaction isnot 2 and typeof $desperateaction isnot "string">>\n\t<<set $VanillaPlus.exhibitionism.levelFive to ($VanillaPlus.exhibitionism.levelFive || 0) + 1>>\n\t<<if $VanillaPlus.exhibitionism.levelFive gte 4>>\n\t\t<<set $VanillaPlus.exhibitionism.levelFive -= 4>>\n\t\t<<set $exhibitionism to Math.clamp($exhibitionism + 1, maplebirch.VP.normalCeiling("exhibitionism"), maplebirch.VP.ceiling("exhibitionism"))>>\n\t<</if>>\n<</if>>\n<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.VP.minimum(\'exhibitionism\'), $VanillaPlus.lock.exhibitionism ? maplebirch.VP.ceiling("exhibitionism") : maplebirch.VP.normalCeiling("exhibitionism"))>>',
          expected: 1
        }
      ],
      'Widgets Clamp': [
        // 替换全局暴露癖钳制公式，使其他来源的数值变化同样遵守突破边界。
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: "<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.VP.minimum('exhibitionism'), $VanillaPlus.lock.exhibitionism ? maplebirch.VP.ceiling('exhibitionism') : maplebirch.VP.normalCeiling('exhibitionism'))>>",
          expected: 1
        }
      ]
    }
  });
}
