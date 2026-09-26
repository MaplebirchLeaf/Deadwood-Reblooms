# F12 场景检查

在装有模组的游戏中打开开发者工具，切到 Console。以下命令作用于**当前存档**：`V` 对应 SugarCube 的 `$` 变量。请先复制一个测试存档，场景之间重新读入这份测试存档；不要在正在游玩的存档上批量执行。价格、余额、房贷本金和维护费都以**便士**保存（`100` = £1）。

`SugarCube.Engine.play("Passage 名称")` 会直接进入指定 Passage；进入之前仍要准备该场景所需的 `$` 状态。跨日请使用原版 `Time.pass(86400)`，不要直接改 `Time.days` 或 `V.timeStamp`。房产结算游标也在 `V.VanillaPlus.realEstate` 内，读档本身不会补扣费用。

## 中介、购房与分层房间

先在测试存档执行：

```js
V.VanillaPlus.finance.bank.opened = true;
V.VanillaPlus.finance.bank.openedDay = Time.days;
V.VanillaPlus.finance.bank.bankInterestLastDay = Time.days;
V.VanillaPlus.finance.bank.balance = 100_000_000;
SugarCube.Engine.play('Deadwood Reblooms Property Office');
```

中介应显示五处房产，价格从宅邸街 £80,000 至多瑙河街 £600,000。分别在重新读入测试存档后替换下列命令中的 `id`，查看各房屋入口与房间：

```js
var deadwoodPropertyId = 'domus'; // 依次改为 barb、high、cliff、danube；重复粘贴也可重新赋值
maplebirch.VP.realEstate.buy(deadwoodPropertyId);
maplebirch.VP.realEstate.visit(deadwoodPropertyId);
SugarCube.Engine.play('Deadwood Reblooms Property Home');
```

- `domus`、`barb` 为一层；`high`、`cliff` 为两层；`danube` 为三层。沿页面链接走到卧室、浴室、厨房、书桌、客房与休憩空间，核对所在楼层、描述和返回链接。
- 卧室的衣柜、镜子、换睡衣、入睡、起床应可正常使用。`barb` 初始单人床；购买大床后才可邀请一位恋人同住。
- 在中介购买后，可从对应街道的房屋入口进入。若直接跳 Passage，先执行 `visit(deadwoodPropertyId)`，否则页面会按无房产处理。

## 房贷、首付与贝利

从**未买房的测试存档**开始，准备刚好足够的银行首付：

```js
V.VanillaPlus.finance.bank.opened = true;
V.VanillaPlus.finance.bank.openedDay = Time.days;
V.VanillaPlus.finance.bank.bankInterestLastDay = Time.days;
V.VanillaPlus.finance.bank.balance = 4_000_000; // £40,000；barb 首付 £30,000
SugarCube.Engine.play('Deadwood Reblooms Property Office');
```

点击倒钩街房产的「贷款购买」，中介应显示贷款本金、按日利息、每日还款和到期日。随后执行：

```js
V.VanillaPlus.finance.bank.balance = 0;
Time.pass(3 * 86400);
SugarCube.Engine.play('Deadwood Reblooms Property Office');
```

应出现催缴通知与贝利入口。通过页面进入贝利场景；**不要直接跳转到战斗 Passage**，战斗需要前一页设置的 `$fightstart`。在另一份测试存档中继续：

```js
Time.pass(7 * 86400);
SugarCube.Engine.play('Deadwood Reblooms Property Office');
```

应显示房产冻结。再跨过七天且不还款，应有拍卖结果，失去房产；检查余额只增加扣债后的余款，并从原房产退出。房贷正常还清时，`V.VanillaPlus.realEstate.mortgage` 应为 `null`。拍卖后重新购得同一房产，再打开衣柜，确认衣柜恢复可用。

## 出租、维护、装修与拍卖

从未买房的测试存档准备足额银行余额，买两处房产并住进一处：

```js
V.VanillaPlus.finance.bank.opened = true;
V.VanillaPlus.finance.bank.balance = 100_000_000;
maplebirch.VP.realEstate.buy('domus');
maplebirch.VP.realEstate.buy('high');
maplebirch.VP.realEstate.moveIn('domus');
SugarCube.Engine.play('Deadwood Reblooms Property Office');
```

出租 `high` 并记录 `V.VanillaPlus.finance.bank.balance`，跨日后观察净租金与房屋状况。页面可发出七天退租通知；租客退去后，再试装修、修缮和七天自愿拍卖。现居 `domus` 不应能出租或列拍。离开自住房后，孤儿院房间仍保留，`V.renttime` 恢复搬家前的剩余天数。

