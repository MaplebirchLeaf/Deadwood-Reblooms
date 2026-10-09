// ./src/script/DeadwoodReblooms/Tips.ts

type Tip = readonly [english: string, chinese: string];

export default function Tips(core: typeof maplebirch): void {
  const add = (category: string, ...tips: Tip[]) => {
    core.tool.patch.tips.add(category, ...tips.map(([en, cn]) => `<<lanSwitch ${JSON.stringify(en)} ${JSON.stringify(cn)}>>`));
  };

  add('general', ['People have their own routines. Try looking for them at a different time of day.', '镇上的人各有安排。换个时间，也许能找到你要见的人。']);

  if (core.get('Finance'))
    add(
      'general',
      ['The financial centre on the High Street offers bank accounts and property services.', '商业街的金融中心可以开户，也可以看房。'],
      ['A debit card spends your bank savings. A credit card leaves a bill to pay.', '借记卡用的是银行存款。信用卡花出去的钱，之后还得还。'],
      ['A home comes with bills. Leave something in the bank for its upkeep.', '房子买下来，账单也跟着来了。银行里最好留些维护费。'],
      ['A spare bed can make room for someone you care about.', '多一张合适的床，也许就能让在意的人住下来。'],
      ['A housemate may still be at work, school or the temple when you get home.', '回到家时，同住的人可能还在工作、学校或神殿。'],
      ['Company accounts can tell you more than a rising share price.', '公司的账目，有时比上涨的股价更值得看。'],
      ['Avery keeps papers about the tower in the office. The construction site may answer other questions.', '艾弗里的办公室留着塔楼的文件。有些疑问，去工地看看或许能找到答案。'],
      ['High windows offer a view of the town, and a way down for those with suitable wings.', '高处的窗外是小镇。长着合适翅膀的人，也许能从那里滑翔出去。']
    );

  if (core.get('VanillaPlus')) add('general', ['Pushing your limits takes more than practice. Some experiences leave a lasting change.', '想突破极限，光练习还不够。有些经历会留下长久的改变。']);

  if (core.get('LifeSimulation')) {
    add(
      'general',
      ['A good run at the card tables may earn you something useful for the walk home. Ask at the cashier.', '牌桌上手气好，回家时也许能多一份防身的东西。可以问问筹码柜台的人。'],
      ['The school noticeboard is worth checking if you have duties to attend to.', '有校内事务要处理时，可以看看学校公告栏。'],
      ['Leighton handles requests to arrange your own school attendance.', '想自行安排上课，可以找礼顿谈谈。'],
      ['A history project can begin with a painting in the museum.', '博物馆里的一幅画，也许能成为历史课题的开头。'],
      ['The gym on Cliff Street has indoor equipment for rainy days.', '雨天也可以训练。峭壁街的健身房还有室内器械。'],
      ['The gym offers a training plan to gradually increase your body size.', '健身房有让体型逐步增长的训练计划。'],
      ['Tablets from the hospital pharmacy can be taken from your medicine drawer.', '医院药房买来的药片，可以从药柜中取出服用。'],
      ['<span class="purple">Taking tablets too often can leave you dependent on them.</span>', '<span class="purple">药吃得太勤，也许会越来越离不开它。</span>'],
      ['Wakefulness tablets postpone some fatigue. <span class="red">It catches up when they wear off.</span>', '提神药能暂时压下疲劳。<span class="red">药效过后，疲劳还是会找上来。</span>']
    );
    add('tentacles', ['A whip or baton borrowed from the temple can help against tentacles. Keep a hand free to use it.', '神殿借来的鞭子或短棍，可以用来对付触手。记得留出一只空闲的手。']);
  }

  if (core.get('Robin'))
    add(
      'general',
      ['Robin may have ideas for the stall. Try talking in Robin’s room after a day at the beach or park.', '摆摊回来后，可以去罗宾的房间聊聊。罗宾也许想到了改进的办法。'],
      ['Robin keeps money aside for rent and the shop. The ledger shows what is left to spend.', '罗宾会为房租和店铺留钱。账本上能看出还有多少可以动用。'],
      ['Opening a shop takes paperwork as well as money.', '开店需要资金，也需要跑手续。'],
      ['A substitute can keep Robin’s shop open while Robin is elsewhere.', '罗宾有别的安排时，可以请人照看店铺。']
    );

  if (core.get('Sydney'))
    add(
      'general',
      ['Sydney may have time to discuss your science project over lunch.', '吃午饭时，也许能和悉尼聊聊科学课题。'],
      ['Sydney still has duties at the temple, even when you share a home.', '即使住在一起，悉尼也还有神殿的工作要做。']
    );

  if (core.get('Kylar')) add('general', ['Kylar may watch your other housemates closely.', '凯拉尔可能会格外留意你的其他同住者。']);
  if (core.get('Whitney')) add('general', ['Whitney sometimes lingers near the docks. A quiet moment may be a chance to talk.', '惠特尼有时会在码头逗留。周围安静下来，也许是说话的机会。']);

  if (core.get('Orchard'))
    add(
      'general',
      ['Rain waters the orchard. Dry weather leaves more work for you or your hired help.', '下雨能替果园浇水。天气干燥时，就得由你或雇工多照看。'],
      ['Fruit set aside for an order may be worth more than a quick sale.', '有订单等着交货时，留下一些水果也许比急着卖掉更划算。']
    );

  if (core.get('BirdTower')) add('general', ['Hawk chicks grow quickly. There may be something new to see when you return to the nest.', '小鹰长得很快。下次回巢，也许就能看到新的变化。']);

  if (core.get('MoreLoveInterestsAndNPCAvatars'))
    add(
      'general',
      ['<span class="lewd">Awareness</span> affects how many lovers you can keep.', '<span class="lewd">意识</span>会影响你能保留几位恋人。'],
      ['The order of your lovers matters. Some encounters recognise those at the front of the list.', '恋人名单的顺序也有影响。有些场合会先认出排在前面的人。']
    );

  if (core.get('MoreTransformations')) add('animalTFs', ['Some jewellery can help you keep an animal form.', '有些饰品能帮助你维持动物形态。']);
  if (core.get('CelestialAnomalies')) add('weather', ['The sky sometimes changes in unexpected ways. It may be worth watching.', '天空有时会出现意料之外的变化。可以抬头看看。']);
}
