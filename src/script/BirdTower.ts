// ./src/script/BirdTower.ts

import type { MacroContext, MacroDefinition } from 'twine-sugarcube';

/** 原版段落只注入短 widget 调用，玩法逻辑由高塔模块处理。 */
export default function BirdTowerScript(maplebirch: typeof window.maplebirch): void {
  // 补丁随模块启用；长叙事放在对应的 Twee widget 中。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Bird': [
        {
          srcmatch: /!\$daily\.birdBabyFeed/g,
          to: "maplebirch.get('BirdTower').hungry.length > 0",
          expected: 3
        },
        {
          srcmatch: /<<set \$daily\.birdBabyFeed to true>>/g,
          to: '',
          expected: 3
        },
        {
          srcmatch: /Bird Tower Hunt End Children\]\]>><<set \$bird\.materials\.lurkers -=1>>/g,
          to: 'Deadwood BirdTower Hunt End Food]]>>',
          expected: 2
        },
        {
          src: '<<set $childRecords[_childrenEating[$_cc]].development.activity to "lurkerEat">>',
          applybefore: '<<set $childRecords[_childrenEating[$_cc]].development.fed_daily++>>',
          expected: 1
        },
        {
          src: '<<if $_lurkerLoot gte 1>>',
          applybefore: '<<deadwood-birdtower-hunt-loot $_lurkerLoot>><<set $_lurkerLoot -= _birdtower_fed>>\n',
          expected: 1
        },
        {
          src: '<<case "nest">>',
          applybefore: '<<case "otherNest">><<deadwood-birdtower-nest-upgrade $_upgrade>>\n',
          expected: 1
        }
      ],
      'Widgets children': [
        {
          src: '<<case "lurkerEat">>',
          applybefore:
            '<<case "beg" "GreatHawk" "weather" "GoldRing" "Fledgling_fly" "explore" "Fledgling_preen" "Fledgling_perch" "Subadult_fly" "Subadult_preen" "Subadult_perch" "rest" "hunting">><<deadwood-birdtower-child-activity _args[0]>>\n',
          expected: 1
        },
        {
          src: '<<if $childRecords[_args[0]].development.interactionsTotal>>',
          applybefore: '<<deadwood-birdtower-child-feeding _args[0]>>\n',
          expected: 1
        },
        {
          src: '<<widget "hawkChildActivity">>\n\t<span class="no-numberify">',
          applyafter: '<<deadwood-birdtower-child-growth _args[0]>>',
          expected: 1
        }
      ]
    },
    locationPassage: {
      'Bird Tower Build': [
        {
          src: '<<towerBuildOption nest>>',
          applyafter: '<<if $BirdTower.nest.hinted>><<towerBuildOption otherNest>><</if>>',
          expected: 1
        },
        {
          src: '<<effects>>',
          applyafter: '<<deadwood-birdtower-nest-growth>>',
          expected: 1
        }
      ],
      'Childrens Home': [
        {
          src: '<<childrenEvents $location $passage>>',
          to: '<<if $location is "tower">><<babyhawkEvents $location $passage>><<else>><<childrenEvents $location $passage>><</if>>',
          expected: 1
        }
      ],
      'Children Activity Events': [
        {
          srcmatch: /<<link \[\[[^\]\r\n]*\|Childrens Home\]\]>><<unset \$childActivityEvent>><<endevent>><<\/link>>/,
          to: '<<deadwood-birdtower-activity-return>>',
          expected: 1
        }
      ],
      'Bird Tower': [
        {
          src: '<<if $bird.clean gte 100>>',
          applybefore: '<<deadwood-birdtower-nest-link>>',
          expected: 1
        },
        {
          src: '<<bird_schedule>>',
          applyafter: '<<deadwood-birdtower-fledgling>>',
          expected: 1
        }
      ],
      'Bird Hunt Start Alone': [
        {
          src: '<<effects>>',
          applyafter: '<<deadwood-birdtower-hunt-invitation>>',
          expected: 1
        }
      ],
      Moor: [
        {
          src: '<<elseif $eventskip is 0>>',
          applyafter: '<<deadwood-birdtower-moor-event>>',
          expected: 1
        }
      ],
      'Bird Tower Rainwater Pool': [
        {
          src: '<<if $bird.activity is "bathe" and $bird.state is "home">>',
          applyafter: '<<deadwood-birdtower-pool-link>>',
          expected: 1
        }
      ],
      'Bird Hunt Event': [
        {
          src: '<<if Weather.bloodMoon>>',
          applybefore: '<<deadwood-birdtower-hunt-trespasser>>',
          expected: 1
        }
      ],
      'Bird Tower Perch': [
        {
          src: '<<birdEggLayEvent "perch">>',
          applyafter:
            '\n<<elseif maplebirch.get("BirdTower").at("tower").some(child => child.development.grow_hint_subadult is 1) and $bird.state is "home" and ["groom","sing"].includes($bird.activity) and Weather.precipitation isnot "rain">>\n<<deadwood-birdtower-first-flight>>\n',
          expected: 1
        }
      ],
      'Bird Tower Hunt Ask': [
        {
          src: '<<if $bird.hunts.unlocked is false>>',
          applybefore: '<<deadwood-birdtower-first-hunt>>',
          expected: 1
        }
      ],
      'Bird Hunt Ambush Point': [
        {
          src: '<<effects>>',
          applyafter: '<<deadwood-birdtower-hunt-ambush>>',
          expected: 1
        }
      ],
      'Bird Tower Great Hawk Egg Laying Hunt Finish': [
        {
          // 先让同行鹰崽分食原版战利品，再清空这次队伍。
          src: '<<flight_hunt_loot>>\n<</if>>',
          applyafter: '\n<<HuntTogetherClean>>',
          expected: 1
        }
      ]
    }
  });

  maplebirch.tool.addTo('Options', 'BabyhawkTestFunc');

  // 玩法成就由框架初始化。
  maplebirch.tool.onInit(() => {
    const original = maplebirch.SugarCube.Macro.get('updateChildActivity') as MacroDefinition | undefined;
    if (original) {
      // 鹰崽使用扩展活动，其它孩子仍由原版宏处理。
      maplebirch.tool.macro.define('updateChildActivity', function (childId: number) {
        const bird = maplebirch.get('BirdTower');
        const child = V.childRecords[childId];
        if (!bird || child?.species !== 'hawk' || !childIsBorn(child)) return original.handler.call(this as unknown as MacroContext);
        bird.activity(childId);
      });
    }
  });
}
