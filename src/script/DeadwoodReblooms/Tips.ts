// ./src/script/DeadwoodReblooms/Tips.ts

type Tip = readonly [english: string, chinese: string];

// 沿用原版提示池与内容开关，关闭的模块不注册提示。不新增提示弹窗。
export default function Tips(core: typeof maplebirch): void {
  const add = (category: string, ...tips: Tip[]) => {
    core.tool.patch.tips.add(category, ...tips.map(([en, cn]) => `<<lanSwitch ${JSON.stringify(en)} ${JSON.stringify(cn)}>>`));
  };

  add(
    'general',
    ['The mod guide explains where to start, what to prepare and why an option might be missing.', '模组指南可以查入口、准备条件，以及选项为什么没有出现。'],
    ['A familiar face may be elsewhere. Check the time and their usual routine before looking for them.', '熟悉的人也有自己的安排。找不到对方时，先看看时间与日程。']
  );

  if (core.get('VanillaPlus'))
    add(
      'general',
      ['You can open a bank account at the financial centre on the High Street.', '商业街的金融中心可以办理银行账户。'],
      ['Cash and bank savings are separate. A debit card spends your savings, while a credit card uses your remaining credit.', '现金与银行存款分开记录。借记卡使用存款，信用卡使用剩余额度。'],
      ['A payment method accepted in a large shop may not be accepted at a street stall.', '大店铺接受的付款方式，街边小摊未必接受。'],
      ['Buying a home is only the beginning. Leave enough bank savings for its regular bills.', '买下房子只是开始。银行里还要留出定期账单的费用。'],
      ['Your journal lists the next payment date for your property. Check it before spending your savings.', '日志会列出房产的下次结算日期。花掉存款前，不妨先看一眼。'],
      ['Shop for your own home from the furniture shop entrance. Choose the property before choosing its furniture.', '在家具店入口选择为自住房选购家具，先选住宅，再挑家具。'],
      ['A home needs suitable beds and enough room before you can invite someone to move in.', '邀请恋人入住前，住宅需要合适的床位和足够的空间。'],
      ['Living together does not erase old grudges. Not everyone will welcome another housemate.', '住在同一屋檐下不会抹去旧怨。不是所有人都愿意再多一位同住者。'],
      ['A housemate can still leave for work, school or the temple. Their belongings do not mean they are home.', '同住者仍会去工作、上学或神殿。物品留在房里，不代表人也在家。'],
      ['Look outside from a high home to find its gliding options. Suitable wings are still required.', '从高处住宅查看外面，可以寻找滑翔选项。你仍需要能滑翔的翅膀。'],
      ['Reaching a stat limit alone may not unlock a breakthrough. Your experiences matter too.', '属性达到上限，不一定就能突破。你经历过什么也很重要。']
    );

  if (core.get('LifeSimulation'))
    add(
      'general',
      ['The school noticeboard records your duties and progress with school affairs.', '学校公告栏会记录值勤与校园事务的进度。'],
      ['Turning in an exemption form matters as much as your grades. Good results alone do not complete the application.', '申请免课不只看成绩。准备好后，还要实际交表。'],
      ['Morning duty counts different school days. Returning to the noticeboard repeatedly will not speed it up.', '晨间值勤按不同上学日累计。同一天反复查看公告栏不会加快进度。'],
      ['A trial school rule still needs support. Return to the headteacher for its review.', '试行中的校规仍需要支持。到期后，记得回校长办公室复核。'],
      ['A history project starts with the paintings and their records. Finding an unrelated antique is not enough.', '历史项目从画作与记录开始。找到一件无关的古董并不足够。'],
      ['Investigation takes time. Your journal keeps track of the history project deadline.', '调查需要时间。日志会记录历史项目的截止日期。'],
      ['The gym is on Cliff Street. Check its opening hours and your admission before planning a workout.', '健身房在峭壁街。安排训练前，先检查营业时间和入场资格。'],
      ['Training can leave you tired. A rainy day may close the outdoor platform while indoor equipment remains available.', '训练会使你疲劳。雨天可能关闭临海平台，室内器械仍可使用。'],
      ['Tablets bought at the hospital pharmacy are taken manually from your medicine drawer.', '医院药房购买的药片，要在药柜中手动服用。'],
      [
        'The tablet packets advise at least eight hours between doses. <span class="purple">Repeated or prolonged use may cause dependence.</span>',
        '药片包装建议两次服用至少间隔八小时。<span class="purple">反复或长期服用可能形成依赖。</span>'
      ],
      [
        'Wakefulness tablets hide some fatigue for a while. <span class="red">That fatigue returns when they wear off.</span>',
        '提神药暂时压低一部分疲劳。<span class="red">药效消退后，这部分疲劳会回来。</span>'
      ],
      ['Concentration tablets help with actual studying. Swallowing one does not improve your grades by itself.', '专注药提高实际学习的收益。只吞下药片，并不会凭空提高成绩。'],
      ['Sleeping tablets can help you rest, but they do not guarantee peaceful dreams.', '助眠药可以帮助休息，但不保证每一个梦都安稳。']
    );
  if (core.get('LifeSimulation'))
    add('tentacles', [
      'A whip or baton borrowed from the temple can strike a tentacle with a free, unbound hand. Select the tentacle as your target first.',
      '借来的鞭子或短棍可以用空闲且未受缚的手攻击触手。先把具体触手选为目标。'
    ]);

  if (core.get('Robin'))
    add(
      'general',
      ['Robin might mention a problem with the stall. You can discuss improvements later in Robin’s room.', '罗宾可能会提到摊位的问题。之后可以回罗宾的房间商量改造。'],
      [
        'Robin’s living funds, business reserves and money owed to you are different amounts. Check the ledger before offering more.',
        '罗宾的生活资金、营业储备与欠你的借款是三笔账。继续出资前，先看看账本。'
      ],
      ['A shop needs more than money. Applications, inspections and a licence take time too.', '开店不只需要钱。申请、检查与领取许可也需要时间。'],
      ['Robin’s shop can open without Robin being there. A substitute cannot take Robin’s place on a date.', '罗宾不在时，饮品店仍可能营业。代班人员不能代替罗宾陪你约会。']
    );
  if (core.get('Sydney'))
    add(
      'general',
      ['Once a science project is underway, find Sydney during lunch to discuss your next step. Their routine still matters.', '科学项目开始后，可以在午餐时找悉尼讨论下一步。仍要留意对方的日程。'],
      ['Sharing a home does not excuse Sydney from temple duties.', '同住不会免去悉尼的神殿职责。']
    );
  if (core.get('Kylar'))
    add(
      'general',
      ['A key to Kylar’s home and an invitation to your home are different arrangements.', '拿到凯拉尔家的钥匙，与邀请凯拉尔住进你的家，是两种安排。'],
      ['Inviting another housemate may be difficult when Kylar is very jealous.', '凯拉尔嫉妒强烈时，再邀请别人同住可能会引起争执。']
    );
  if (core.get('Whitney')) add('general', ['Whitney’s daily routine still affects when you can spend time together.', '惠特尼的日程仍会影响你们什么时候能相处。']);
  if (core.get('MoreLoveInterestsAndNPCAvatars'))
    add(
      'general',
      [
        '<span class="lewd">Awareness</span> affects how many lovers you can keep. Affection alone does not make room for another.',
        '<span class="lewd">意识</span>影响你能保留几位恋人。好感不能代替恋人名额。'
      ],
      ['Someone eligible to become a lover still needs to be selected in your attitude settings.', '具备恋人资格的人，仍需要你在态度设置中加入恋人名单。'],
      ['Put important lovers near the front of your list. Some situations only recognise the first few.', '把重要的恋人排在名单前面。部分情境只会读取前面的几位。'],
      ['If awareness falls, you may no longer be able to keep everyone on your lover list.', '意识下降后，你可能无法继续保留名单中的所有恋人。']
    );
  if (core.get('MoreTransformations')) add('animalTFs', ['Animal transformations can fade. Look after the form you want to keep.', '动物转化可能衰退。想保留哪一种形态，就要留意维持它。']);
  if (core.get('CelestialAnomalies')) add('weather', ['Unusual skies follow the game’s calendar, not the date on your computer.', '异常天象遵循游戏内的日期，不看电脑上的现实日期。']);
}
