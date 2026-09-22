export default function Finance(maplebirch: typeof window.maplebirch): void {
  // 通过框架补丁注册原版天气侧栏地点；base 元素必须提供 image 字段。
  maplebirch.tool.patch.location.configure(
    'financial_centre',
    {
      folder: 'financial-centre',
      base: {
        default: { condition: () => !Weather.isSnow, image: 'base.png' },
        snow: { condition: () => Weather.isSnow, image: 'snow.png' }
      },
      weather: {
        fogDistributionCurve: 1.2,
        rainSplashEnabled: true,
        fogEnabled: true,
        groundBounds: {
          splashes: { top: 7, bottom: 0 },
          fog: { top: 15, bottom: 0 }
        }
      }
    },
    { overwrite: true }
  );

  // 在 High Street 的常规地点列表中插入金融地点；锚点只有原版宏，不依赖中英文文本。
  maplebirch.tool.zone.inject({
    locationPassage: {
      'High Street': [
        // 在原版 Avery 分支判断前插入金融中心入口；锚点是稳定宏语句，不依赖英汉显示文本。
        {
          src: '\t\t<<if $avery_fate is "ascended">>',
          applybefore: '\t\t<<deadwood-reblooms-finance-high-street>>\n',
          expected: 1
        }
      ],
      // 这些原版地点分别判断能否交租；授权后把银行余额计入可支付金额。
      'Rent Seduce': [
        // 放宽两个诱惑交租选项的金额判断：贝利获授权后，随身现金与银行余额均可用于足额交租。
        {
          srcmatchgroup: /<<if \$money gte \$rentmoney \+ \(\$babyRent or 0\)>>/g,
          to: '<<if $money + ($VanillaPlus.finance.bank.baileyKnowsAccount ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 2
        }
      ],
      'Temple Prayer': [
        // 放宽两个神殿代缴租金选项的金额判断，使其与贝利授权后的银行扣款规则保持一致。
        {
          srcmatchgroup: /<<if \$money gte \$rentmoney \+ \(\$babyRent or 0\)>>/g,
          to: '<<if $money + ($VanillaPlus.finance.bank.baileyKnowsAccount ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 2
        }
      ],
      'Tailor Shop': [
        // 将裁缝修衣的“付得起”判断交给当前支付方式，允许用借记卡或信用卡承担修理费。
        {
          src: '$money gte $tailor_cost',
          to: 'maplebirch.VP.finance.canPay($tailor_cost, "tailor")',
          expected: 1
        },
        // 同步替换裁缝的“现金不足”反向判断，避免银行卡有余额时仍显示无法修理的提示。
        {
          src: '$money lt $tailor_cost',
          to: '!maplebirch.VP.finance.canPay($tailor_cost, "tailor")',
          expected: 1
        }
      ],
      Spa: [
        // 将日光浴服务的现金门槛改为支付方式检查；夜间潜入等其他 Spa 分支不受影响。
        {
          src: '<<if $money gte _price>>',
          to: '<<if maplebirch.VP.finance.canPay(_price, "spa")>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      // 原版各条收租路线没有统一的支付入口，所以只替换相同的金额判断。
      'Widgets Rent': [
        // 放宽 Widgets Rent 中两个可交租分支的前置判断，授权账户余额可以补足随身现金。
        {
          srcmatchgroup: /<<if \$money gte \$rentmoney \+ \(\$babyRent or 0\)>>/g,
          to: '<<if $money + ($VanillaPlus.finance.bank.baileyKnowsAccount ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 2
        },
        // 在最终 money 扣款前按授权从银行补足现金；原版宏仍负责租金统计、音效与后续结算。
        {
          src: '\t<<money `-($rentmoney + ($babyRent or 0))` "baileyRent">>',
          applybefore: '\t<<if $VanillaPlus.finance.bank.baileyKnowsAccount>>\n\t\t<<run maplebirch.VP.finance.prepareBaileyRent($rentmoney + ($babyRent or 0))>>\n\t<</if>>\n',
          expected: 1
        }
      ],
      'Farm Widgets': [
        // 放宽农场路线中的交租判断，避免授权账户有钱却因随身现金不足而隐藏付款选项。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.baileyKnowsAccount ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 1
        }
      ],
      'Widgets Temple': [
        // 放宽神殿通用组件中的交租判断，使银行授权覆盖该条原版租金结算路线。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.baileyKnowsAccount ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 1
        }
      ],
      'Widgets Actions Speak': [
        // 放宽对话动作组件中的交租判断，使对话内付款也能读取已授权的银行余额。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.baileyKnowsAccount ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 1
        }
      ],
      'Widgets Effects Man': [
        // 放宽人物效果组件中的交租判断，覆盖该组件生成的另一条原版租金付款入口。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.baileyKnowsAccount ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 1
        }
      ],
      // 原版购物组件会先检查随身现金；改为检查玩家当前选择的支付方式。
      'Widgets Shop': [
        // 将超市购物篮总价判断交给 canPay；实际扣款仍由统一 money 宏记录为 supermarket 消费。
        {
          src: '<<if $money gte _totalCost>>',
          to: '<<if maplebirch.VP.finance.canPay(_totalCost, "supermarket")>>',
          expected: 1
        }
      ],
      'Clothing Shop v2 Widgets': [
        // 替换试穿后购买单件服装的现金判断，让当前银行卡可以解锁购买分支。
        {
          src: '<<elseif $money >= getClothingCost(_temp_choice,$clothingShopSlot)>>',
          to: '<<elseif maplebirch.VP.finance.canPay(getClothingCost(_temp_choice,$clothingShopSlot), "clothes")>>',
          expected: 1
        },
        // 计算批量购买按钮状态时同时检查所选支付方式与衣柜空间，防止按钮被错误禁用。
        {
          src: '<<set _canAfford = ($money >= _clothingCost * $buyMultiple and _spaceLeft >= $buyMultiple) ? "" : "disabled">>',
          to: '<<set _canAfford = (maplebirch.VP.finance.canPay(_clothingCost * $buyMultiple, "clothes") and _spaceLeft >= $buyMultiple) ? "" : "disabled">>',
          expected: 1
        },
        // 点击批量购买时再次校验所选支付方式，保留原版对衣柜剩余空间的二次检查。
        {
          src: '<<if $money >= _clothingCost * $buyMultiple and _spaceLeft >= $buyMultiple>>',
          to: '<<if maplebirch.VP.finance.canPay(_clothingCost * $buyMultiple, "clothes") and _spaceLeft >= $buyMultiple>>',
          expected: 1
        },
        // 玩家改变批量数量后重新计算“送回家”按钮状态，使动态按钮与银行卡余额同步。
        {
          src: "$('#buy-send-home > .buy-button > .buy-button-inner').toggleClass('disabled', $money < cost * $buyMultiple || _spaceLeft < $buyMultiple);",
          to: "$('#buy-send-home > .buy-button > .buy-button-inner').toggleClass('disabled', !maplebirch.VP.finance.canPay(cost * $buyMultiple, 'clothes') || _spaceLeft < $buyMultiple);",
          expected: 1
        },
        // 生成可购买内裤列表时使用当前支付额度，避免有卡可付却被价格过滤掉。
        {
          src: 'if (!item.shop.includes($shopName) or $money lt getClothingCost(item, "under_lower")) return false;',
          to: 'if (!item.shop.includes($shopName) or !maplebirch.VP.finance.canPay(getClothingCost(item, "under_lower"), "clothes")) return false;',
          expected: 1
        }
      ],
      'Widgets Clothing': [
        // 替换旧版服装购买组件的现金判断，兼容仍调用该组件的原版服装商店。
        {
          src: '<<elseif $money gte $_cost>>',
          to: '<<elseif maplebirch.VP.finance.canPay($_cost, "clothes")>>',
          expected: 1
        }
      ],
      'Cosmetics Store Widgets': [
        // 白天购买化妆品时读取当前支付方式；夜间偷取分支继续沿用原版放行条件。
        {
          src: '<<if $money gte _price or Time.dayState is "night">>',
          to: '<<if maplebirch.VP.finance.canPay(_price, "cosmetics") or Time.dayState is "night">>',
          expected: 1
        }
      ],
      'Widgets Furniture': [
        // 批量替换两处标准家具价格判断，让普通家具与升级家具都能使用银行卡付款。
        {
          srcmatchgroup: /\$money gte \$_cost/g,
          to: 'maplebirch.VP.finance.canPay($_cost, "furniture")',
          expected: 2
        },
        // 替换自定义家具的独立价格判断；其动态定价不能由上一条标准价格规则覆盖。
        {
          src: '<<if $money gte $_customCost>>',
          to: '<<if maplebirch.VP.finance.canPay($_customCost, "furniture")>>',
          expected: 1
        }
      ],
      'Hairdressers Widgets': [
        // 批量替换七处“当前费用加固定服务价”的判断，覆盖剪发、染发和眉毛护理选项。
        {
          srcmatchgroup: /\$money gte (_currentCost \+ \d+)/g,
          to: 'maplebirch.VP.finance.canPay($1, "hairdressers")',
          expected: 7
        },
        // 替换最终结算阶段仅比较当前总价的一处判断，确保确认服务时仍校验所选账户。
        {
          srcmatchgroup: /\$money gte _currentCost(?! \+)/g,
          to: 'maplebirch.VP.finance.canPay(_currentCost, "hairdressers")',
          expected: 1
        },
        // Sydney 染发使用条件表达式计算附加费，单独替换以完整保留两种原版价格。
        {
          src: '$money gte _currentCost + ($_sydney.hairColour isnot "strawberryblond" ? 3000 : 6000)',
          to: 'maplebirch.VP.finance.canPay(_currentCost + ($_sydney.hairColour isnot "strawberryblond" ? 3000 : 6000), "hairdressers")',
          expected: 1
        },
        // 替换两处“余额不足”反向判断，银行卡足额时不再错误显示现金不足提示。
        {
          srcmatchgroup: /\$money lt _currentCost/g,
          to: '!maplebirch.VP.finance.canPay(_currentCost, "hairdressers")',
          expected: 2
        }
      ]
    }
  });

  // 通过链接区向贝利办公室添加自愿授权入口，不修改原版 passage 源码。
  maplebirch.tool.addTo('CustomLinkZone', {
    widget: [0, 'deadwood-reblooms-finance-bailey-bank-option'],
    passage: "Bailey's Office"
  });

  // 在全局地点说明区域持续显示账户、证券资金与贷款概要。
  maplebirch.tool.addTo('CaptionDescription', {
    widget: 'deadwood-reblooms-finance-caption'
  });
}
