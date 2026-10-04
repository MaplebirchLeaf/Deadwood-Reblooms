// ./src/script/LifeSimulation/Gym.ts

export default function Gym(maplebirch: typeof window.maplebirch): void {
  const open = () => Time.hour >= 6 && Time.hour < 22;
  // 地点图由侧栏天气渲染器叠加。32×32 的灯光层相对 32×38 底图按底部对齐。
  maplebirch.tool.patch.location.configure(
    'deadwood_gym',
    {
      folder: 'gym',
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
      emissive: {
        image: 'emissive.png',
        condition: () => open() && Weather.lightsOn,
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

  // 峭壁街的普通地点列表才有入口，遇到街道强制事件时不额外显示健身房链接。
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
          applybefore:
            '<<case "Deadwood Reblooms Life Simulation Gym Wardrobe">>\n\t\t\t<<lanLink "关上储物柜" "Deadwood Reblooms Life Simulation Gym Changing Room">><<cleanupOnWardrobeExit>><</lanLink>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
}
