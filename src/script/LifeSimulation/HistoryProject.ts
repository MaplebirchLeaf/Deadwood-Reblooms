// ./src/script/LifeSimulation/HistoryProject.ts

const startCheck = `
  <<if
    $LifeSimulation.historyProject.status is 'none' and
    $LifeSimulation.historyProject.availableDay gt 0 and
    Time.days gte $LifeSimulation.historyProject.availableDay
  >>
    <<deadwood-reblooms-history-project-intro>><<exit>>
  <</if>>`;

const schedule = `
        <<if
          ['paintingward', 'paintingsnake'].includes(_labelP) and
          $LifeSimulation.historyProject.status is 'none' and
          $LifeSimulation.historyProject.availableDay is 0
        >>
          <<set $LifeSimulation.historyProject.source to _labelP>>
          <<set $LifeSimulation.historyProject.availableDay to
            Time.days + ((8 - Time.weekDay) % 7) + 1
          >>
        <</if>>`;

export default function (maplebirch: typeof window.maplebirch) {
  // 在原版事件池、日志和画作归还结算点接入历史项目状态。
  maplebirch.tool.inject({
    locationPassage: {
      'School Library': [{ src: '<<projectoptions>>', applybefore: '<<deadwood-reblooms-history-project-library-option>>\n\t\t', expected: 1 }],
      'Lake Shore': [
        // 正常活动分支才有返回路线，继承原版昏厥、追逐与遭遇的排除条件。
        { src: '<<lakereturnjourney>>', applybefore: '<<deadwood-reblooms-history-project-lake-option>>\n\t', expected: 1 }
      ],
      Museum: [
        // 普通交谈菜单才提供调查，首次见面、藏品事件与博物馆遇袭不被打断。
        { src: '<<museumtalk>>', applybefore: '<<deadwood-reblooms-history-project-museum-options>>\n\t', expected: 1 },
        // 在玩家确认讨论博物馆画作后安排历史课题，不因仅浏览画作而提前触发。
        {
          src: '<<set $museumAntiques.paintings[_labelP] to "talk">>',
          applyafter: schedule,
          expected: 1
        }
      ]
    },
    widgetPassage: {
      Widgets: [
        {
          // 原版书桌先检查是否有课题选项，历史课题也须通过此开关才能显示入口。
          src: '<<set _projectOptions to [$scienceproject, $mathsproject].includes("ongoing")>>',
          applyafter: `
	<<if $location is 'home' and $LifeSimulation.historyProject.status is 'ongoing'
		and Time.days lt $LifeSimulation.historyProject.deadline
		and $LifeSimulation.historyProject.draft is 0
		and $LifeSimulation.historyProject.archive gt 0 and $LifeSimulation.historyProject.museum gt 0>>
		<<set _projectOptions to true>>
	<</if>>`,
          expected: 1
        }
      ],
      'Widgets School Projects': [
        {
          src: '<<widget "projectoptions">>',
          applyafter: '\n\t<<deadwood-reblooms-history-project-home-option>>',
          expected: 1
        }
      ],
      'Widgets Events History': [
        // 在普通历史课事件池清空后追加课题起始检查，让新事件参与当天的历史课抽取。
        {
          src: '<<addinlineevent "historyCritique">>',
          applybefore: startCheck,
          expected: 1
        },
        // 在安全历史课组件内部的清池点后追加同一检查，兼容安全模式的独立事件组件。
        {
          src: '<<addinlineevent "historyQuiet" 2>>',
          applybefore: startCheck,
          expected: 1
        }
      ],
      'Widgets Journal': [
        // 在原版数学课题日志分支前插入历史课题日志，使两个课题可以同时显示。
        {
          src: '<<if $mathsproject is "ongoing">>',
          applybefore: '<<deadwood-reblooms-history-project-journal>>\n\t',
          expected: 1
        }
      ],
      'Widgets Events Street': [
        // 在街道事件池清空后加入 Kylar 历史课题事件，确保它按原版事件池时机注册。
        {
          src: '<<cleareventpool>>',
          applyafter: '\n\t\t<<deadwood-reblooms-history-project-kylar-street-event>>',
          expected: 1
        }
      ]
    }
  });
}
