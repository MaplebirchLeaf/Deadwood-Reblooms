export default function Weapons(maplebirch: typeof window.maplebirch): void {
  const weapons = maplebirch.get('LS')!.weapons;
  maplebirch.combat.CombatAction.reg({
    id: 'ls-weapon',
    actionType: ['leftaction', 'rightaction'],
    combatType: 'Tentacle',
    cond: ctx => !!maplebirch.get('LS') && weapons.can(ctx.actionType === 'leftaction' ? 'left' : 'right'),
    display: () => (weapons.weapon === 'whip' ? lanSwitch('Strike with whip', '挥鞭') : lanSwitch('Strike with baton', '挥棍')),
    value: () => 'lsWeapon',
    color: 'def',
    order: 1,
    effect: ctx => `<<deadwood-reblooms-weapon-hit '${ctx.actionType === 'leftaction' ? 'left' : 'right'}'>>`
  });
}
