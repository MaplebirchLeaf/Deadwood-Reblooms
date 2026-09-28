export default function Gym(maplebirch: typeof window.maplebirch): void {
  // 地点图由侧栏天气渲染器叠加。32×32 的灯光层相对 32×38 底图按底部对齐。
  maplebirch.tool.patch.location.configure(
    'deadwood_gym',
    {
      folder: 'gym',
      base: {
        default: { condition: () => !Weather.isSnow, image: 'base.png' },
        snow: { condition: () => Weather.isSnow, image: 'snow.png' }
      },
      emissive: {
        image: 'emissive.png',
        condition: () => Weather.lightsOn,
        color: '#fbff86dd',
        size: 4,
        intensity: 0.8
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

  // 峭壁街的普通地点列表才有入口；遇到街道强制事件时不额外显示健身房链接。
  maplebirch.tool.inject({
    locationPassage: {
      'Cliff Street': [
        {
          src: '<<if $scienceproject is "ongoing" and $scienceprojectdays is 0 and Time.dayState is "day" and $exposed lte 0>>',
          applybefore: '<<deadwood-reblooms-life-simulation-gym-street>>\n\t\t',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Wardrobe': [
        {
          src: '<<case "Farm Wardrobe">>',
          applybefore: '<<case "Deadwood Reblooms Life Simulation Gym Wardrobe">>\n\t\t\t<<deadwood-reblooms-life-simulation-gym-wardrobe-exit>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
}
