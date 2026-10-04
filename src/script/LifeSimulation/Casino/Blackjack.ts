// ./src/script/LifeSimulation/Casino/Blackjack.ts

import BlackjackView from './BlackjackView';

export default function Blackjack(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.inject({
    locationPassage: {
      Arcade: [{ src: '<<set _kylarLocation to getKylarLocation()>>', applybefore: '<<deadwood-blackjack-arcade-entry>>\n\t\t', expected: 1 }]
    }
  });

  maplebirch.tool.macro.defineS('deadwood-blackjack-table', () => {
    const game = maplebirch.get('LifeSimulation')?.casino.blackjack;
    if (!game) return;
    return new BlackjackView(maplebirch, game).root;
  });

  maplebirch.tool.onInit(() => {
    for (const name of ['Robin', 'Whitney', 'Kylar', 'Sydney']) {
      maplebirch.npc.Clothes.wardrobe.modify(name, clothes => maplebirch.get('LifeSimulation')?.casino.blackjack.clothes.apply(name, clothes));
    }
  });

  maplebirch.on(':passagestart', passage => {
    const game = maplebirch.get('LifeSimulation')?.casino.blackjack;
    if (game?.state.clothing && !['Deadwood Reblooms Life Simulation Blackjack', 'Deadwood Reblooms Life Simulation Blackjack Rules'].includes(passage.title)) game.leave();
  });
}
