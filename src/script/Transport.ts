// ./src/script/Transport.ts

import Catalog from '../module/Transport/Catalog';

export default function Transport(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('Footer', {
    widget: "dynamic 'deadwood-transport-entry' 'deadwood-transport-entry'",
    passage: [...Catalog.routes, ...Catalog.roads]
      .filter(route => !route.passage.endsWith(' Street'))
      .map(route => route.passage)
      .concat('Forest', 'Moor')
  });
  maplebirch.tool.inject({
    widgetPassage: {
      Widgets: [
        {
          src: '<<set $map.location to _args[0]>>',
          applybefore: "<<if $passage.endsWith(' Street') and !_args[1]>><<dynamic 'deadwood-transport-entry' 'deadwood-transport-entry'>><</if>>",
          expected: 1
        }
      ]
    }
  });
  maplebirch.tool.patch.location.configure('deadwood_transport_bicycle', { customMapping: () => 'shopping_centre' });
  const shopOpen = () => Time.hour >= 8 && Time.hour < 18;
  const openingHours = {
    motors: shopOpen,
    service: shopOpen,
    petrol: () => true,
    school: () => Time.weekDay !== 1 && Time.hour >= 9 && Time.hour < 18
  };
  for (const [location, open] of Object.entries(openingHours)) {
    maplebirch.tool.patch.location.configure(
      `deadwood_transport_${location}`,
      {
        folder: `transport-${location}`,
        base: {
          default: { condition: () => open() && !Weather.isSnow && !Weather.lightsOn, image: 'base.png' },
          snow: { condition: () => open() && Weather.isSnow && !Weather.lightsOn, image: 'snow.png' },
          night: { condition: () => open() && !Weather.isSnow && Weather.lightsOn, image: 'base-night.png' },
          snowNight: { condition: () => open() && Weather.isSnow && Weather.lightsOn, image: 'snow-night.png' },
          ...(location === 'petrol'
            ? {}
            : {
                closed: { condition: () => !open() && !Weather.isSnow && !Weather.lightsOn, image: 'closed.png' },
                snowClosed: { condition: () => !open() && Weather.isSnow && !Weather.lightsOn, image: 'snow-closed.png' },
                closedNight: { condition: () => !open() && !Weather.isSnow && Weather.lightsOn, image: 'closed-night.png' },
                snowClosedNight: { condition: () => !open() && Weather.isSnow && Weather.lightsOn, image: 'snow-closed-night.png' }
              })
        },
        emissive: { image: 'emissive.png', condition: () => open() && Weather.lightsOn, color: '#f6d49edd', size: 3, intensity: 0.65 },
        weather: {
          fogDistributionCurve: 1,
          rainSplashEnabled: true,
          fogEnabled: true,
          groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } }
        }
      },
      { overwrite: true }
    );
  }
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-transport-places', passage: ['Harvest Street', 'Elk Street', 'Shopping Centre'] });
  maplebirch.tool.addTo('CustomLinkZone', { widget: [1, 'deadwood-transport-places 1'], passage: 'Harvest Street' });
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-transport-ride-link',
    match: /^(?:Robin|Whitney Home|Sydney|Temple Sydney|Library Rental Counter|Book Rental|English Play|School Front Courtyard|School Leave Whitney|Kylar Courtyard)| Street$/
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-transport-avery-link', passage: 'Oxford Street' });
  maplebirch.tool.addTo('Header', { widget: 'deadwood-transport-header', match: /^Deadwood Transport (?:Menu|Travel)$/ });
  maplebirch.tool.addTo('SkillsBox', 'deadwood-transport-skill');
  maplebirch.tool.addTo('Journal', 'deadwood-transport-journal');
}
