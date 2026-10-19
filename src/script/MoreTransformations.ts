// ./src/script/MoreTransformations.ts

import Tsukihan from './MoreTransformations/Tsukihan';

export default function MoreTransformations(maplebirch: typeof window.maplebirch): void {
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
  maplebirch.tool.onInit(() => {
    maplebirch.tool.patch.traits.add({
      title: 'General Traits',
      name: () => maplebirch.t('deadwood-reblooms:Traits:foxfire:name'),
      colour: 'teal',
      has: () => maplebirch.get('MoreTransformations')!.foxfire,
      text: () => maplebirch.t('deadwood-reblooms:Traits:foxfire:text')
    });
  });

  maplebirch.tool.inject({
    locationPassage: {
      // 只扩展安全事件池；普通菜单的地点说明后、湖泊等目的地前，保留原版行进结算。
      Forest: [{ srcmatch: /<<elseif \$eventskip gte 1>>[^<]*<br><br>/g, applyafter: '\n\t\t<<deadwood-raven-link>><<deadwood-raven-shrine-path>>\n', expected: 5 }],
      Park: [{ src: '<<if $leftleg is "bound" or $rightleg is "bound">>', applybefore: '<<deadwood-raven-link>>\n', expected: 1 }]
    },
    widgetPassage: {
      'Widgets Mirror': [
        {
          src: '<<if _animal>>',
          applyafter: '<<set _mirrorAnimal to _animal>><<for _animal range ["cat", "cow", "wolfgirl", "harpy", "fox"].filter(name => V[name] > 1)>>',
          expected: 1
        },
        {
          srcmatch: /(<<if \$(cat|cow|wolfgirl|harpy|fox) gt 1)(>>)(?=\s*<<if _(?:cat|cow|wolf|bird|fox)\.)/g,
          to: '$1 and _animal is "$2"$3',
          expected: 5
        },
        {
          srcmatch: /(<<set \$_chimeraOptions to \{[\s\S]*?<<set \$_chimeraEnabled[^\r\n]*>>)/,
          to: `</div><</for>><<set _animal to _mirrorAnimal>>$1<div @class="'settingsToggleItemWide' + $_chimeraEnabled">`,
          expected: 1
        }
      ],
      'Widgets Forest': [
        {
          src: '<<addinlineevent "safeforest_easytrail" 0.33>>',
          applybefore: '<<deadwood-raven-events>>\n\t',
          expected: 1
        }
      ],
      'Widgets Combat Tentacle Adv': [
        // 捕获原版放逐之前的生命与次数，按实际伤害结算，兼容原版增强模块的伤害加成。
        {
          srcmatch: /<<if \(\$leftaction is "leftbanish" and \$leftactionTarget is _tentacle\.id\)\s*or \(\$rightaction is "rightbanish" and \$rightactionTarget is _tentacle\.id\)>>/,
          applyafter: '<<set _foxfireHealth to _tentacle.tentaclehealth>><<set _foxfireUses to $angelBanish>>',
          expected: 1
        },
        {
          srcmatch: /<<tentacle_record "banish" [^>\r\n]+ \* _multi>>\s*<<tentacleadvdisable _tentacle>>/,
          applyafter: '<<if $angelBanish lt _foxfireUses>><<deadwood-foxfire _tentacle `_foxfireHealth - _tentacle.tentaclehealth`>><</if>>',
          expected: 1
        }
      ]
    }
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-raven-link', passage: 'Churchyard' }, { widget: 'deadwood-raven-shrine-gwylan-link', passage: 'Gwylan Talk Shop' });
}
