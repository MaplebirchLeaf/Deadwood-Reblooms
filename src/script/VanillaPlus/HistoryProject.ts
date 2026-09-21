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
    $VanillaPlus.historyProject.status is 'none' and
    $VanillaPlus.historyProject.availableDay gt 0 and
    Time.days gte $VanillaPlus.historyProject.availableDay
  >>
    <<deadwood-reblooms-history-project-intro>><<exit>>
  <</if>>`;

const schedule = `
        <<if
          ['paintingward', 'paintingsnake'].includes(_labelP) and
          $VanillaPlus.historyProject.status is 'none' and
          $VanillaPlus.historyProject.availableDay is 0
        >>
          <<set $VanillaPlus.historyProject.source to _labelP>>
          <<set $VanillaPlus.historyProject.availableDay to
            Time.days + ((8 - Time.weekDay) % 7) + 1
          >>
        <</if>>`;

export const historyProjectWidgetPassages: Record<string, PassagePatch[]> = {
  'Widgets Events History': [
    {
      srcmatch: /<<widget "eventshistory">>\s*<<cleareventpool>>/,
      applyafter: startCheck,
      expected: 1
    },
    {
      srcmatch: /<<widget "eventshistorysafe">>\s*<<cleareventpool>>/,
      applyafter: startCheck,
      expected: 1
    }
  ],
  'Widgets Journal': [
    {
      src: '<<if $mathsproject is "ongoing">>',
      applybefore: '<<deadwood-reblooms-history-project-journal>>\n\t',
      expected: 1
    }
  ],
  'Widgets Events Street': [
    {
      src: '<<cleareventpool>>',
      applyafter: '\n\t\t<<deadwood-reblooms-history-project-kylar-street-event>>',
      expected: 1
    }
  ]
};

export const historyProjectLocationPassages: Record<string, PassagePatch[]> = {
  Museum: [
    {
      src: '<<set $museumAntiques.paintings[_labelP] to "talk">>',
      applyafter: schedule,
      expected: 1
    }
  ]
};

export default function (maplebirch: typeof window.maplebirch) {
  const registerAntique = () => {
    maplebirch.tool.patch.antiques.add('antiquegoldpriestess', {
      hint: maplebirch.t('deadwood-reblooms.VanillaPlus.history.antique.hint'),
      museum: maplebirch.t('deadwood-reblooms.VanillaPlus.history.antique.museum'),
      name: 'Golden Priestess Statuette',
      cn_name: '金制女祭司像',
      journal: maplebirch.t('deadwood-reblooms.VanillaPlus.history.antique.journal'),
      journalName: maplebirch.t('deadwood-reblooms.VanillaPlus.history.antique.journalName'),
      icon: 'antiques/antique-golden-priestess.png'
    });
  };

  registerAntique();
  maplebirch.on(':language', registerAntique);

  // 在项目选项 widget 渲染后追加历史项目入口，避免改写 widget 源码。
  maplebirch.addon.wikify('deadwood-reblooms:history-project-options', {
    afterWidget(_text, name, _passageTitle, _passage, node) {
      if (name === 'projectoptions') new maplebirch.SugarCube.Wikifier(node, '<<deadwood-reblooms-history-project-home-option>>');
    }
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-history-project-museum-options', passage: 'Museum' });
  maplebirch.tool.addTo(
    'AfterLinkZone',
    { widget: 'deadwood-reblooms-history-project-library-option', passage: 'School Library' },
    { widget: 'deadwood-reblooms-history-project-lake-option', passage: 'Lake Shore' }
  );

  // 在原版事件池、日志和画作归还结算点接入历史项目状态。
  maplebirch.tool.zone.inject({
    locationPassage: historyProjectLocationPassages,
    widgetPassage: historyProjectWidgetPassages
  });
}
