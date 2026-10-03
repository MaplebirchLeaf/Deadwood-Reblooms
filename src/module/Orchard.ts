// ./src/module/Orchard.ts

import Module from './Module';
import {
  species,
  harvestTiers,
  soilMultipliers,
  offSeasonYieldMultiplier,
  orchardSites,
  clearingStepMinutes,
  harvestDays,
  moistureDays,
  fertiliserDays,
  soilFertiliserDays,
  soilFertiliserHarvests,
  type OrchardSpecies,
  type OrchardFruit
} from './Orchard/Species';

export type OrchardSite = 'temple' | 'farm';
export type OrchardTool = 'plant' | 'water' | 'fertiliser' | 'harvest' | 'shovel';

export interface OrchardTree {
  species: OrchardSpecies;
  growth: number;
  moisture: number;
  fertiliser: number;
  harvests: number;
  /** 最多保留三天的收成。果实种类在结果时确定，采收不会再改写。 */
  fruit: { type: OrchardFruit; amount: number }[];
}

interface OrchardSoil {
  baseQuality: number;
  quality: number;
  fertiliserCooldown: number;
  fertiliserHarvests: number;
}

export interface OrchardReceipt {
  tool: OrchardTool;
  helped?: boolean;
  /** 开垦回执保存剩余工时，零表示这块土地刚刚整理完毕。 */
  clearing?: number;
  kept?: Partial<Record<OrchardFruit, number>>;
  donated?: number;
}

interface OrchardState {
  site: OrchardSite;
  tool: OrchardTool;
  selected: number;
  day: number;
  seed: OrchardSpecies;
  known: OrchardSpecies[];
  soil: Record<OrchardSite, OrchardSoil[]>;
  unlocked: Record<OrchardSite, boolean>;
  /** 各树位剩余开垦工时。零值的树位才可种植，铲树不会重置。 */
  clearing: Record<OrchardSite, number[]>;
  helpDay: number;
  irrigationSince: number;
  worker: {
    hired: boolean;
    paidFrom: number;
    paidUntil: number;
    lastShift: number;
    pick: boolean;
    report: { day: number; watered: number; kept: Partial<Record<OrchardFruit, number>> };
  };
  temple: (OrchardTree | null)[];
  farm: (OrchardTree | null)[];
}

const defaults: OrchardState = {
  site: 'temple',
  tool: 'water',
  selected: 0,
  day: -1,
  seed: 'apple',
  known: [],
  soil: { temple: [], farm: [] },
  unlocked: { temple: false, farm: false },
  clearing: { temple: [], farm: [] },
  helpDay: -1,
  irrigationSince: -1,
  worker: { hired: false, paidFrom: 0, paidUntil: 0, lastShift: -1, pick: false, report: { day: -1, watered: 0, kept: {} } },
  temple: Array(orchardSites.temple.plots).fill(null),
  farm: Array(orchardSites.farm.plots).fill(null)
};

class Orchard extends Module {
  /** 只用于下一次界面的操作回执，不参与存档或生长结算。 */
  public notice?: OrchardReceipt;
  public constructor(core: typeof maplebirch) {
    super(core, 'Orchard', defaults);
  }

  public get state(): OrchardState {
    return V.Orchard;
  }

  public override preInit(): void {
    super.preInit();
    // 天气变化时及时补水。再次读入同一雨天存档不会重触发 onEnter，推进前仍需核对。
    this.core.dynamic.regWeatherEvent(':deadwood-orchard-rain', {
      condition: () => !!V.Orchard && !V.statFreeze,
      precip: 'rain',
      onEnter: () => this.advance()
    });
    this.core.dynamic.regTimeEvent('onBefore', ':deadwood-orchard-sync', {
      action: () => this.advance()
    });
    // 只在跨日时结算生长，单次跨过多天仍由 advance 按日期逐日处理。
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-orchard-growth', { exact: true, action: () => this.advance() });
    this.core.dynamic.regTimeEvent('onHour', ':deadwood-orchard-worker', { exact: true, action: () => this.advance() });
    this.core.dynamic.regTimeEvent('onTimeTravel', ':deadwood-orchard-travel', {
      cond: data => data.direction === 'forward',
      action: () => this.advance()
    });
  }

