export default function (maplebirch: typeof window.maplebirch) {
  // 补完堕落仪式结尾的重新佩戴提议，并按 Sydney 当前状态处理回应。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Sydney': [
        // 提议属于共用 sydneyOptions 宏内部，Passage 链接区无法保持它在对话中的位置。
        {
          src: '<<if $location is "temple" and $sydneyChastityRemoveIntro>>',
          applybefore: '<<deadwood-reblooms-sydney-chastity-refit-link>>\n\t',
          expected: 1
        }
      ]
    }
  });
}
