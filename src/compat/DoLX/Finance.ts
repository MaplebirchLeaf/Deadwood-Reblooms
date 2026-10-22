import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type Finance from '../../module/Finance';

type EconomySetup = typeof setup & {
  inflation: { spendPrice(amount: number, source?: unknown): number; rentPayable(): number };
  hbsc: { paymentBalance(source?: unknown): number };
};

export default function adaptFinance(maplebirch: MaplebirchCore): void {
  const finance = maplebirch.get('Finance') as Finance | undefined;
  if (!finance) return;
  const zone = maplebirch.tool.zone;
  const passages = maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map;

  // 这些购买判断已由 DoLX 的通胀/HBSC 接口负责，余额桥接保留两套银行卡各自扣款。
  for (const group of [zone.locationPassage, zone.widgetPassage]) {
    for (const [title, rules] of Object.entries(group)) {
      const source = passages.get(title)?.content ?? '';
      if (!/setup\.(?:inflation|hbsc)\./.test(source) && title !== 'Temple Prayer') continue;
      group[title] = rules.filter(rule => !rule.to?.includes('maplebirch.get("Finance").canPay(') && ![rule.to, rule.applybefore].some(text => text?.includes('$Finance.bank.bailey_knows_account')));
    }
  }

  // 部分商店仍直接比较已涨价的金额。只替换金额判断，保留价格显示和购买动作。
  const merchants = {
    'Tailor Shop': 'tailor',
    Spa: 'spa',
    'Pet Shop': 'petShop',
    'Pet Shop Treats': 'petShop',
    'Pub Music': 'pub',
    Pub: 'pub',
    'Widgets Clothing': 'clothes'
  };
  for (const [title, source] of Object.entries(merchants)) {
    const group = passages.get(title)?.tags.includes('widget') ? 'widgetPassage' : 'locationPassage';
    maplebirch.tool.inject({
      [group]: {
        [title]: [
          {
            srcmatchgroup: /\$money gte \(setup\.inflation \? setup\.inflation\.(?:price|spendPrice)\(([$\w.]+)(?:, "[^"]+")?\) : \1\)/g,
            to: `maplebirch.get("Finance").canPay($1, "${source}")`
          },
          ...(title === 'Tailor Shop'
            ? [
                {
                  srcmatchgroup: /\$money lt \(setup\.inflation \? setup\.inflation\.spendPrice\((\$tailor_cost), "tailor"\) : \1\)/g,
                  to: '!maplebirch.get("Finance").canPay($1, "tailor")',
                  expected: 1
                }
              ]
            : [])
        ]
      }
    });
  }
  maplebirch.tool.inject({
    locationPassage: {
      'Shopping Centre': [{ srcmatchgroup: /setup\.inflation\.canAfford\((5000|10000|1000|200000)\)/g, to: 'setup.inflation.canAfford($1, "shopping")', expected: 4 }],
      'Temple Prayer': [
        {
          srcmatchgroup: /(?<=<<if )\$money(?= gte \$rentmoney \+ \(\$babyRent or 0\) \+ \(\$bratTax or 0\))/g,
          to: '($money + ($Finance.bank.bailey_knows_account ? $Finance.bank.balance : 0))',
          expected: 2
        }
      ]
    },
    widgetPassage: {
      'Widgets Rent': [
        // 押金与 HBSC 自动扣租先结算，仅在原版需要现金补款时从已授权账户取款。
        {
          srcmatchgroup: /(?=<<if \$money lt _rentDue>><<baileyBankDraw)/g,
          applybefore: '<<run maplebirch.get("Finance").prepareBaileyRent(Math.min(_rentDue, $money + ($Finance.bank.bailey_knows_account ? $Finance.bank.balance : 0)))>>',
          expected: 2
        }
      ],
      'Farm Widgets': [{ src: '$money gte _rentTotal', to: '($money + ($Finance.bank.bailey_knows_account ? $Finance.bank.balance : 0)) gte _rentTotal', expected: 1 }]
    }
  });

  // 原生租金提示与最终扣租共享同一余额口径，不把未授权或定期账户纳入。
  maplebirch.tool.onInit(() => {
    const economy = setup as EconomySetup;
    const paymentBalance = economy.hbsc.paymentBalance.bind(economy.hbsc);
    const rentPayable = economy.inflation.rentPayable.bind(economy.inflation);
    finance.purchasePrice = (amount, source) => economy.inflation.spendPrice(amount, source);
    economy.hbsc.paymentBalance = source => Math.max(paymentBalance(source), source == null ? 0 : finance.paymentBalance(source));
    economy.inflation.rentPayable = () => rentPayable() + (finance.state.bank.bailey_knows_account ? finance.state.bank.balance : 0);
  });
}
