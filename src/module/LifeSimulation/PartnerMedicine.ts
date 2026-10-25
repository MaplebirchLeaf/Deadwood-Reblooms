// ./src/module/LifeSimulation/PartnerMedicine.ts

type Partner = string;
type Part = 'breast' | 'penis' | 'bottom';
type Direction = 'growth' | 'reduction';
export interface PartnerMedicineState {
  doses: Partial<Record<Partner, { day: number; progress: Partial<Record<Part, number>> }>>;
}

/** 原版药片库存供双方共用，每人每天只接受一剂，七剂推进一档。 */
export default class PartnerMedicine {
  public constructor(private readonly core: typeof maplebirch) {}

  private get state(): PartnerMedicineState {
    return V.LifeSimulation.partner_medicine;
  }

  public get nearby(): Partner[] {
    if (
      !V.LifeSimulation ||
      V.combat ||
      V.replayScene ||
      V.statFreeze ||
      V.nextPassageCheck ||
      V.possessed ||
      V.worn.face.type.includes('gag') ||
      V.exposed > 0 ||
      V.stress >= V.stressmax ||
      V.arousal >= V.arousalmax ||
      window.pcAreArmsBound('both')
    )
      return [];
    return (setup.NPCNameList as string[]).filter(name => Array.isArray(V.npc) && V.npc.includes(name) && C.npc[name]?.init === 1 && C.npc[name].state === 'active' && window.isLoveInterest(name));
  }

  public get stock() {
    return (['breast', 'penis', 'bottom'] as const).flatMap(part =>
      (['growth', 'reduction'] as const).map(direction => ({ part, direction, id: `${part} ${direction}` })).filter(item => (V.sexStats?.pills?.pills?.[item.id]?.owned ?? 0) > 0)
    );
  }

  public willing(name: Partner): boolean {
    return this.nearby.includes(name) && !window.npcIsPregnant(name);
  }

  public canTake(name: Partner, part: Part, direction: Direction): boolean {
    if (!this.willing(name) || this.state.doses[name]?.day === Time.days || !this.stock.some(item => item.part === part && item.direction === direction)) return false;
    const npc = C.npc[name];
    if (part === 'penis' && (npc.penis === 'none' || !(npc.penissize > 0))) return false;
    const size = npc[`${part}size`] ?? (part === 'bottom' ? 2 : undefined);
    const minimum = part === 'penis' ? 1 : 0;
    const maximum = part === 'penis' && this.core.get('VanillaPlus') ? 5 : 4;
    return Number.isFinite(size) && (direction === 'growth' ? size < maximum : size > minimum);
  }

  public give(name: Partner, part: Part, direction: Direction): 'changed' | 'taken' | 'refused' {
    if (!this.canTake(name, part, direction)) return 'refused';
    const dose = (this.state.doses[name] ??= { day: -1, progress: {} });
    V.sexStats.pills.pills[`${part} ${direction}`].owned--;
    dose.day = Time.days;
    const progress = (dose.progress[part] ?? 0) + (direction === 'growth' ? 1 : -1);
    if (Math.abs(progress) < 7) {
      dose.progress[part] = progress;
      return 'taken';
    }
    dose.progress[part] = 0;
    const npc = C.npc[name];
    const key = `${part}size`;
    npc[key] = (npc[key] ?? 2) + Math.sign(progress);
    if (part === 'breast') npc.breastdesc = npc.breastsize > 0 ? 'breasts' : undefined;
    this.core.npc.NamedNPC.prototype.bodyPartdescription.call(npc);
    // 当前遭遇记录可能已装载，只同步这个人的尺寸和描述，不重新生成器官。
    for (const loaded of V.NPCList ?? []) {
      if (loaded?.fullDescription !== name) continue;
      loaded[key] = npc[key];
      for (const field of [`${part}desc`, ...(part === 'breast' ? ['breastsdesc'] : [])]) loaded[field] = npc[field];
    }
    return 'changed';
  }
}
