export default function Gym(maplebirch: typeof window.maplebirch): void {
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
    }
  });
}