  /** 果实使用原版食品目录，果树不写入原版作物地块。 */
  public available(site: OrchardSite): boolean {
    return this.state.unlocked[site] && (site === 'farm' ? V.farm_stage >= 12 : ['monk', 'priest'].includes(V.temple_rank));
  }

  public ready(site: OrchardSite): boolean {
    return (
      !this.state.unlocked[site] &&
      this.canWork &&
      (site === 'farm' ? V.farm_stage >= 12 && V.farm_work?.alex === 'admin' && !this.farmInterrupted : ['monk', 'priest'].includes(V.temple_rank) && V.temple_garden >= 100)
    );
  }

  public unlock(site: OrchardSite): boolean {
    if (!this.ready(site)) return false;
    this.advance();
    this.state.unlocked[site] = true;
    const data = orchardSites[site];
    this.state.clearing[site] = this.state[site].map((_, index) => (index < data.initialPlots ? 0 : data.clearingMinutes));
    this.state.soil[site] = this.state[site].map(() => {
      const quality = random(1, 3);
      return { baseQuality: quality, quality, fertiliserCooldown: 0, fertiliserHarvests: 0 };
    });
    // 神殿首次开放时保留一棵成树，果实仍由正常季节结算生成。
    if (site === 'temple') this.state.temple[0] ??= { species: 'plum', growth: species.plum.matureDays, moisture: 0, fertiliser: 0, harvests: 0, fruit: [] };
    return true;
  }

  public cleared(site: OrchardSite, index: number): boolean {
    return this.state.unlocked[site] && this.state.clearing[site][index] === 0;
  }

  public get canWork(): boolean {
    return Weather.dayState !== 'night' && V.exposed <= 0 && V.stress < V.stressmax && !window.pcAreArmsBound('both');
  }

  public get farmInterrupted(): boolean {
    return !!V.farm_attacked || (V.farm_attack_timer === 0 && Time.hour >= 21);
  }

  /** 九块原版田地均已接通后，边缘果园才能共用农场水源。 */
  public get irrigated(): boolean {
    return this.available('farm') && V.farm?.irrigation >= 9;
  }

  public get canAskAlex(): boolean {
    return this.available('farm') && this.canWork && !this.farmInterrupted && V.farm_work?.alex === 'admin' && this.state.helpDay < Math.floor(Time.date.timeStamp / 86400);
  }

  public get workerWage(): number {
    return 25000;
  }

  public get candidate(): boolean {
    return !this.state.worker.hired && !!V.per_npc?.deadwood_orchard_worker;
  }

  public get workerActive(): boolean {
    return this.state.worker.hired && !!V.per_npc?.deadwood_orchard_worker && this.state.worker.paidUntil > Time.date.timeStamp;
  }

  public get canPayWorker(): boolean {
    return this.available('farm') && this.state.worker.hired && !!V.per_npc?.deadwood_orchard_worker && V.money >= this.workerWage && this.state.worker.paidUntil <= Time.date.timeStamp + 7 * 86400;
  }

