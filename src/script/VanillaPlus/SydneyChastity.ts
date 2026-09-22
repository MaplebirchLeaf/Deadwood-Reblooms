type PassagePatch = {
  src: string;
  applybefore: string;
  expected: number;
};

export const sydneyChastityWidgetPassages: Record<string, PassagePatch[]> = {
  'Widgets Sydney': [
    // 在神殿移除贞操带的原版后续判断前加入重新佩戴提议，不改变原版移除剧情条件。
    {
      src: '<<if $location is "temple" and $sydneyChastityRemoveIntro>>',
      applybefore: '<<deadwood-reblooms-sydney-chastity-refit-link>>\n\t',
      expected: 1
    }
  ]
};

export default function (maplebirch: typeof window.maplebirch) {
  // 补完堕落仪式结尾的重新佩戴提议，并按 Sydney 当前状态处理回应。
  maplebirch.tool.zone.inject({ widgetPassage: sydneyChastityWidgetPassages });
}
