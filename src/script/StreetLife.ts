import Detective from './StreetLife/Detective';
import SmugglerPub from './StreetLife/SmugglerPub';

export default function StreetLife(maplebirch: typeof window.maplebirch): void {
  const weaponTrait = () => {
    // 原版 clothingtrait 按 type 读取这张表及同名图标，物品标识不能只有 type 而没有说明。
    setup.shopDetails.weapon = {
      name: maplebirch.t('deadwood-reblooms:clothing-type:weapon:name'),
      desc: maplebirch.t('deadwood-reblooms:clothing-type:weapon:description'),
      details: maplebirch.t('deadwood-reblooms:clothing-type:weapon:details')
    };
  };
  maplebirch.tool.onInit(weaponTrait);
  maplebirch.on(':language', weaponTrait);
  // 服装目录独立于模块开关加载，类型说明常驻，玩法只在模块启用时接入。
  if (!maplebirch.get('StreetLife')) return;
  maplebirch.tool.patch.traits.add(
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:street:trait:bounty_hunter:name'),
      colour: 'green',
      has: () => maplebirch.get('StreetLife')?.bounties.bountyHunter === true,
      text: () => maplebirch.t('deadwood-reblooms:street:trait:bounty_hunter:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:street:trait:seasoned_driver:name'),
      colour: 'green',
      has: () => maplebirch.get('StreetLife')?.races.seasonedDriver === true,
      text: () => maplebirch.t('deadwood-reblooms:street:trait:seasoned_driver:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:street:trait:crew_leader:name'),
      colour: 'green',
      has: () => maplebirch.get('StreetLife')?.heist.crewLeader === true,
      text: () => maplebirch.t('deadwood-reblooms:street:trait:crew_leader:text')
    }
  );
  Detective(maplebirch);
  SmugglerPub(maplebirch);
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-street-detective-link', passage: 'Police Station' });
  maplebirch.tool.addTo('Journal', 'deadwood-street-bounty-journal');
  maplebirch.tool.addTo('Journal', 'deadwood-street-ammunition-journal');
  maplebirch.tool.addTo('ReputationModify', 'deadwood-street-police-reputation');
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-street-bailey-link', passage: ["Bailey's Office", 'Flats'] });
  // 强制转场只收束本案敌人，原版逮捕、昏倒和救援仍先执行。
  maplebirch.dynamic.regStateEvent('gate', 'deadwood-heist-campaign-interrupted', {
    cond: () => {
      if (V.replayScene || V.statFreeze || V.frozenValues) return false;
      const heist = maplebirch.get('StreetLife')?.heist;
      const campaign = heist?.state.campaign;
      return (
        !!campaign &&
        ((!!campaign.fight?.combat_started && !V.combat) ||
          (campaign.bank_step === 8 && heist.state.stage === 'settlement' && campaign.gold.bars > 0 && maplebirch.passage.title !== 'Deadwood Street Heist') ||
          (maplebirch.passage.title === 'Police Cell' && (heist.inAction || [campaign.dock.stage, campaign.reception.stage].some(stage => stage > 0 && stage < 5))))
      );
    },
    action: () => {
      const heist = maplebirch.get('StreetLife')!.heist;
      const campaign = heist.state.campaign!;
      if (campaign.fight?.combat_started) {
        const fight = campaign.fight;
        if (fight.keys.some((key, index) => V.NPCList[index]?.per === key)) maplebirch.SugarCube.Wikifier.wikifyEval('<<endevent>>');
        for (const key of fight.keys) if (V.per_npc[key]) maplebirch.SugarCube.Wikifier.wikifyEval(`<<clearNPC '${key}'>>`);
        fight.combat_started = false;
        fight.result = 'lost';
      }
      // 撤离耗时中的逮捕会没收尚未藏妥的黄金，后来再次被捕不追溯已藏好的货。
      if (campaign.bank_step === 8 && heist.state.stage === 'settlement') {
        campaign.bank_step = 9;
        if (maplebirch.passage.title === 'Police Cell') {
          heist.state.outcome = 'arrested';
          heist.state.loot = 0;
          campaign.gold.bars = 0;
          campaign.gold.value = 0;
        }
      }
      if (maplebirch.passage.title !== 'Police Cell') return;
      for (const record of [campaign.dock, campaign.reception]) {
        if (record.stage > 0 && record.stage < 5) {
          record.stage = 5;
          record.result = 'failed';
          record.loot = 0;
        }
      }
      const bankFights = ['Deadwood Street Bank Fight Result', 'Deadwood Street Bank Regroup Result'];
      if (heist.state.outcome === 'arrested' && campaign.fight && bankFights.includes(campaign.fight.return_passage)) campaign.fight = null;
      if (heist.inAction) {
        heist.state.stage = 'settlement';
        heist.state.outcome = 'arrested';
        heist.state.loot = 0;
        campaign.gold.bars = 0;
        campaign.gold.value = 0;
        if (campaign.fight && bankFights.includes(campaign.fight.return_passage)) campaign.fight = null;
      }
    }
  });
  maplebirch.dynamic.regStateEvent('gate', 'deadwood-street-fight-interrupted', {
    cond: () => {
      if (V.replayScene || V.statFreeze || V.frozenValues) return false;
      const street = maplebirch.get('StreetLife');
      if (!street || !V.StreetLife?.bounties || !V.StreetLife.heist || !V.StreetLife.bailey) return false;
      const work = street.bounties;
      const heist = street.heist;
      return (
        (!!work.fight?.combatStarted && !V.combat) ||
        (maplebirch.passage.title === 'Police Cell' && (!!work.state.active || (!heist.state.campaign && (heist.inAction || (heist.state.stage === 'settlement' && heist.state.loot > 0)))))
      );
    },
    action: () => {
      const street = maplebirch.get('StreetLife');
      if (!street || !V.StreetLife?.bounties || !V.StreetLife.heist || !V.StreetLife.bailey) return;
      const work = street.bounties;
      const heist = street.heist.state;
      // 原版逮捕或强制转场可能离开自有页面，在这里收束未结束的行动，保留原版判刑。
      if ((!heist.campaign && maplebirch.passage.title === 'Police Cell' && (street.heist.inAction || (heist.stage === 'settlement' && heist.loot > 0))) || (work.fightingHeist && !V.combat)) {
        const actor = heist.fight?.key ?? (heist.stage === 'challenge' ? 'deadwood_heist_guard' : undefined);
        if (actor && V.NPCList[0]?.per === actor) maplebirch.SugarCube.Wikifier.wikifyEval('<<endevent>>');
        if (actor && V.per_npc[actor]) maplebirch.SugarCube.Wikifier.wikifyEval(`<<clearNPC '${actor}'>>`);
        heist.fight = null;
        heist.loot = 0;
        heist.outcome = maplebirch.passage.title === 'Police Cell' ? 'arrested' : 'failed';
        heist.stage = 'settlement';
      }
      if (maplebirch.passage.title === 'Police Cell' && work.state.active) {
        const job = work.state.active;
        if (V.NPCList[0]?.per === job.key) maplebirch.SugarCube.Wikifier.wikifyEval('<<endevent>>');
        if (V.per_npc[job.key]) maplebirch.SugarCube.Wikifier.wikifyEval(`<<clearNPC '${job.key}'>>`);
        work.state.last = { id: job.id, outcome: 'interrupted', fee: 0 };
        work.state.active = null;
      }
      const fight = work.fight!;
      if (!fight) return;
      fight.combatStarted = false;
      if (work.fightingCargo) {
        if (V.NPCList[0]?.per === fight.key) maplebirch.SugarCube.Wikifier.wikifyEval('<<endevent>>');
        if (V.per_npc[fight.key]) maplebirch.SugarCube.Wikifier.wikifyEval(`<<clearNPC '${fight.key}'>>`);
        const bailey = street.bailey.state;
        bailey.fight = null;
        bailey.resolution = 'failed';
      } else if (work.fightingHunter) {
        if (V.NPCList[0]?.per === fight.key) maplebirch.SugarCube.Wikifier.wikifyEval('<<endevent>>');
        if (V.per_npc[fight.key]) maplebirch.SugarCube.Wikifier.wikifyEval(`<<clearNPC '${fight.key}'>>`);
        work.state.hunter = null;
      } else {
        work.state.active!.stage = 'failed';
        work.state.active!.vehicle = null;
      }
    }
  });
  maplebirch.dynamic.regStateEvent('append', 'deadwood-street-bounty-hunter', {
    extra: { match: / Street$/ },
    // 原文及普通街道菜单已完成，才能拦路，强制事件没有当页 Bus 链接。
    cond: () => {
      const street = maplebirch.get('StreetLife');
      if (!street || !V.StreetLife?.bounties || !V.StreetLife.heist || !V.StreetLife.bailey) return false;
      const bounty = street.bounties;
      return (
        bounty.available &&
        Array.isArray(V.link_table) &&
        V.link_table.some(entry => entry.includes('|Bus]]')) &&
        (bounty.state.hunter ? bounty.state.hunter.stage === 'approach' && bounty.state.hunter.source === maplebirch.passage.title : bounty.state.hunterDay !== Math.floor(Time.days))
      );
    },
    action: () => maplebirch.get('StreetLife')?.bounties.checkHunter(),
    output: 'deadwood-street-hunter-entry'
  });
  maplebirch.tool.addTo('Reputation', 'deadwood-street-reputation');
  maplebirch.tool.addTo('WeaponBox', 'deadwood-street-firearm-effectiveness');
  maplebirch.tool.addTo('Journal', 'deadwood-street-job-journal');
  maplebirch.tool.addTo('Journal', 'deadwood-street-story-journal');
  maplebirch.tool.addTo('Journal', 'deadwood-street-race-journal');
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-street-shop-link', passage: 'Smuggler Pub' });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-street-unload', match: / Street$/ });
  maplebirch.tool.inject({
    locationPassage: {
      'Farm Road 1': [
        {
          // 普通公路菜单的进城选项前，避开昏倒、来车逼近与搭便车事件。
          src: '<<entertownicon>>',
          applybefore: '<<deadwood-street-race-link>>\n\t',
          expected: 1
        }
      ],
      'Smuggler Pub': [
        {
          // 原版正常菜单的下水道出口前，不插入 Zephyr 强制事件或 Wren 初遇。
          src: '<<sewericon>>',
          applybefore: "<<deadwood-street-story-entry 'smuggler'>>\n<<deadwood-street-heist-link>>\n<<deadwood-street-mickey-link>>\n<<deadwood-heist-aftermath-entry>>\n",
          expected: 1
        }
      ],
      'Ocean Breeze': [
        {
          // 普通咖啡馆菜单的离店选项前，避开 Sam 剧情及昏倒，营业状态由货物入口重验。
          src: '<<clifficon>>',
          applybefore: "<<deadwood-street-cargo-link 'cafe'>>\n",
          expected: 1
        }
      ],
      Docks: [
        {
          // 码头总览的原版衣物检查前，委托入口排除夜间封锁，不进入潜入事件。
          src: '<<storeon "docks" "check">>',
          applybefore: "<<deadwood-street-cargo-link 'docks'>>\n<<deadwood-heist-case-entry>>\n<<deadwood-heist-aftermath-entry>>\n",
          expected: 1
        }
      ],
      Bedroom: [{ src: '<<deskText "noicon">>', applybefore: '<<deadwood-heist-aftermath-entry>>\n', expected: 1 }],
      'Police Station': [{ src: '<<barbicon>>', applybefore: '<<deadwood-heist-aftermath-entry>>\n', expected: 1 }],
      "Briar's Office": [{ src: '<<if isPubfameTaskAccepted("briar")>>', applybefore: '<<deadwood-heist-aftermath-entry>>\n', expected: 1 }],
      'School Library': [
        {
          // 原版日常自习菜单内，强制争执与昏倒分支不走这里。
          src: '<<projectoptions>>',
          applybefore: "<<deadwood-street-cargo-link 'library'>>\n",
          expected: 1
        }
      ],
      'Town Hall': [{ src: '<<loitericon>>', applybefore: '<<deadwood-heist-case-entry>>\n', expected: 1 }],
      'Town Hall Wait': [
        {
          // 已按原版排队二十分钟、轮到前台办理，保留随后出现的原版委托。
          src: '<<if $hookah_plot is 1>>',
          applybefore: "<<deadwood-street-cargo-link 'townhall'>>\n<<deadwood-heist-aftermath-entry>>\n",
          expected: 1
        }
      ],
      'Tailor Shop': [
        {
          // 普通店员分支的修补选项前，继承裸露、压力、闭店与二十一点清场规则。
          src: '<<if $tailor_cost gte 1',
          applybefore: "<<deadwood-street-cargo-link 'tailor'>>\n",
          expected: 1
        }
      ],
      'Hospital Foyer': [
        {
          // 原版药房入口所在的普通菜单，继承压力、裸露与急救分支，不打断医院事件。
          src: '<<pillicon>>',
          applybefore: "<<deadwood-street-cargo-link 'hospital'>>\n<<deadwood-heist-aftermath-entry>>\n\t\t",
          expected: 1
        }
      ],
      'Industrial Alleyways': [
        {
          // 原版普通探索分支的梯子选项前，不穿过街头遭遇或泳池聚会的强制入口。
          src: '<<laddericon>>',
          applybefore: "<<deadwood-street-cargo-link 'alley'>>\n\t\t",
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Pub': [
        {
          // 与原版兰德里选项一同出现，独占的艾弗里与 Wren 介绍段不调用此 widget。
          src: '<<widget "landryoptions">>',
          applyafter: '\n\t<<deadwood-street-landry-link>>',
          expected: 1
        }
      ],
      'Clothing Shop v2 Widgets': [
        {
          // 酒馆夜间仍营业，其它商店的闭店偷窃分支维持原样。
          src: '$shopName isnot "forest"',
          applyafter: ' and $shopName isnot "deadwoodStreet"',
          expected: 1
        },
        {
          // 与副手功能重复时只禁用手持和试拿，仍允许购买送入衣柜。
          src: '<<shopBuyItemStatus _wardrobeSlots>>',
          applyafter: '\n<<if $shopName is "deadwoodStreet" and !(maplebirch.get("LifeSimulation")?.hands.prepare(_temp_choice, "handheld") ?? true)>><<set _wearingBlocked to true>><</if>>',
          expected: 1
        }
      ]
    }
  });
  for (const hand of ['left', 'right'] as const) {
    maplebirch.combat.CombatAction.reg({
      id: `street-weapon-${hand}`,
      actionType: hand === 'left' ? 'leftaction' : 'rightaction',
      combatType: 'Default',
      cond: () => maplebirch.get('StreetLife')?.canUse(hand) === true,
      display: () => {
        const item = V.worn[hand === 'left' ? 'handheld_left' : 'handheld'];
        const data = setup.clothes.handheld[item.index];
        return data.streetWeapon ? lanSwitch(`Fire ${data.name}`, `使用${data.cn_name_cap}开火`) : lanSwitch(`Use ${data.name}`, `使用${data.cn_name_cap}`);
      },
      value: () => `streetWeapon${hand}`,
      color: 'def',
      difficulty: () => {
        const firearm = setup.clothes.handheld[V.worn[hand === 'left' ? 'handheld_left' : 'handheld'].index].streetWeapon;
        if (!firearm) return '';
        const rounds = V.StreetLife.ammo[firearm.ammo];
        const shots = Math.min(firearm.shots, rounds);
        return lanSwitch(`${rounds} rounds remaining · Fires ${shots} round${shots === 1 ? '' : 's'}`, `剩余 ${rounds} 发 · 本次耗弹 ${shots} 发`);
      },
      effect: `<<deadwood-street-weapon '${hand}'>>`
    });
  }
}
