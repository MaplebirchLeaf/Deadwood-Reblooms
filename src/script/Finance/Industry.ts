// ./src/script/Finance/Industry.ts

import RowanPortrait from '../NamedNPCSidebarPortrait/Rowan';

export default function Industry(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.patch.location.configure(
    'deadwood_factory',
    {
      folder: 'workshop',
      base: {
        default: { condition: () => !Weather.isSnow && !Weather.lightsOn, image: 'base.png' },
        snow: { condition: () => Weather.isSnow && !Weather.lightsOn, image: 'snow.png' },
        night: { condition: () => !Weather.isSnow && Weather.lightsOn, image: 'base-night.png' },
        snowNight: { condition: () => Weather.isSnow && Weather.lightsOn, image: 'snow-night.png' }
      },
      emissive: { image: 'emissive.png', condition: () => Weather.lightsOn && maplebirch.get('Finance')?.industry.open === true, color: '#f6d49edd', size: 3, intensity: 0.65 },
      weather: {
        fogDistributionCurve: 1,
        rainSplashEnabled: true,
        fogEnabled: true,
        groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } }
      }
    },
    { overwrite: true }
  );
  maplebirch.tool.inject({
    locationPassage: {
      'Elk Street': [
        {
          src: '<<if $trash_unlocked is 1>>',
          applybefore: '<<deadwood-industry-street>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
  maplebirch.tool.addTo('Journal', 'deadwood-industry-journal');
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-laboratory-contact',
    passage: ['Riding School', "Doctor Harper's Office Exam"]
  });
  maplebirch.tool.addTo('CustomLinkZone', {
    widget: [-1, 'deadwood-laboratory-contact'],
    passage: ['Farm Still', 'Adult Shop Approach Sirris', 'Adult Shop Approach Sydney']
  });
  maplebirch.npc.add(
    {
      nam: 'Rowan',
      adult: 1,
      teen: 0,
      age: 42,
      title: 'factory supervisor',
      description: 'factory supervisor',
      hairColour: 'auburn',
      eyeColour: 'brown',
      hair_side_type: 'short',
      hair_fringe_type: 'messy',
      hair_sides_length: 80,
      hair_fringe_length: 80
    },
    { love: { maxValue: 50 }, loveAlias: ['Trust', '信任'], loveInterest: false },
    { Rowan: { EN: 'Rowan', CN: '罗文' }, 'factory supervisor': { EN: 'factory supervisor', CN: '工厂领班' } }
  );
  maplebirch.tool.addTo('NPCinit', 'deadwood-rowan-introduction');

  maplebirch.npc.addSchedule('Rowan', schedule => {
    schedule.at(0, 'rowan_home');
    schedule.when(date => date.hour >= 8 && date.hour < 18, 'deadwood_factory');
  });
  RowanPortrait(maplebirch);
}
