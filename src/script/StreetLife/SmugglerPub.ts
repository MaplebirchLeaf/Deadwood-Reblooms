import BlackjackView from '../LifeSimulation/Casino/BlackjackView';
import { holdemView } from '../LifeSimulation/Casino/PokerView';
import { pubCardPassages } from '../../module/StreetLife/SmugglerCards';

export default function SmugglerPub(maplebirch: typeof window.maplebirch): void {
  for (const game of ['blackjack', 'holdem'] as const) {
    maplebirch.tool.macro.defineS(`deadwood-pub-${game}-table`, () => {
      if (!V.StreetLife?.smuggler_pub?.cards) return;
      const cards = maplebirch.get('StreetLife')?.smugglerPub.cards;
      if (!cards) return;
      const revision = cards.state.revision;
      const action = (name: string, amount: number): boolean => {
        const accepted = cards.action(game, name, amount, revision);
        if (accepted && maplebirch.passage.title === pubCardPassages[game]) {
          maplebirch.SugarCube.Engine.play(cards.state.mode ? pubCardPassages[game] : 'Deadwood Smuggler Pub');
        }
        return accepted;
      };
      return game === 'blackjack'
        ? new BlackjackView(maplebirch, cards.blackjack, { context: 'pub', action: (name, value) => action(name, Number(value)) }).root
        : holdemView(maplebirch, cards.holdem, false, { widget: "<<deadwood-poker-holdem-view 'pub'>>", action });
    });
  }
  maplebirch.on(':passagestart', passage => {
    if (!V.StreetLife?.smuggler_pub?.cards) return;
    const cards = maplebirch.get('StreetLife')?.smugglerPub.cards;
    if (cards?.state.mode && passage.title !== pubCardPassages[cards.state.mode]) cards.close();
  });
  maplebirch.tool.patch.location.configure(
    'deadwood_smuggler_pub',
    {
      folder: 'smuggler-pub',
      base: {
        default: { condition: () => !Weather.lightsOn, image: 'base.png' },
        night: { condition: () => Weather.lightsOn, image: 'base-night.png' }
      },
      // 洞内灯笼昼夜点着，两张底图和发光遮罩均为 32×32，坐标一致。
      emissive: { image: 'emissive.png', condition: () => true, color: '#e8b46b', size: 2, intensity: 0.45, blur: 0.3 },
      weather: { rainSplashEnabled: false, fogEnabled: false, fogDistributionCurve: 1, groundBounds: { splashes: { top: 0, bottom: 0 }, fog: { top: 0, bottom: 0 } } }
    },
    { overwrite: true }
  );
  // 只改变画面映射，保留地下地点标识、出口及通用洞穴图的注册。
  maplebirch.tool.patch.location.configure('underground', {
    customMapping: () => (maplebirch.get('StreetLife')!.smugglerPub.picture ? 'deadwood_smuggler_pub' : 'underground')
  });
  maplebirch.tool.inject({
    locationPassage: {
      'Smuggler Pub': [
        { src: '<<effects>>', applyafter: '\n<<deadwood-smuggler-pub-environment>>\n', expected: 1 },
        { src: '<<sewericon>>', applybefore: '<<deadwood-smuggler-pub-menu>>\n', expected: 1 }
      ]
    }
  });
}
