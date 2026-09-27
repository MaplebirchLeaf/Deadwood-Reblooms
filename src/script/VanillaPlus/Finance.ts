export default function Finance(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('Journal', 'deadwood-reblooms-finance-journal');

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

  // 地点列表前有昼夜分支和地图链接，链接索引不固定；按办公楼分支定位金融中心。
  maplebirch.tool.inject({
    locationPassage: {
      'High Street': [
        // 在原版 Avery 分支判断前插入金融中心入口；锚点是稳定宏语句，不依赖英汉显示文本。
        {
          src: '<<if $avery_fate is "ascended">>',
          applybefore: '<<deadwood-reblooms-finance-high-street>>\n\t\t',
          expected: 1
        }
      ],
      // 这些原版地点分别判断能否交租；授权后把银行余额计入可支付金额。
      'Rent Seduce': [
        // 放宽两个诱惑交租选项的金额判断：贝利获授权后，随身现金与银行余额均可用于足额交租。
        {
          srcmatchgroup: /<<if \$money gte \$rentmoney \+ \(\$babyRent or 0\)>>/g,
          to: '<<if $money + ($VanillaPlus.finance.bank.bailey_knows_account ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 2
        }
      ],
      'Temple Prayer': [
        // 放宽两个神殿代缴租金选项的金额判断，使其与贝利授权后的银行扣款规则保持一致。
        {
          srcmatchgroup: /<<if \$money gte \$rentmoney \+ \(\$babyRent or 0\)>>/g,
          to: '<<if $money + ($VanillaPlus.finance.bank.bailey_knows_account ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
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
        // 原版只有日光浴，DoLP 还提供美白服务；两处价格判断都交给支付方式检查。
        {
          srcmatchgroup: /<<if \$money gte _price>>/g,
          to: '<<if maplebirch.VP.finance.canPay(_price, "spa")>>',
          expected: 1
        }
      ],
      'Shopping Centre': [
        // 购物中心四个直接售卖选项改查三种支付方式；购买后的 money 宏统一决定实际扣款账户。
        {
          srcmatchgroup: /\$money gte (5000|10000|1000|200000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "shopping")',
          expected: 4
        }
      ],
      'Pet Shop': [
        // 宠物店设备升级与笔记本共十个现金门槛，统一改为商户购买力判断。
        {
          srcmatchgroup: /\$money gte (2000|20000|50000|100000|150000|500000|750000|1500000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "petShop")',
          expected: 10
        }
      ],
      'Pet Shop Treats': [
        // 宠物零食各档数量共享同一支付规则，银行卡可用时不再隐藏购买链接。
        {
          srcmatchgroup: /\$money gte (100|1000|5000|10000|20000|50000|100000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "petShop")',
          expected: 7
        }
      ],
      'Hospital Paternity Test': [
        // 按实际标价 £5,000 检查三种支付方式，同时修正原版误写成 £50 的门槛。
        {
          src: '<<if $money gte 5000>>',
          to: '<<if maplebirch.VP.finance.canPay(500000, "hospitalPaternityTest")>>',
          expected: 1
        }
      ],
      'Hospital Breast Enlargement 2': [
        // 隆胸费用随目标尺寸变化，确认页改用完整动态金额检查银行卡购买力。
        {
          src: '<<if $money gte (($phase - $player.breastsize) * 500000)>>',
          to: '<<if maplebirch.VP.finance.canPay(($phase - $player.breastsize) * 500000, "hospitalBreastEnlargement")>>',
          expected: 1
        }
      ],
      'Hospital Breast Reduction 2': [
        // 缩胸确认页按动态手术费用检查现金、借记卡和信用卡。
        {
          src: '<<if $money gte (($player.breastsize - $phase) * 200000)>>',
          to: '<<if maplebirch.VP.finance.canPay(($player.breastsize - $phase) * 200000, "hospitalBreastReduction")>>',
          expected: 1
        }
      ],
      'Hospital Penis Enlargement 2': [
        // 阴茎增大确认页按动态手术费用检查全部可用支付方式。
        {
          src: '<<if $money gte (($phase - ($player.penissize - 2)) * 500000)>>',
          to: '<<if maplebirch.VP.finance.canPay(($phase - ($player.penissize - 2)) * 500000, "hospitalPenisEnlargement")>>',
          expected: 1
        }
      ],
      'Hospital Penis Reduction 2': [
        // 阴茎缩小确认页按动态手术费用检查全部可用支付方式。
        {
          src: '<<if $money gte ((($player.penissize - 2) - $phase) * 200000)>>',
          to: '<<if maplebirch.VP.finance.canPay((($player.penissize - 2) - $phase) * 200000, "hospitalPenisReduction")>>',
          expected: 1
        }
      ],
      'Hospital Parasite': [
        // 私人除虫手术的 £250 门槛改为三种支付方式联合判断。
        {
          src: '<<if $money gte 25000>>',
          to: '<<if maplebirch.VP.finance.canPay(25000, "hospitalParasiteRemoval")>>',
          expected: 1
        }
      ],
      'Hospital Tattoo Removal': [
        // 纹身移除手术的 £2,000 门槛改为三种支付方式联合判断。
        {
          src: '<<if $money gte 200000>>',
          to: '<<if maplebirch.VP.finance.canPay(200000, "hospitalTattooRemoval")>>',
          expected: 1
        }
      ],
      'Pharmacy Sale': [
        // 药房通用结算页按当前商品价格检查所有支付方式。
        {
          src: '<<if $money gte $pharmacyItem.price>>',
          to: '<<if maplebirch.VP.finance.canPay($pharmacyItem.price, "pharmacy")>>',
          expected: 1
        }
      ],
      'Pharmacy Seduction': [
        // 药房交涉失败后的正常购买分支也使用相同的银行卡购买力判断。
        {
          src: '<<if $money gte $pharmacyItem.price>>',
          to: '<<if maplebirch.VP.finance.canPay($pharmacyItem.price, "pharmacy")>>',
          expected: 1
        }
      ],
      'Pharmacy Encounter Sex Finish': [
        // 药房遭遇结束后的三个购买分支统一检查现金、借记卡和信用卡。
        {
          srcmatchgroup: /\$money gte \$pharmacyItem\.price/g,
          to: 'maplebirch.VP.finance.canPay($pharmacyItem.price, "pharmacy")',
          expected: 3
        }
      ],
      'Pharmacy Ask Custom Lenses': [
        // 定制隐形眼镜的普通与加急报价均检查三种支付方式。
        {
          srcmatchgroup: /\$money gte (50000|95000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "pharmacyContacts")',
          expected: 3
        }
      ],
      'Pharmacy Lenses': [
        // 普通隐形眼镜购买入口允许使用借记卡或信用卡。
        {
          src: '<<if $money gte 20000>>',
          to: '<<if maplebirch.VP.finance.canPay(20000, "pharmacyContacts")>>',
          expected: 1
        }
      ],
      'Pharmacy Morning After pill': [
        // 紧急避孕药的两个正常购买入口统一检查全部支付方式。
        {
          srcmatchgroup: /\$money gte 50000\b/g,
          to: 'maplebirch.VP.finance.canPay(50000, "pharmacyAfterPill")',
          expected: 2
        }
      ],
      'Pharmacy Buy Condoms in Bulk': [
        // 批量安全套的最低资金门槛改查任一可用支付方式。
        {
          src: '<<elseif $money lt 60000>>',
          to: '<<elseif !maplebirch.VP.finance.canPay(60000, "pharmacyCondoms")>>',
          expected: 1
        },
        // 固定 25 与 50 包报价使用联合购买力判断。
        {
          srcmatchgroup: /\$money gte (25 \* 6000|50 \* 6000)/g,
          to: 'maplebirch.VP.finance.canPay($1, "pharmacyCondoms")',
          expected: 2
        },
        // 折扣批量报价计算到 _price 后，再用同一支付规则检查三个动态档位。
        {
          srcmatchgroup: /\$money gte _price/g,
          to: 'maplebirch.VP.finance.canPay(_price, "pharmacyCondoms")',
          expected: 3
        }
      ],
      'Ocean Breeze': [
        // 咖啡馆的固定价格判断统一检查现金、借记卡和信用卡；DoLP 另有耳黏液请求分支。
        {
          srcmatchgroup: /\$money gte (200|300|500|600|700|1000|5000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "cafe")',
          expected: 13
        }
      ],
      'Gwylan Ocean Breeze Watch': [
        // Gwylan 咖啡馆场景中的固定餐费与代 Robin 付款都允许使用银行卡。
        {
          srcmatchgroup: /\$money gte (200|500|600|700|1000|5000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "cafe")',
          expected: 6
        },
        {
          src: '$money gte _foodCost * 100',
          to: 'maplebirch.VP.finance.canPay(_foodCost * 100, "cafe")',
          expected: 1
        }
      ],
      Arcade: [
        // 街机厅两个 £5 入口按全部可用支付方式判断。
        {
          srcmatchgroup: /\$money gte 500\b/g,
          to: 'maplebirch.VP.finance.canPay(500, "arcade")',
          expected: 2
        }
      ],
      // 街机事件中的重复游玩入口分别存在于独立 Passage，逐一替换以避免宽泛匹配。
      'Arcade Play': [{ src: '$money gte 500', to: 'maplebirch.VP.finance.canPay(500, "arcade")', expected: 1 }],
      'Arcade Keep Playing': [{ src: '$money gte 500', to: 'maplebirch.VP.finance.canPay(500, "arcade")', expected: 1 }],
      'Arcade Shove': [{ src: '$money gte 500', to: 'maplebirch.VP.finance.canPay(500, "arcade")', expected: 1 }],
      'Arcade Watched Play': [{ src: '$money gte 500', to: 'maplebirch.VP.finance.canPay(500, "arcade")', expected: 1 }],
      'Arcade Watched Stop': [{ src: '$money gte 500', to: 'maplebirch.VP.finance.canPay(500, "arcade")', expected: 1 }],
      'Dance Studio': [
        // 舞蹈、高跟鞋与瑜伽课程的三个学费门槛支持银行卡。
        {
          srcmatchgroup: /\$money gte (1200|2200)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "danceStudioLessons")',
          expected: 3
        }
      ],
      'Pub Drink': [
        // 酒吧续杯与请客的十二个 £5 选项使用统一商户购买力。
        {
          srcmatchgroup: /\$money gte 500\b/g,
          to: 'maplebirch.VP.finance.canPay(500, "pub")',
          expected: 12
        }
      ],
      'Pub Flirt': [
        // 酒吧调情场景的四个购酒选项支持银行卡。
        {
          srcmatchgroup: /\$money gte 500\b/g,
          to: 'maplebirch.VP.finance.canPay(500, "pub")',
          expected: 4
        }
      ],
      'Pub Music': [
        // 点歌与打赏的三档正规消费支持银行卡。
        {
          srcmatchgroup: /\$money gte (100|500|3000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "pub")',
          expected: 3
        }
      ],
      Pub: [
        // 只放宽两种正常酒水购买，不接管黑帮贿赂。
        {
          srcmatchgroup: /\$money gte (1000|2000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "pubAlcohol")',
          expected: 2
        }
      ],
      'Riding School': [
        // 骑术课程的 £25 学费允许使用银行卡。
        {
          src: '<<if $money gte 2500>>',
          to: '<<if maplebirch.VP.finance.canPay(2500, "ridingLessons")>>',
          expected: 1
        }
      ],
      'Tattoo Parlour': [
        // 纹身店入口按 £500 检查三种支付方式。
        {
          src: '<<if $money lt 50000>>',
          to: '<<if !maplebirch.VP.finance.canPay(50000, "tattoo")>>',
          expected: 1
        }
      ],
      'Adult Shop Buy Lube in Bulk': [
        // 批量润滑剂的最低价格和五个动态报价都支持银行卡。
        {
          src: '<<elseif $money lt 20000>>',
          to: '<<elseif !maplebirch.VP.finance.canPay(20000, "lube")>>',
          expected: 1
        },
        {
          srcmatchgroup: /\$money gte _price/g,
          to: 'maplebirch.VP.finance.canPay(_price, "lube")',
          expected: 5
        }
      ]
    },
    widgetPassage: {
      'Gwylan Widgets': [
        // Gwylan 的菜单价格判断支持现金与银行卡；DoLP 还加入蜂蜜面包。
        {
          srcmatchgroup: /\$money gte (200|300|500|600|700|1000|5000)\b/g,
          to: 'maplebirch.VP.finance.canPay($1, "cafe")',
          expected: 7
        }
      ],
      'Widgets Arcade': [
        // 共用街机组件的继续游玩入口按全部支付方式检查 £5。
        {
          src: '$money gte 500',
          to: 'maplebirch.VP.finance.canPay(500, "arcade")',
          expected: 1
        }
      ],
      'Bait Shop Widgets': [
        // 鱼饵与试穿装备分别按实际价格检查正规支付方式。
        {
          src: '<<if $money gte 600>>',
          to: '<<if maplebirch.VP.finance.canPay(600, "fishing")>>',
          expected: 1
        },
        {
          src: '$tryOn.value lte $money',
          to: 'maplebirch.VP.finance.canPay($tryOn.value, "clothes")',
          expected: 1
        }
      ],
      'Toy Shop Widgets': [
        // 玩具选项按选中商品价格检查现金、借记卡与信用卡。
        {
          src: '$selectedToy.cost lte $money',
          to: 'maplebirch.VP.finance.canPay($selectedToy.cost, "toyShop")',
          expected: 1
        }
      ],
      // 原版各条收租路线没有统一的支付入口，所以只替换相同的金额判断。
      'Widgets Rent': [
        // 放宽 Widgets Rent 中两个可交租分支的前置判断，授权账户余额可以补足随身现金。
        {
          srcmatchgroup: /<<if \$money gte \$rentmoney \+ \(\$babyRent or 0\)>>/g,
          to: '<<if $money + ($VanillaPlus.finance.bank.bailey_knows_account ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 2
        },
        // 在最终 money 扣款前按授权从银行补足现金；原版宏仍负责租金统计、音效与后续结算。
        {
          src: '\t<<money `-($rentmoney + ($babyRent or 0))` "baileyRent">>',
          applybefore: '\t<<if $VanillaPlus.finance.bank.bailey_knows_account>>\n\t\t<<run maplebirch.VP.finance.prepareBaileyRent($rentmoney + ($babyRent or 0))>>\n\t<</if>>\n',
          expected: 1
        }
      ],
      'Farm Widgets': [
        // 放宽农场路线中的交租判断，避免授权账户有钱却因随身现金不足而隐藏付款选项。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.bailey_knows_account ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 1
        }
      ],
      'Widgets Temple': [
        // 放宽神殿通用组件中的交租判断，使银行授权覆盖该条原版租金结算路线。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.bailey_knows_account ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 1
        }
      ],
      'Widgets Actions Speak': [
        // 放宽对话动作组件中的交租判断，使对话内付款也能读取已授权的银行余额。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.bailey_knows_account ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
          expected: 1
        }
      ],
      'Widgets Effects Man': [
        // 放宽人物效果组件中的交租判断，覆盖该组件生成的另一条原版租金付款入口。
        {
          src: '<<if $money gte $rentmoney + ($babyRent or 0)>>',
          to: '<<if $money + ($VanillaPlus.finance.bank.bailey_knows_account ? $VanillaPlus.finance.bank.balance : 0) gte $rentmoney + ($babyRent or 0)>>',
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
