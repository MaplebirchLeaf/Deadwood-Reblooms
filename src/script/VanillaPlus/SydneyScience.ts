type PassagePatch = { src?: string; srcmatch?: RegExp; to?: string; applyafter?: string; applybefore?: string; expected: number };

export const sydneyScienceLocationPassages: Record<string, PassagePatch[]> = {
  'Science Lesson': [
    {
      src: '<<set $daily.school.attended.science to true>>',
      applyafter: '\n\n<<deadwood-reblooms-sydney-science-intro>>',
      expected: 1
    }
  ]
};

export const sydneyScienceWidgetPassages: Record<string, PassagePatch[]> = {
  'Widgets Events Science': [
    {
      src: '<<if $sydneyScience is 1>>',
      to: '<<sydneySchedule>>\n\t<<if $sydneyScience is 1 and _sydney_location is "science">>',
      expected: 1
    },
    {
      srcmatch: /<<widget "eventsscience">>\s*<<cleareventpool>>/,
      applyafter: '\n\t<<deadwood-reblooms-sydney-science-events>>',
      expected: 1
    },
    {
      srcmatch: /<<widget "eventssciencesafe">>[\s\S]*?<<cleareventpool>>/,
      applyafter: '\n\t<<deadwood-reblooms-sydney-science-events>>',
      expected: 1
    },
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
