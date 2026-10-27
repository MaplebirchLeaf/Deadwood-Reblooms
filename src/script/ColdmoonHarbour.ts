export default function ColdmoonHarbour(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.patch.location.configure(
    'deadwood_coldmoon_harbour',
    {
      folder: 'coldmoon-harbour',
      base: {
        default: { condition: () => !Time.isBloodMoon(), image: 'base.png' },
        bloodMoon: { condition: () => Time.isBloodMoon(), image: 'blood-moon.png' }
      },
      weather: {
        fogDistributionCurve: 1,
        rainSplashEnabled: true,
        fogEnabled: true,
        groundBounds: { splashes: { top: 6, bottom: 0 }, fog: { top: 18, bottom: 0 } }
      }
    },
    { overwrite: true }
  );
  maplebirch.tool.onInit(() => {
    setup.addlocation('deadwood_ghost_ship').parent('sea').location().inside().build();
    maplebirch.tool.patch.location.configure('deadwood_ghost_ship', { customMapping: () => 'deadwood_coldmoon_harbour' });
    const originalMapping = setup.Locations.seadocks;
    const originalImage = Object.hasOwn(setup.LocationImages, 'seadocks') ? 'seadocks' : 'home';
    // 仅替换本组港湾页面的侧栏画面，保留原版地点与其他码头页面的映射。
    maplebirch.tool.patch.location.configure('seadocks', {
      customMapping: () => {
        if (maplebirch.passage.title.startsWith('Deadwood Coldmoon Harbour')) return 'deadwood_coldmoon_harbour';
        return typeof originalMapping === 'function' ? originalMapping.call(setup.Locations) : originalImage;
      }
    });
    maplebirch.tool.patch.location.apply();
  });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Pirates': [
        {
          srcmatch: /<<widget "events_pirate_deck">>\s*<<cleareventpool>>/,
          applyafter: '\n\t<<deadwood-pirate-raid-pool>>',
          expected: 1
        }
      ]
    },
    locationPassage: {
      'Mer Street': [{ src: '<<merpiericon>>', applybefore: '<<deadwood-harbour-link>>\n\t\t', expected: 1 }],
      'Pirate Zephyr': [{ src: '<<getouticon>>', applybefore: '<<deadwood-harbour-zephyr-link>>\n', expected: 1 }],
      'Smuggler Pub Zephyr': [{ srcmatch: /<<link \[\[[^\]]+\|Smuggler Pub\]\]>>/, applybefore: '<<deadwood-harbour-zephyr-link>>\n', expected: 1 }],
      'Pirate Return 2': [{ src: '$spear_vessel is "zephyr"', to: '$spear_vessel is "Zephyr"', expected: 1 }]
    }
  });
  maplebirch.tool.addTo('Journal', 'deadwood-harbour-journal', 'deadwood-pirate-raid-journal', 'deadwood-ghostship-journal');
  // 实际离船时收束囚禁，保留当前页面的剧情与出口。
  maplebirch.dynamic.regStateEvent('gate', 'deadwood-ghostship-interrupted', {
    cond: () => V.MoreTransformations?.harbour?.captivity?.active && !maplebirch.passage.title.startsWith('Deadwood Ghost Ship '),
    action: () => {
      maplebirch.SugarCube.Wikifier.wikifyEval('<<deadwood-ghostship-release "interrupted">>');
    }
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-pirate-raid-link', passage: 'Pirate Deck' });

  const ready = (hand: 'left' | 'right') => {
    const target = V.NPCList?.[Number(V[`${hand}target`])];
    return (
      !!maplebirch.get('MoreTransformations') &&
      ((target?.per === 'deadwood_harbour_ghost' && V.MoreTransformations?.harbour?.fighting && Time.isBloodMoon()) ||
        (target?.per === 'deadwood_ship_undead' && V.MoreTransformations?.harbour?.raid?.stage === 'fight' && V.location === 'pirate_ship' && Weather.dayState === 'night') ||
        (target?.per === 'deadwood_coin_guard' && V.MoreTransformations?.treasure?.guardian === 'fight' && V.location === 'island')) &&
      !V.replayScene &&
      !V.statFreeze &&
      !V.frozenValues &&
      !V.possessed &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      V.combat === 1 &&
      V.enemytype === 'man' &&
      V.enemyhealth > 0 &&
      V.consensual === 0 &&
      V[`${hand}arm`] === 0 &&
      V.position !== 'stalk' &&
      !(V.orgasmdown > 0) &&
      V.dissociation < 2 &&
      !(V.trance > 0 || V.panicparalysis > 0 || V.panicviolence > 0 || (V.pain >= 100 && V.willpowerpain === 0)) &&
      target?.active === 'active' &&
      target.stance !== 'defeated' &&
      (V.enemyno < 2 || target.health > 0)
    );
  };
  for (const hand of ['left', 'right'] as const) {
    maplebirch.combat.CombatAction.reg(
      {
        id: `coldmoon-banish-${hand}`,
        actionType: hand === 'left' ? 'leftaction' : 'rightaction',
        cond: () => ready(hand) && V.angel >= 4 && V.angelBanish > 0 && !V.banishDisable,
        display: () => lanSwitch(`Banish the dead (${V.angelBanish}/${V.angelBanishMax})`, `放逐亡灵 (${V.angelBanish}/${V.angelBanishMax})`),
        value: () => 'deadwoodHarbourBanish',
        color: 'def',
        order: 1,
        effect: `<<deadwood-harbour-attack '${hand}' 'banish'>>`
      },
      {
        id: `coldmoon-weapon-${hand}`,
        actionType: hand === 'left' ? 'leftaction' : 'rightaction',
        cond: () => ready(hand) && !!maplebirch.get('LifeSimulation')?.weapons.weapon,
        display: () => (V.temple_weapon === 'whip' ? lanSwitch('Strike with whip', '挥鞭') : lanSwitch('Strike with baton', '挥棍')),
        value: () => 'deadwoodHarbourWeapon',
        color: 'def',
        order: 1,
        effect: `<<deadwood-harbour-attack '${hand}' 'weapon'>>`
      }
    );
  }
}
