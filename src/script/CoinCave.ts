export default function CoinCave(maplebirch: typeof window.maplebirch): void {
  // 古董原物采用借展，归还时由温特留下翻模，普通出售不接管任务金币。
  maplebirch.tool.inject({
    locationPassage: {
      'Island Explore': [{ src: '<<if $island.explore_count gte 100', applybefore: '<<deadwood-coin-cave-discover>><<if _coinDiscovered>><<exit>><</if>>\n', expected: 1 }],
      Island: [{ src: '<<islandicon "explore">>', applybefore: '<<deadwood-coin-cave-link>>\n', expected: 1 }],
      Museum: [{ src: '<<museumtalk>>', applybefore: '<<deadwood-coin-museum-link>>\n', expected: 1 }],
      'Pirate Return': [{ src: '<<effects>>', applyafter: '<<deadwood-coin-voyage-cancel>>', expected: 1 }],
      'Pirate Zephyr Island Ask': [{ src: '<<set $pirate_journey to 7>>', applybefore: '<<deadwood-coin-voyage-cancel>>', expected: 1 }],
      'Pirate Deck': [
        {
          srcmatch: /<<link \[\[([^\]|]+)\|Pirate End\]\]>>/,
          to: '<<link "$1" `V.MoreTransformations?.treasure?.voyage ? "Deadwood Coin Voyage Arrival" : "Pirate End"`>>',
          expected: 1
        }
      ]
    }
  });
  maplebirch.tool.addTo('Journal', 'deadwood-coin-journal');

  // 使用框架的 NPC 转化存档，渲染时覆盖肤色，解除后自然回到当次模型的原配色。
  maplebirch.npc.Transformation.add('Zephyr', 'undead', {
    levels: [1],
    type: 'undead',
    parts: {},
    sidebar(nnpc) {
      nnpc.skin_type = 'wraith';
      nnpc.tan = 0;
    }
  });
}
