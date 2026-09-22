type PassagePatch = { src?: string; srcmatch?: RegExp; to?: string; applyafter?: string; applybefore?: string; expected: number };

export const sydneyScienceLocationPassages: Record<string, PassagePatch[]> = {
  'Science Lesson': [
    // 在原版标记当天科学课出席后追加首次同桌剧情，避免未实际上课时触发。
    {
      src: '<<set $daily.school.attended.science to true>>',
      applyafter: '\n\n<<deadwood-reblooms-sydney-science-intro>>',
      expected: 1
    }
  ]
};

export const sydneyScienceWidgetPassages: Record<string, PassagePatch[]> = {
  'Widgets Events Science': [
    // 在 Sydney 科学课事件判断前刷新日程，并要求 Sydney 当时确实位于科学教室。
    {
      src: '<<if $sydneyScience is 1>>',
      to: '<<sydneySchedule>>\n\t<<if $sydneyScience is 1 and _sydney_location is "science">>',
      expected: 1
    },
    // 在普通科学课事件池清空后注册扩展事件，使其参与本次课堂事件抽取。
    {
      srcmatch: /<<widget "eventsscience">>\s*<<cleareventpool>>/,
      applyafter: '\n\t<<deadwood-reblooms-sydney-science-events>>',
      expected: 1
    },
    // 在安全科学课组件内部的清池点后注册同一扩展事件，兼容安全模式的独立事件池。
    {
      srcmatch: /<<widget "eventssciencesafe">>[\s\S]*?<<cleareventpool>>/,
      applyafter: '\n\t<<deadwood-reblooms-sydney-science-events>>',
      expected: 1
    },
    // 包装原版 scienceDelinquents 事件：条件满足时改走 Sydney 保护分支，否则原样执行 $& 内容。
    {
      srcmatch: /<<addinlineevent "scienceDelinquents" 2>>[\s\S]*?<<\/addinlineevent>>/,
      to: '<<if $sydneyScience is 1 and _sydney_location is "science" and isLoveInterest("Sydney")>>\n\t\t<<deadwood-reblooms-sydney-science-protect>>\n\t<<else>>\n\t\t$&\n\t<</if>>',
      expected: 1
    }
  ]
};

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.addTo('AfterLinkZone', { widget: 'deadwood-reblooms-sydney-science-transfer-link', passage: 'Canteen Lunch Sydney' });
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-reblooms-sydney-science-actions', passage: 'Science Lesson' },
    { widget: 'deadwood-reblooms-sydney-science-late-intro', passage: 'Temple' }
  );

  // 接入科学课事件池、首次同桌剧情和悉尼保护分支。
  maplebirch.tool.zone.inject({
    locationPassage: sydneyScienceLocationPassages,
    widgetPassage: sydneyScienceWidgetPassages
  });
}
