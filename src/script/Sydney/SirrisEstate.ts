// ./src/script/Sydney/SirrisEstate.ts

export default function (maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.patch.location.configure(
    'sirris_estate',
    {
      folder: 'sirris-estate',
      base: {
        default: { condition: () => !Weather.isSnow && !Weather.lightsOn, image: 'base.png' },
        snow: { condition: () => Weather.isSnow && !Weather.lightsOn, image: 'snow.png' },
        night: { condition: () => !Weather.isSnow && Weather.lightsOn, image: 'base-night.png' },
        snowNight: { condition: () => Weather.isSnow && Weather.lightsOn, image: 'snow-night.png' }
      },
      // 原版按底部对齐：32×32 灯光层的窗户比 32×38 底图上移 6 像素。
      emissive: {
        sydney: {
          image: 'emissive-upstairs.png',
          condition: () => Weather.lightsOn && maplebirch.get('Sydney')!.estatePresence.sydney,
          color: '#fbff86dd',
          size: 4,
          intensity: 0.8
        },
        sirris: {
          image: 'emissive-ground.png',
          condition: () => Weather.lightsOn && maplebirch.get('Sydney')!.estatePresence.sirris,
          color: '#fbff86dd',
          size: 4,
          intensity: 0.8
        }
      },
      weather: {
        fogDistributionCurve: 1,
        rainSplashEnabled: true,
        fogEnabled: true,
        groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } }
      }
    },
    { overwrite: true }
  );

  // 邀请由西里斯当面给出，避免玩家刚认识悉尼就知道其家庭住址。
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-sirris-estate-invitation-link',
    passage: 'Adult Shop Approach Sirris'
  });

  // 悉尼在神殿宿舍答应当晚回家，原版日程也会在约定时段同步转为 home。
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-sirris-estate-evening-link',
    passage: 'Temple Quarters'
  });

  // 多瑙河街的固定地点列表位于街道事件分支内。复用其首个图标作锚点，
  // 因而危险事件、昏厥和特殊剧情占据页面时不会冒出庄园入口。
  maplebirch.tool.inject({
    locationPassage: {
      'Danube Street': [
        {
          srcmatch: /<<if \$exposed lte 0 and Time\.openingHours\(2\)>>(?=\s*<<spaicon>>)/,
          applybefore: '<<deadwood-reblooms-sirris-estate-street-link>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
}
