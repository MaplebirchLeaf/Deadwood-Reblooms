// ./src/script/VanillaPlus/Exhibitionism.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    // 原版地图移动直接调用 mapMove，不会执行 link_table 中的链接效果。
    if (window.mapMove.deadwoodPublicWalk) return;
    const originalMapMove = window.mapMove;
    window.mapMove = destination => {
      if (
        maplebirch.get('VanillaPlus')!.exhibitionism.canRoamTown &&
        V.map.available?.[V.passage]?.includes(destination) &&
        V.link_table.some((link: string) => link.includes('|' + destination + ']]'))
      ) {
        maplebirch.SugarCube.Wikifier.wikifyEval('<<exhibitionism6>><<fameexhibitionism 5>>');
      }
      originalMapMove(destination);
    };
    window.mapMove.deadwoodPublicWalk = true;
  });

  // 记录原版裸露挑战结果，并扩展暴露癖上限。
  maplebirch.tool.inject({
    locationPassage: {
      Orphanage: [
        // 仅扩展强制回卧室分支的裸露判断，保留原版及其他模组的后续条件。
        {
          src: '<<elseif $exposed gte 1',
          applyafter: ' and !maplebirch.get("VanillaPlus").exhibitionism.canRoamTown',
          expected: 1
        }
      ],
      Garden: [
        {
          src: '<<elseif $exposed gte 1',
          applyafter: ' and !maplebirch.get("VanillaPlus").exhibitionism.canRoamTown',
          expected: 1
        }
      ],
      'Temple Cloister': [
        // 约旦单独许可的内部通行，保留原版强制事件与职阶入口。
        {
          src: '<<elseif $exposed gte 1',
          applyafter: ' and !maplebirch.get("VanillaPlus").exhibitionism.canRoamTemple',
          expected: 1
        }
      ],
      'Temple Garden': [
        {
          src: '<<if $exposed gte 1',
          applyafter: ' and !maplebirch.get("VanillaPlus").exhibitionism.canRoamTemple',
          expected: 1
        }
      ],
      'Temple Quarters': [
        {
          src: '<<if $exposed gte 1',
          applyafter: ' and !maplebirch.get("VanillaPlus").exhibitionism.canRoamTemple',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widget displayLinks': [
        // 先扩充 link_table 再由原版 displayLinks 渲染，渲染后的链接区无法补做这一步。
        {
          src: '<<widget "displayLinks">>',
          applyafter: '\n\t<<deadwood-reblooms-public-walk-links>>',
          expected: 1
        }
      ],
      'Widgets Home': [
        {
          src: '<<if $exposed gte 1>>',
          to: '<<if maplebirch.get("VanillaPlus").exhibitionism.canRoamTown>>\n\t\t<<deadwood-reblooms-public-home-exit>>\n\t<<elseif $exposed gte 1>>',
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
          applybefore:
            '<<if $_n is 5 and $VanillaPlus.lock.exhibitionism and $exhibitionism gte maplebirch.get("VanillaPlus").normalCeiling("exhibitionism") and $exhibitionism lt maplebirch.get("VanillaPlus").ceiling("exhibitionism") and $desperateaction isnot 1 and $desperateaction isnot 2 and typeof $desperateaction isnot "string">>\n\t<<set $VanillaPlus.exhibitionism.levelFive to ($VanillaPlus.exhibitionism.levelFive || 0) + 1>>\n\t<<if $VanillaPlus.exhibitionism.levelFive gte 4>>\n\t\t<<set $VanillaPlus.exhibitionism.levelFive -= 4>>\n\t\t<<set $exhibitionism to Math.clamp($exhibitionism + 1, maplebirch.get("VanillaPlus").normalCeiling("exhibitionism"), maplebirch.get("VanillaPlus").ceiling("exhibitionism"))>>\n\t<</if>>\n<</if>>\n',
          expected: 1
        },
        // 只替换钳制表达式，使原版结算遵守突破后的上下限。
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: '<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.get("VanillaPlus").minimum(\'exhibitionism\'), $VanillaPlus.lock.exhibitionism ? maplebirch.get("VanillaPlus").ceiling("exhibitionism") : maplebirch.get("VanillaPlus").normalCeiling("exhibitionism"))>>',
          expected: 1
        }
      ],
      'Widgets Clamp': [
        // 替换全局暴露癖钳制公式，使其他来源的数值变化同样遵守突破边界。
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: '<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.get("VanillaPlus").minimum(\'exhibitionism\'), $VanillaPlus.lock.exhibitionism ? maplebirch.get("VanillaPlus").ceiling(\'exhibitionism\') : maplebirch.get("VanillaPlus").normalCeiling(\'exhibitionism\'))>>',
          expected: 1
        }
      ]
    }
  });
}
