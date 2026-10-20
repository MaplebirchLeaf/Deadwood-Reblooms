// ./src/script/DarkfeatherShrine.ts

import Tsukihan from './DarkfeatherShrine/Tsukihan';

export default function DarkfeatherShrine(maplebirch: typeof window.maplebirch): void {
  Tsukihan(maplebirch);

  maplebirch.tool.addTo('Journal', 'deadwood-raven-shrine-journal');
  maplebirch.tool.patch.location.configure('forest_raven_shrine', {
    folder: 'forest_raven_shrine',
    base: {
      default: { condition: () => !Weather.isSnow, image: 'base.png' },
      snow: { condition: () => Weather.isSnow, image: 'snow.png' }
    },
    emissive: { image: 'emissive.png', condition: () => Weather.lightsOn, color: '#fbff86dd', size: 4, intensity: 0.8 },
    weather: {
      fogDistributionCurve: 1,
      rainSplashEnabled: true,
      fogEnabled: true,
      groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } }
    }
  });
  maplebirch.tool.patch.location.configure('raven_shrine_house', { customMapping: () => 'forest_raven_shrine' });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-raven-shrine-gwylan-link', passage: 'Gwylan Talk Shop' });
}
