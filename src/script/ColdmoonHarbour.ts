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
    locationPassage: {
      'Mer Street': [{ src: '<<merpiericon>>', applybefore: '<<deadwood-harbour-link>>\n\t\t', expected: 1 }],
      'Pirate Zephyr': [{ src: '<<getouticon>>', applybefore: '<<deadwood-harbour-zephyr-link>>\n', expected: 1 }],
      'Smuggler Pub Zephyr': [{ srcmatch: /<<link \[\[[^\]]+\|Smuggler Pub\]\]>>/, applybefore: '<<deadwood-harbour-zephyr-link>>\n', expected: 1 }],
      'Pirate Return 2': [{ src: '$spear_vessel is "zephyr"', to: '$spear_vessel is "Zephyr"', expected: 1 }]
    }
  });
  maplebirch.tool.addTo('Journal', 'deadwood-harbour-journal');

  const ready = (hand: 'left' | 'right') => {
    const target = V.NPCList?.[Number(V[`${hand}target`])];
    return (
      V.MoreTransformations?.harbour?.fighting &&
      Time.isBloodMoon() &&
      V.combat === 1 &&
      V.enemytype === 'man' &&
      V.enemyhealth > 0 &&
      V.consensual === 0 &&
      V[`${hand}arm`] === 0 &&
      V.position !== 'stalk' &&
      !(V.orgasmdown > 0) &&
      V.dissociation < 2 &&
      !(V.trance > 0 || V.panicparalysis > 0 || V.panicviolence > 0 || (V.pain >= 100 && V.willpowerpain === 0)) &&
      target?.per === 'deadwood_harbour_ghost' &&
      target.active === 'active' &&
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
