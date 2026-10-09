// ./src/script/Sydney/SydneyScience.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-sydney-science-late-intro', passage: 'Temple' });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-sydney-science-inspection-leave', passage: 'Science Lesson' });
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-sydney-science-anatomy',
    passage: ['Science Event3', 'Science Undress', 'Science Refusal', 'Science Undress Desk']
  });

  // 接入科学课事件池、首次同桌剧情和悉尼保护分支。
  maplebirch.tool.inject({
    locationPassage: {
      'Canteen Lunch Sydney': [
        // 午餐已结束的六处分支共用原版结算点，不依赖其他剧情遗留的 phase。
        {
          srcmatch: /<<endevent>>/g,
          applyafter: '\n<<deadwood-reblooms-sydney-science-transfer-link>>',
          expected: 6
        }
      ],
      'Science Lesson': [
        // 在原版标记当天科学课出席后追加首次同桌剧情，避免未实际上课时触发。
        {
          src: '<<set $daily.school.attended.science to true>>',
          applyafter: '\n\n<<deadwood-reblooms-sydney-science-intro>>',
          expected: 1
        },
        // 仅在原版普通上课选项前显示，考试、检查与突发事件不提供同桌互动。
        {
          src: '<<scienceicon>>',
          applybefore: '<<deadwood-reblooms-sydney-science-actions>>\n\t',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Events Science': [
        // 在科学课事件判断前刷新悉尼日程。
        {
          src: '<<if $sydneyScience is 1>>',
          applybefore: '<<sydneySchedule>>\n\t',
          expected: 1
        },
        // 在原版出席条件上追加实际位置检查。
        {
          src: '$sydneyScience is 1',
          applyafter: ' and _sydney_location is "science" and maplebirch.get("Sydney").available',
          expected: 1
        },
        // 在普通科学课事件池清空后注册扩展事件，使其参与本次课堂事件抽取。
        {
          src: '<<addinlineevent "scienceChemicals" 1>>',
          applybefore: '<<deadwood-reblooms-sydney-science-events>>\n\t',
          expected: 1
        },
        // 在安全科学课组件内部的清池点后注册同一扩展事件，兼容安全模式的独立事件池。
        {
          src: '<<addinlineevent "scienceBook" 2>>',
          applybefore: '<<deadwood-reblooms-sydney-science-events>>\n\t',
          expected: 1
        },
        // 用事件开头和最后一个动作作为两个短边界，不捕获整段原版事件。
        {
          src: '<<addinlineevent "scienceDelinquents" 2>>',
          applyafter:
            '\n\t\t<<if $sydneyScience is 1 and _sydney_location is "science" and maplebirch.get("Sydney").available and isLoveInterest("Sydney")>><<deadwood-reblooms-sydney-science-protect>><<else>>',
          expected: 1
        },
        {
          srcmatch: /\|Science Pick\]\]>><<set \$phase to 2>><<detention 2>><<\/link>><<gdelinquency>>/,
          applyafter: '\n\t\t<</if>>',
          expected: 1
        }
      ]
    }
  });
}