## 恋人同住与双人床

从未买房的测试存档准备罗宾线路。这里同时设置扩展恋人列表和原版前三位槽位，以便页面和原版剧情都识别当前关系：

```js
V.VanillaPlus.finance.bank.opened = true;
V.VanillaPlus.finance.bank.balance = 100_000_000;
V.robinromance = 1;
V.robinmissing = 0;
V.loveInterestList = ['Robin'];
V.loveInterest = { primary: 'Robin', secondary: 'None', tertiary: 'None' };
maplebirch.VP.realEstate.buy('barb');
maplebirch.VP.realEstate.moveIn('barb');
Time.setTime(23, 0);
SugarCube.Engine.play('Deadwood Reblooms Property Household');
```

未升级单人床时，邀请应提示需要双人床。在卧室购买大床，再回同住页面邀请。好感数值不作为邀请门槛；是否为当前恋人由 `window.isLoveInterest('角色名')` 检查。可在独立测试存档替换为惠特尼、凯拉尔、悉尼，并把 `V.loveInterestList`、`V.loveInterest` 改为同一角色。取消恋人选择后才删除同住记录。

夜间场景以 `NPCSidebarPortrait` 的现有日程地点为准，请启用该模块后分别检查：Robin 在 21:00 至 06:59 的 `sleep`；Whitney 在 00:00 至 06:59 的 `topless`；Kylar 在 00:00 至 06:59 的 `manor_bedroom`；Sydney 在通常 23:00 至 05:59 的 `home`。可在住宅页面用 `maplebirch.npc.Schedule.get('Robin').location` 等命令核对地点。地点不匹配时，起居室、卧室和床边都不应出现该角色；入住记录仍保留。每人再切换较高和较低的创伤、支配、好感或腐化数值，检查不同文本分支。

邀请成功后，在各角色休息时段从起居室选择“一起待一会儿”，或进入卧室。两处的“一起上床”都应进入双人遭遇战，且选择的是页面上那一位同住恋人。检验继续回合、对方高潮、主动结束及打倒对方的不同收尾，再返回自住房卧室。可在准备好入住和日程后，用下列命令直接打开遭遇战首回合：

```js
maplebirch.VP.realEstate.visit('barb');
maplebirch.VP.realEstate.meetResident('Robin', 'barb');
V.sexstart = 1;
SugarCube.Engine.play('Deadwood Reblooms Property Intimacy');
```

把 `Robin` 换成另外三位时，先将当前恋人及同住记录准备为该角色，并把时间设在对应休息时段。再把时间推过早晨的日程边界，检查已经开始的对话和遭遇战不会突然丢失所选伴侣；离开场景后，新互动仍按即时日程出现或消失。新链接的英文标签应在中文界面显示为“一起上床”和“返回卧室”。

目前的同住只在上述休息日程于自住房展示互动，不会接管原版其他地点的 Passage。仍需在游戏里确认这些 Passage 的 NPC 出现条件，例如悉尼神殿场景是否会与住宅场景重叠；不能仅凭住宅内的文本判定原版日程已经整体迁移。

## 自住房镜子与异种癖通道

先购房、搬入并 `visit(id)`，然后在测试存档执行：

```js
V.VanillaPlus.traits.deviancy = true;
V.settings.tentaclesEnabled = true;
V.hallucinations = 2;
Time.setTime(3, 0);
SugarCube.Engine.play('Deadwood Reblooms Property Mirror');
```

应出现穿过镜面的链接。返回触手平原中心时，应能选择“自己的家”的镜子，并回到自住房卧室；孤儿院的普通卧室镜子仍有独立入口。探索标记位于 `V.VanillaPlus.deviancy.mirrors.property`，切换存档后以新存档的值为准。

## 其他模块的入口速查

这些入口用于检查页面能否打开，仍需满足各页面自己的原版条件：

```js
SugarCube.Engine.play('Deadwood Reblooms Financial Centre');
SugarCube.Engine.play('Deadwood Reblooms Financial Centre Bank');
SugarCube.Engine.play('Deadwood Reblooms Financial Centre Securities');
SugarCube.Engine.play('Deadwood Reblooms Life Simulation School Board');
```

战斗 Passage、学校任命结果、仪式结果等都有前置临时变量或原版初始化流程。应从入口沿页面链接检查，避免直接跳到结果页得出误判。