  public hire(): boolean {
    if (this.core.passage.title !== 'Deadwood Reblooms Orchard Hire' || !this.available('farm') || !this.candidate || V.money < this.workerWage) return false;
    this.advance();
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${this.workerWage} 'farm'>>`);
    this.state.worker.hired = true;
    this.state.worker.paidFrom = Time.date.timeStamp;
    this.state.worker.paidUntil = Time.date.timeStamp + 7 * 86400;
    return true;
  }

  public payWorker(): boolean {
    if (!this.canPayWorker) return false;
    this.advance();
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${this.workerWage} 'farm'>>`);
    const worker = this.state.worker;
    if (worker.paidUntil <= Time.date.timeStamp) worker.paidFrom = Time.date.timeStamp;
    worker.paidUntil = Math.max(Time.date.timeStamp, worker.paidUntil) + 7 * 86400;
    return true;
  }

  public setWorkerPicking(pick: boolean): void {
    this.advance();
    this.state.worker.pick = pick;
  }

  public dismissWorker(): boolean {
    if (this.core.passage.title !== 'Deadwood Reblooms Orchard Dismiss') return false;
    this.advance();
    this.core.SugarCube.Wikifier.wikifyEval("<<clearNPC 'deadwood_orchard_worker'>>");
    this.state.worker = clone(defaults.worker);
    return true;
  }

  public get varieties(): OrchardSpecies[] {
    return this.state.known.filter(key => !!setup.foodstuff[key]);
  }

  /** 采摘发现种源，神殿花园的酸橙另有入口。只在未知种源上掷骰。 */
  public discover(type: string, source: 'pick' | 'garden'): boolean {
    const key = type as OrchardSpecies;
    if (!species[key] || species[key].seedSource !== source || this.state.known.includes(key)) return false;
    if (source === 'pick' && random(1, 100) + window.currentSkillValue('tending') / 10 < 95) return false;
    return this.learn(key);
  }

  private learn(type: OrchardSpecies): boolean {
    if (!setup.foodstuff[type] || this.state.known.includes(type)) return false;
    if (!this.state.known.length) this.state.seed = type;
    this.state.known.push(type);
    return true;
  }

  /** 特殊种源只购买一次，之后可以反复播种。普通种源不出售。 */
  public buySeed(type: OrchardSpecies): boolean {
    const data = species[type];
    if (!data || data.seedSource !== 'shop' || !data.seedPrice || !setup.foodstuff[type] || this.state.known.includes(type)) return false;
    if (this.core.passage.title !== 'Supermarket' || Time.dayState === 'night' || Time.hour === 21 || !this.canWork || V.money < data.seedPrice) return false;
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${data.seedPrice} 'shopping'>>`);
    return this.learn(type);
  }

  public stage(tree: OrchardTree | null): number {
    if (!tree) return -1;
    const data = species[tree.species];
    return tree.growth < data.saplingDays ? 0 : tree.growth < data.matureDays ? 1 : 2;
  }

  public ripe(tree: OrchardTree | null): boolean {
    return !!tree?.fruit.length;
  }

  /** 沿用旧果园的树龄、技能、树种和土壤产量，接入当前原版的收成倍率字段。 */
  public yield(tree: OrchardTree, quality: number, season = Time.season): number {
    const tier = harvestTiers.filter(tier => tree.harvests >= tier.harvests).at(-1)!;
    const upper = Math.floor(window.currentSkillValue('tending') / tier.skillDivisor + tier.upperBase);
    const amount = random(10, Math.max(10, upper));
    const data = species[tree.species];
    const multiplier = data.yieldMultiplier * soilMultipliers[Math.max(0, Math.min(3, quality - 1))] * (data.fruitSeasons.includes(season) ? 1 : offSeasonYieldMultiplier);
    return Math.trunc(amount * multiplier * (V.backgroundTraits.includes('greenthumb') ? 1.2 : 1) * (V.settings.tendingYieldModifier / 5));
  }

  /** 按午夜跨日逐天结算，不能用从开局时刻计算的 Time.days 代替日历日期。 */
  public advance(): void {
    // 回忆与画中场景使用冻结的玩家状态，不能让这些场景的日期影响果园。
    if (!V.Orchard || V.statFreeze) return;
    const state = this.state;
    const today = Math.floor(Time.date.timeStamp / 86400);
    if (state.day < 0) state.day = today;
    // 原版先补算整次 pass 的施工。刚观察到的竣工不能倒推到过去每一天。
    if (this.irrigated && state.irrigationSince < 0) state.irrigationSince = Time.date.timeStamp;
    if (!this.irrigated) state.irrigationSince = -1;
    while (state.day < today) {
      // 先结算这一天的早班，再结算随后的午夜。长时间跳过不能提前采到未来的水果。
      this.workShift(state.day);
      const midnight = new window.DateTime((state.day + 1) * 86400);
      const season = Time.getSeason(new window.DateTime(midnight).addDays(-1));
      const bloodMoon = Weather.getBloodMoon(midnight);
      for (const site of ['temple', 'farm'] as const) {
        for (const [index, tree] of state[site].entries()) {
          const soil = state.soil[site][index];
          if (soil) soil.fertiliserCooldown = Math.max(0, soil.fertiliserCooldown - 1);
          if (!tree) continue;
          const data = species[tree.species];
          if (tree.growth < data.matureDays) {
            if (site === 'farm' && this.irrigated && state.irrigationSince < midnight.timeStamp) tree.moisture = moistureDays;
            if (tree.moisture > 0) tree.growth = Math.min(data.matureDays, tree.growth + (tree.fertiliser > 0 ? 2 : 1));
          }
          if (tree.growth >= data.matureDays && tree.fruit.length < harvestDays) {
            const type = bloodMoon && data.bloodMoonFruit ? data.bloodMoonFruit : tree.species;
            if (setup.foodstuff[type]) {
              const amount = this.yield(tree, soil.quality, season);
              tree.fruit.push({ type, amount });
            }
          }
          tree.moisture = Math.max(0, tree.moisture - 1);
          tree.fertiliser = Math.max(0, tree.fertiliser - 1);
        }
      }
      state.day++;
    }
    if (state.day === today) this.workShift(today);
    // 只应用当前已知的雨水，不捏造原版未保存的历史降雨。
    if (state.day !== today) return;
    for (const site of ['temple', 'farm'] as const) {
      if (Weather.precipitation !== 'rain' && !(site === 'farm' && this.irrigated)) continue;
      for (const tree of state[site]) {
        if (!tree || this.stage(tree) === 2) continue;
        tree.moisture = moistureDays;
      }
    }
  }

  /** 普通雇员直接照料果树，不载入战斗 NPC 槽，也不消耗玩家时间或授予玩家经验。 */
  private workShift(day: number): void {
    const worker = this.state.worker;
    const morning = day * 86400 + 8 * 3600;
    if (!worker.hired || day <= worker.lastShift || morning > Time.date.timeStamp) return;
    worker.lastShift = day;
    if (morning < worker.paidFrom || morning >= worker.paidUntil || !V.per_npc?.deadwood_orchard_worker || !this.available('farm') || V.farm_assault) return;
    const report = { day, watered: 0, kept: {} as Partial<Record<OrchardFruit, number>> };
    this.state.farm.forEach((tree, index) => {
      if (!tree || !this.cleared('farm', index)) return;
      if (this.stage(tree) < 2 && tree.moisture < moistureDays && !(this.irrigated && this.state.irrigationSince <= morning)) {
        tree.moisture = moistureDays;
        report.watered++;
      }
      if (worker.pick && this.ripe(tree)) {
        const receipt = this.collect('farm', index);
        for (const [type, amount] of Object.entries(receipt?.kept ?? {})) report.kept[type as OrchardFruit] = (report.kept[type as OrchardFruit] ?? 0) + amount!;
      }
    });
    worker.report = report;
  }

  /** 返回成功时的耗时。无效操作不扣材料、不增加技能、不推进时间。 */
  public act(site: OrchardSite, index: number, tool: OrchardTool, helped = false): number {
    if (!this.available(site) || !this.canWork || (site === 'farm' && this.farmInterrupted)) return 0;
    this.advance();
    if (helped && (site !== 'farm' || !this.canAskAlex || !['shovel', 'water', 'harvest'].includes(tool))) return 0;
    const plots = this.state[site];
    if (!Number.isInteger(index) || index < 0 || index >= plots.length) return 0;
    const clearing = this.state.clearing[site];
    if (!this.cleared(site, index)) {
      // 从已整理土地向外扩展，只能开垦紧邻的下一树位。每次工作保留进度。
      if (tool !== 'shovel' || index !== clearing.findIndex(minutes => minutes > 0)) return 0;
      const work = Math.min(clearingStepMinutes, clearing[index]);
      const minutes = helped ? work / 2 : work;
      clearing[index] -= work;
      if (helped) this.state.helpDay = Math.floor(Time.date.timeStamp / 86400);
      this.notice = { tool, helped, clearing: clearing[index] };
      return minutes;
    }
    const tree = plots[index];
    const soil = this.state.soil[site][index];
    switch (tool) {
      case 'plant':
        if (tree || !this.varieties.includes(this.state.seed)) return 0;
        plots[index] = {
          species: this.state.seed,
          growth: 0,
          moisture: Weather.precipitation === 'rain' || (site === 'farm' && this.irrigated) ? moistureDays : 0,
          fertiliser: 0,
          harvests: 0,
          fruit: []
        };
        return 10;
      case 'water':
        if (!tree || this.stage(tree) === 2 || tree.moisture === moistureDays) return 0;
        tree.moisture = moistureDays;
        if (helped) this.state.helpDay = Math.floor(Time.date.timeStamp / 86400);
        this.notice = { tool, helped };
        return helped ? 2.5 : 5;
      case 'fertiliser':
        if (!tree || V.fertiliser.current < 1) return 0;
        if (this.stage(tree) < 2) {
          if (tree.fertiliser > 0) return 0;
          tree.fertiliser = fertiliserDays;
        } else {
          if (window.currentSkillValue('tending') < 400 || soil.quality >= 4 || soil.fertiliserCooldown > 0) return 0;
          soil.quality++;
          soil.fertiliserCooldown = soilFertiliserDays;
          // 园艺大师改良的土壤不会随采收衰退，其他人每两次采收消耗一级改良。
          soil.fertiliserHarvests = V.backgroundTraits.includes('greenthumb') ? 0 : soilFertiliserHarvests;
        }
        V.fertiliser.current--;
        V.fertiliser.used++;
        return 5;
      case 'harvest': {
        const receipt = this.collect(site, index);
        if (!receipt) return 0;
        if (helped) this.state.helpDay = Math.floor(Time.date.timeStamp / 86400);
        this.notice = { ...receipt, helped };
        return helped ? 5 : 10;
      }
      case 'shovel':
        if (!tree || helped) return 0;
        plots[index] = null;
        // 铲树不能重新抽取这块土地的基础质量。
        if (soil.fertiliserHarvests > 0 && !V.backgroundTraits.includes('greenthumb')) soil.quality = soil.baseQuality;
        soil.fertiliserHarvests = 0;
        return 15;
    }
  }

  /** 玩家和雇员共用采收规则。调用者负责时间、经验和回执。 */
  private collect(site: OrchardSite, index: number): OrchardReceipt | undefined {
    const tree = this.state[site][index];
    if (!tree || !this.ripe(tree) || tree.fruit.some(crop => !setup.foodstuff[crop.type])) return;
    const soil = this.state.soil[site][index];
    const totals: Partial<Record<OrchardFruit, number>> = {};
    for (const crop of tree.fruit) totals[crop.type] = (totals[crop.type] ?? 0) + crop.amount;
    const kept: Partial<Record<OrchardFruit, number>> = {};
    let donated = 0;
    // 分别分配各类水果，普通柠檬与血柠可以同时留在同一棵树上。
    for (const [type, amount] of Object.entries(totals)) {
      const share = site === 'temple' ? Math.max(1, Math.floor(amount / 2)) : amount;
      kept[type as OrchardFruit] = share;
      donated += amount - share;
      this.core.SugarCube.Wikifier.wikifyEval(`<<tending_give '${type}' ${share}>>`);
    }
    if (donated > 0) this.core.SugarCube.Wikifier.wikifyEval('<<grace 1 monk>>');
    tree.fruit = [];
    tree.harvests++;
    if (soil.fertiliserHarvests > 0 && !V.backgroundTraits.includes('greenthumb') && --soil.fertiliserHarvests === 0) {
      soil.quality = Math.max(soil.baseQuality, soil.quality - 1);
      if (soil.quality > soil.baseQuality) soil.fertiliserHarvests = soilFertiliserHarvests;
    }
    return { tool: 'harvest', kept, donated };
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly Orchard: Orchard;
  }
}

export default Orchard;
