// ./src/module/VanillaPlus/HandGrip.ts

export type GripHand = 'left' | 'right';

class HandGrip {
  private state(): { left: number | null; right: number | null } {
    return (V.VanillaPlus.handGrip ??= { left: null, right: null });
  }

  private npc(index: number) {
    const target = Number(index);
    const npc = V.NPCList?.[target];
    return Number.isInteger(target) && npc?.active === 'active' && npc.stance !== 'defeated' ? npc : undefined;
  }

  // 抓握腰臀只面向 PC 当前正在插入的承受者；插入 PC 的 NPC 由双腿锁定处理。
  public isPenetrationRecipient(index: number): boolean {
    const target = Number(index);
    if (!this.npc(target)) return false;
    if (Number(V.penistarget) !== target) return false;
    return (V.penisuse === 'othervagina' && V.penisstate === 'penetrated') || (V.penisuse === 'otheranus' && V.penisstate === 'otheranus');
  }

  public target(hand: GripHand): number | undefined {
    const target = this.state()[hand];
    const combat = V as unknown as Record<string, unknown>;
    const selectedTarget = Number(combat[`${hand}target`]);
    if (typeof target === 'number' && V.combat === 1 && combat[`${hand}arm`] === 'handheld' && selectedTarget === target && this.isPenetrationRecipient(target)) return target;
    if (typeof target === 'number') this.clear(hand);
    return undefined;
  }

  public set(hand: GripHand, index: number): boolean {
    const target = Number(index);
    if (!this.isPenetrationRecipient(target)) return false;
    this.state()[hand] = target;
    const combat = V as unknown as Record<string, unknown>;
    combat[`${hand}arm`] = 'handheld';
    combat[`${hand}target`] = target;
    return true;
  }

  public clear(hand: GripHand): void {
    const state = this.state();
    if (state[hand] == null) return;
    state[hand] = null;
    const combat = V as unknown as Record<string, unknown>;
    if (combat[`${hand}arm`] === 'handheld') combat[`${hand}arm`] = 0;
  }

  public clearAll(): void {
    this.clear('left');
    this.clear('right');
  }
}

export default HandGrip;
