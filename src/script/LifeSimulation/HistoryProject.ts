interface PassagePatch {
  src?: string;
  srcmatch?: RegExp;
  to?: string;
  applyafter?: string;
  applybefore?: string;
  expected: number;
}

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

const historyProjectWidgetPassages: Record<string, PassagePatch[]> = {
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
};

const historyProjectLocationPassages: Record<string, PassagePatch[]> = {
  Museum: [
    // 在玩家确认讨论博物馆画作后安排历史课题，不因仅浏览画作而提前触发。
    {
      src: '<<set $museumAntiques.paintings[_labelP] to "talk">>',
      applyafter: schedule,
      expected: 1
    }
  ]
};

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Local History Exhibition'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:history:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:history:feat:description');
      },
      difficulty: 2,
      series: '',
      filter: ['All', 'General'],
      softLockable: true
    };
  });
  maplebirch.dynamic.regStateEvent('gate', 'life-simulation-history-feat', {
    output: 'earnFeat "Local History Exhibition"',
    cond: () => V.LifeSimulation?.historyProject?.status === 'won'
  });

  const registerAntique = () => {
    maplebirch.tool.patch.antiques.add('antiquegoldpriestess', {
      hint: maplebirch.t('deadwood-reblooms:LifeSimulation:history:antique:hint'),
      museum: maplebirch.t('deadwood-reblooms:LifeSimulation:history:antique:museum'),
      name: 'Golden Priestess Statuette',
      cn_name: '金制女祭司像',
      journal: maplebirch.t('deadwood-reblooms:LifeSimulation:history:antique:journal'),
      journalName: maplebirch.t('deadwood-reblooms:LifeSimulation:history:antique:journalName'),
      icon: 'antiques/antique-golden-priestess.png'
    });
  };

  registerAntique();
  maplebirch.on(':language', registerAntique);

  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-history-project-museum-options', passage: 'Museum' });
  maplebirch.tool.addTo(
    'AfterLinkZone',
    { widget: 'deadwood-reblooms-history-project-library-option', passage: 'School Library' },
    { widget: 'deadwood-reblooms-history-project-lake-option', passage: 'Lake Shore' }
  );

  // 在原版事件池、日志和画作归还结算点接入历史项目状态。
  maplebirch.tool.inject({
    locationPassage: historyProjectLocationPassages,
    widgetPassage: historyProjectWidgetPassages
  });
}
