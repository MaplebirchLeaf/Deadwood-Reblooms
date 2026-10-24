// ./src/script/DarkfeatherShrine.ts

import Tsukihan from './DarkfeatherShrine/Tsukihan';

export default function DarkfeatherShrine(maplebirch: typeof window.maplebirch): void {
  Tsukihan(maplebirch);

  maplebirch.tool.onInit('deadwood-raven-clothes-init');
  maplebirch.tool.addTo('State', 'deadwood-raven-clothes-state');
  maplebirch.tool.addTo('Journal', 'deadwood-raven-shrine-journal');
  maplebirch.tool.addTo('SkillsBonusDisplay', 'deadwood-raven-shrine-skill');
  maplebirch.tool.patch.traits.add(
    {
      title: 'General Traits',
      name: () => maplebirch.t('deadwood-reblooms:Traits:cherishedWish:name'),
      colour: 'teal',
      has: () => !!maplebirch.get('MoreTransformations') && (V.MoreTransformations?.shrine?.wish?.count ?? 0) >= 7,
      text: () => maplebirch.t('deadwood-reblooms:Traits:cherishedWish:text')
    },
    {
      title: 'General Traits',
      name: () => maplebirch.t('deadwood-reblooms:Traits:springglow:name'),
      colour: 'green',
      has: () => !!maplebirch.get('MoreTransformations') && (V.MoreTransformations?.shrine?.harvests ?? 0) >= 3,
      text: () => maplebirch.t('deadwood-reblooms:Traits:springglow:text')
    }
  );
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets School': [
        {
          src: '<<delinquency -1 "bonus">>',
          applyafter: '\n\t<<if _args[1] isnot "sleep">><<deadwood-raven-shrine-wish-progress "study">><</if>>',
          expected: 1
        }
      ]
    }
  });
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
