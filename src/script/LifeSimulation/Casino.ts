// ./src/script/LifeSimulation/Casino.ts

import SlotMachine from './Casino/SlotMachine';
import Blackjack from './Casino/Blackjack';
import { holdemView, threeCardView } from './Casino/PokerView';
import Marlow from './Casino/Marlow';

export default function Casino(maplebirch: typeof window.maplebirch): void {
  SlotMachine(maplebirch);
  Blackjack(maplebirch);
  const open = () => Time.hour >= 18 || Time.hour < 4;

  maplebirch.tool.inject({
    locationPassage: {
      'Connudatus Street': [{ src: '<<if $skulduggeryDintro is 1 and $exposed lte 0>>', applybefore: '<<deadwood-casino-street>>\n\t\t', expected: 1 }]
    }
  });

  maplebirch.tool.patch.location.configure(
    'deadwood_casino',
    {
      folder: 'casino',
      base: {
        default: { condition: () => open() && !Weather.isSnow && !Weather.lightsOn, image: 'base.png' },
        snow: { condition: () => open() && Weather.isSnow && !Weather.lightsOn, image: 'snow.png' },
        night: { condition: () => open() && !Weather.isSnow && Weather.lightsOn, image: 'base-night.png' },
        snowNight: { condition: () => open() && Weather.isSnow && Weather.lightsOn, image: 'snow-night.png' },
        closed: { condition: () => !open() && !Weather.isSnow && !Weather.lightsOn, image: 'closed.png' },
        snowClosed: { condition: () => !open() && Weather.isSnow && !Weather.lightsOn, image: 'snow-closed.png' },
        closedNight: { condition: () => !open() && !Weather.isSnow && Weather.lightsOn, image: 'closed-night.png' },
        snowClosedNight: { condition: () => !open() && Weather.isSnow && Weather.lightsOn, image: 'snow-closed-night.png' }
      },
      emissive: { image: 'emissive.png', condition: () => open() && Weather.lightsOn, color: '#dcb170dd', size: 4, intensity: 0.7 },
      weather: { fogDistributionCurve: 1, rainSplashEnabled: true, fogEnabled: true, groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } } }
    },
    { overwrite: true }
  );

  maplebirch.tool.macro.defineS('deadwood-holdem-table', () => {
    const game = maplebirch.get('LifeSimulation')?.casino.holdem;
    if (game) return holdemView(maplebirch, game);
  });

  maplebirch.tool.macro.defineS('deadwood-casino-watch-table', () => {
    const game = maplebirch.get('LifeSimulation')?.casino.watch;
    if (game) return holdemView(maplebirch, game);
  });

  maplebirch.tool.macro.defineS('deadwood-three-card-table', () => {
    const game = maplebirch.get('LifeSimulation')?.casino.threeCard;
    if (game) return threeCardView(maplebirch, game);
  });

  Marlow(maplebirch);
}
