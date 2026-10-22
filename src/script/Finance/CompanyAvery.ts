// ./src/script/Finance/CompanyAvery.ts

import { holdemView } from '../LifeSimulation/Casino/PokerView';

export default function CompanyAvery(maplebirch: typeof window.maplebirch): void {
  const journal = maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Journal');
  if (journal?.content.includes('/* Is Avery paying for the PC? */')) {
    // 未使用新版房租函数的原版分支，在日志自己的代付判断中排除来宾身份。
    maplebirch.tool.inject({
      widgetPassage: {
        'Widgets Journal': [
          {
            srcmatch: /\$avery_mansion(?=>>\/\* Is Avery paying for the PC\? \*\/)/,
            applyafter: ' and !maplebirch.get("Finance")?.company.avery.state.mansion_guest',
            expected: 1
          }
        ]
      }
    });
  }
  maplebirch.tool.macro.defineS('deadwood-private-cards-table', () => {
    const game = maplebirch.get('Finance')?.company.avery.cards;
    if (game) return holdemView(maplebirch, game, true);
  });
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Sleep': [
        {
          // 保留原版收养保护；庄园来宾身份本身不提供对贝利的豁免。
          src: '!($avery_mansion and',
          applyafter: ' !maplebirch.get("Finance")?.company.avery.state.mansion_guest and',
          expected: 1
        }
      ],
      'Widgets Rent': [
        {
          // 来宾没有代付协议，不显示贝利指责艾弗里停付的收养对白。
          src: '<<widget "rent_avery">>\n\t<<if $avery_mansion',
          applyafter: ' and !maplebirch.get("Finance")?.company.avery.state.mansion_guest',
          expected: 1
        }
      ],
      'Widgets Avery Mansion': [
        {
          // 共用原版庄园日程入口，许可与地牢知识由 Twee 写回原版变量。
          src: '<<averySchedule>>',
          applyafter: '<<deadwood-avery-controller-access>>',
          expected: 1
        }
      ]
    },
    locationPassage: {
      Orphanage: [
        {
          // 罗宾的告别以被收养搬家为前提，私人拜访不触发。
          src: 'and !$avery_mansion_robin',
          applyafter: ' and !maplebirch.get("Finance")?.company.avery.state.mansion_guest',
          expected: 1
        }
      ],
      'Avery Valentines 11': [
        {
          src: '<<else>> /* Dislike it */',
          applyafter: '\n\t\t<<if maplebirch.get("Finance")?.company.avery.state.mansion_guest>><<deadwood-avery-guest-housekeeping>><<else>>',
          expected: 1
        },
        {
          srcmatch: /\t<<\/if>>(?=\n\n\t<<link \[\[[^\n]*\|Avery Valentines 11\]\]>><<set \$avery_valentines.talk to "bailey">>)/,
          applybefore: '\t\t<</if>>\n',
          expected: 1
        }
      ],
      // 保留原版四个价格档，仅让存款参与价格感受，不把贷款、股票市值当现金。
      'Avery Valentines 13': [
        {
          srcmatchgroup: /\$money(?= (?:gte|lt) (?:5000000|500000|50000|25000)\b)/g,
          to: "(maplebirch.get('Finance')?.spendingMoney ?? $money)",
          expected: 4
        }
      ]
    }
  });
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-private-cards-guest-link', passage: ['Avery Cards', 'Avery Cards 4'] },
    { widget: 'deadwood-private-cards-boundary-link', passage: ['Avery Cards 8', 'Avery Cards Table Protest'] },
    { widget: 'deadwood-private-cards-link', passage: 'Avery Cards 6' },
    { widget: 'deadwood-avery-site-link', passage: 'Skyscraper' },
    { widget: 'deadwood-avery-ceremony-link', passage: 'Skyscraper Party 11' },
    { widget: 'deadwood-avery-dinner-link', passage: ['Avery Date Order', 'Avery Date Cheap', 'Avery Date Expensive'] }
  );
  maplebirch.tool.addTo('Journal', 'deadwood-avery-journal');
}
