// ./src/script/Sydney/SydneyScience.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-reblooms-sydney-science-inspection-leave', passage: 'Science Lesson' },
    { widget: 'deadwood-reblooms-sydney-science-anatomy', passage: ['Science Event3', 'Science Undress', 'Science Refusal', 'Science Undress Desk'] }
  );

  // 接入科学课事件池、首次同桌剧情和悉尼保护分支。
  maplebirch.tool.inject({
    locationPassage: {
      // 普通午餐及插曲都在饭后离开选项前接入，不在涂写邀请或打斗中插入换班。
      ...Object.fromEntries(
        [
          'Canteen Lunch Sydney',
          'Sydney Canteen Bodywriting Stop',
          'Sydney Canteen Bodywriting Allow',
          'Sydney Kylar Bodywriting Encourage',
          'Sydney Kylar Bodywriting Refuse',
          'Sydney Kylar Bodywriting Ignore',
          'Sydney Canteen Encourage',
          'Sydney Canteen Intervene',
          'Sydney Canteen Fight Finish',
          'Sydney Canteen Break'
        ].map((title, index) => [
          title,
          [
            { srcmatch: /<<historyicon>>/g, applybefore: '<<deadwood-reblooms-sydney-science-transfer-link>>\n', expected: index === 0 ? 6 : 1 },
            ...(index === 0 ? [{ src: '<<if $sydneyScience is 1>>', applybefore: '<<if $sydneyScience isnot 1>><<set $SydneyExpansion.scienceHint to true>><</if>>', expected: 1 }] : [])
          ]
        ])
      ),
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
