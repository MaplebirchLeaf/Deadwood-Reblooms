// ./src/module/BirdTower.ts

import Module from './Module';
import { BIRD_TOWER_HINTS, BIRD_TOWER_MEALS, BIRD_TOWER_STAGES, DEFAULT_BIRD_TOWER_STATE, type BirdTowerStage, type BirdTowerTrait, type BirdTowerState } from './constants';

/** 随孩子记录保存的鹰崽成长字段。 */
interface HawkDevelopment {
  location?: string;
  activity?: string;
  event?: boolean;
  activityDay?: number;
  activityHour?: number;
  stage?: BirdTowerStage;
  trait?: BirdTowerTrait;
  fed_daily?: number;
  fed_total?: number;
  grow_hint_fledgling?: number;
  grow_hint_subadult?: number;
  grow_hint_immature?: number;
  size_hint?: number;
  hunt_loot?: string;
  timer?: number;
  adopted_date?: number;
}

interface HawkChild {
  childId: number;
  species: string;
  features: { size?: string; monster?: string };
  development: HawkDevelopment;
  bornDate?: number;
}

/** 鹰崽成长、性格、喂食与随行狩猎的全部逻辑。 */
class BirdTower extends Module {
  public returned: { id: number; loot: string }[] = [];

  public constructor(core: typeof maplebirch) {
    super(core, 'BirdTower', DEFAULT_BIRD_TOWER_STATE);
  }

  public override preInit(): void {
    super.preInit();
    const init = () => {
      for (const child of this.all) this.init(child.childId);
    };
    // 进入段落先补齐鹰崽数据；onBefore 覆盖同页孵化后立即推进时间的情况。
    this.core.dynamic.regStateEvent('gate', 'deadwood-birdtower-init', { priority: 10, action: init });
    this.core.dynamic.regStateEvent('gate', 'deadwood-birdtower-return', {
      // 启动时框架尚无当前段落；归巢结算只在鹰塔且存档状态就绪后执行。
      cond: () => this.core.passage?.title === 'Bird Tower' && !!this.state?.daily,
      action: () => (this.returned = this.returnHunters),
      output: 'deadwood-birdtower-hunters-return'
    });
    this.core.dynamic.regTimeEvent('onBefore', ':deadwood-birdtower-init', { action: init });
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-birdtower-daily', {
      exact: true,
      action: data => {
        const previous = data.prevDate?.timeStamp ?? Time.date.timeStamp - TimeConstants.secondsPerDay;
        const days = Math.floor(Time.date.timeStamp / TimeConstants.secondsPerDay) - Math.floor(previous / TimeConstants.secondsPerDay);
        const midnight = (Math.floor(previous / TimeConstants.secondsPerDay) + 1) * TimeConstants.secondsPerDay;
        this.dayTick(days, midnight);
      }
    });
    // 狩猎队伍在外时按分钟消耗体力，只有身处鹰塔、荒原或城堡才计时。
    this.core.dynamic.regTimeEvent('onMin', ':deadwood-birdtower-hunt-timer', {
      action: data => {
        if (!['tower', 'moor', 'castle'].includes(V.location)) return;
        const minutes = Number(data.min) || 0;
        if (minutes <= 0) return;
        for (const child of this.all) {
          const { activity, timer } = child.development;
          if (childIsBorn(child) && activity === 'hunting' && typeof timer === 'number' && Number.isFinite(timer)) child.development.timer = Math.max(0, timer - minutes);
        }
      }
    });
  }

  public get state(): BirdTowerState {
    return V.BirdTower;
  }

  /** 随行狩猎的队伍，默认值由模块初始化保证。 */
  public get hunt(): BirdTowerState['hunt'] {
    return this.state.hunt;
  }

  public get leaderTrait(): BirdTowerTrait | 'none' {
    const leader = this.hunt.leader;
    return leader === null ? 'none' : (this.party.find(child => child.childId === leader)?.development.trait ?? 'none');
  }

  /** 一次选好跨段落事件的参与者，完整名单不受随机抽取影响。 */
  public beginScene(ids: number[], limit = 3): void {
    const pool = [...ids];
    const actors: number[] = [];
    for (let i = 0; i < Math.min(ids.length, limit); i++) actors.push(pool.splice(random(0, pool.length - 1), 1)[0]);
    this.state.scene = { ids: [...ids], actors };
  }

  public resetHunt(): void {
    this.hunt.ids = [];
    this.hunt.leader = null;
    this.hunt.shown = { north: false, east: false, south: false, west: false };
  }

  /** 所有的鹰崽，包含未孵化的蛋。 */
  public get all(): HawkChild[] {
    if (!Array.isArray(V.childRecords)) return [];
    return (getBornChildren() as HawkChild[]).filter(child => child?.species === 'hawk');
  }

  /** 已孵化且位于指定地点的鹰崽。 */
  public at(location: string): HawkChild[] {
    return this.all.filter(child => childIsBorn(child) && child.development.location === location);
  }

  /** 当前同行的已孵化鹰崽，统一排除缺失记录与其它物种。 */
  public get party(): HawkChild[] {
    return this.hunt.ids.map(id => V.childRecords[id] as HawkChild | undefined).filter((child): child is HawkChild => child?.species === 'hawk' && childIsBorn(child));
  }

  /** 按性格筛选本次随行队伍，写回原版共享的 _tempIDs 与 _length。 */
  public selectTrait(trait: BirdTowerTrait): number {
    T.tempIDs = this.party.filter(child => child.development.trait === trait).map(child => child.childId);
    T.length = T.tempIDs.length;
    return T.length;
  }

  /** 把活跃鹰崽写回原版共享的 _tempIDs 与 _length。 */
  public selectActive(location = 'tower'): number {
    T.tempIDs = this.at(location)
      .filter(child => child.development.activity !== 'hunting')
      .map(child => child.childId);
    T.length = T.tempIDs.length;
    return T.length;
  }

  private needsFood(child: HawkChild): boolean {
    return (child.development.fed_daily ?? 0) < BIRD_TOWER_MEALS;
  }

  /** 只列出巢里还没吃够当天份额的小鹰。 */
  public get hungry(): HawkChild[] {
    return this.at('tower').filter(child => this.needsFood(child));
  }

  /** 普通喂食、逐只喂食和分食共用库存检查与成长记录。 */
  public feed(target: number | 'all' | 'share' = 'all'): number[] {
    const stock = V.bird.materials.lurkers;
    const children = typeof target === 'number' ? this.hungry.filter(child => child.childId === target) : this.hungry;
    if (!children.length || !(stock > 0)) return [];
    const cost = typeof target === 'number' || !children.some(child => getChildDays(child.childId) >= 35) ? 1 : children.length;
    if (target !== 'share' && stock < cost) return [];
    V.bird.materials.lurkers -= target === 'share' ? Math.min(stock, cost) : cost;
    for (const child of children) {
      this.init(child.childId);
      child.development.fed_daily = (child.development.fed_daily ?? 0) + 1;
      child.development.activity = 'lurkerEat';
      child.development.activityDay = Time.days;
      child.development.activityHour = Time.hour - 3;
    }
    return children.map(child => child.childId);
  }

  public get canInvite(): boolean {
    return !this.state.daily.hunt_ask && !Weather.bloodMoon && this.at('otherNest').some(child => child.development.activity !== 'hunting');
  }

  /** 请求同行时选择当前可出发的小鹰；在外狩猎的鹰崽不参与。 */
  public startHunt(mode: 'invite' | 'moor' = 'invite'): number[] {
    if (mode === 'invite' && !this.canInvite) return [];
    const ids = this.at('otherNest')
      .filter(child => child.development.activity !== 'hunting')
      .map(child => child.childId);
    if (!ids.length) return [];
    this.resetHunt();
    if (mode === 'invite') this.state.daily.hunt_ask = true;
    const total = random(1, ids.length);
    for (let i = 0; i < total; i++) {
      const id = ids.splice(random(0, ids.length - 1), 1)[0];
      this.hunt.ids.push(id);
      if (mode === 'moor') {
        const child = V.childRecords[id] as HawkChild;
        child.development.activity = 'hunting';
        child.development.timer = 30;
      }
    }
    return this.hunt.ids;
  }

  /** 回塔领取已结束的独自狩猎，领取后不会重复生成战利品。 */
  private get returnHunters(): { id: number; loot: string }[] {
    this.state.daily.at_tower = true;
    const children = this.all.filter(child => {
      const { activity, timer, location } = child.development;
      return childIsBorn(child) && ['tower', 'otherNest'].includes(location ?? '') && activity === 'hunting' && typeof timer === 'number' && Number.isFinite(timer) && timer <= 0;
    });
    return children.map(child => {
      child.development.timer = undefined;
      child.development.activity = 'rest';
      let loot: string;
      const eating = this.needsFood(child);
      if (eating) {
        loot = 'lurkers';
        child.development.activity = 'lurkerEat';
        child.development.fed_daily = (child.development.fed_daily ?? 0) + 1;
        child.development.activityDay = Time.days;
        child.development.activityHour = Time.hour;
      } else if (child.development.hunt_loot !== undefined) {
        loot = child.development.hunt_loot;
        child.development.hunt_loot = undefined;
      } else {
        const pool = ['nothing', 'junk', 'materials', 'valuables', 'lurkers'];
        loot = pool[random(0, pool.length - 1)];
      }
      if (loot === 'materials') {
        const pool = ['leaves', 'sticks', 'fabric', 'wood'];
        loot = pool[random(0, pool.length - 1)];
      } else if (loot === 'valuables') {
        const pool = ['watch', 'ring', 'necklace', 'bracelet'];
        loot = pool[random(0, pool.length - 1)];
      }
      if (['watch', 'ring', 'necklace', 'bracelet'].includes(loot)) V.bird.materials.valuables[loot] = (V.bird.materials.valuables[loot] ?? 0) + 1;
      else if (loot !== 'nothing' && !eating) V.bird.materials[loot] = (V.bird.materials[loot] ?? 0) + 1;
      return { id: child.childId, loot };
    });
  }

  /** 同行猎物按实际同伴数量抽取，沿用原版 flight_hunt_get 入账。 */
  public get prey(): { followers: number[]; caught: number[] } {
    const followers = this.party.filter(child => child.childId !== this.hunt.leader).map(child => child.childId);
    return { followers, caught: followers.slice(0, random(0, followers.length)) };
  }

  /** 把当前狩猎队伍中还没吃饱的鹰崽写回 _tempIDs，并让它们就地进食。 */
  public hungryParty(loot: number): number {
    const available = Math.max(0, Math.floor(loot));
    T.tempIDs = this.party
      .filter(child => this.needsFood(child))
      .slice(0, available)
      .map(child => child.childId);
    for (const id of T.tempIDs) {
      this.init(id);
      const child = V.childRecords[id] as HawkChild;
      child.development.activity = 'lurkerEat';
      child.development.fed_daily = (child.development.fed_daily ?? 0) + 1;
    }
    T.length = T.tempIDs.length;
    return T.length;
  }

  /** 孤儿小鹰是否在当前队伍中。数字 ID 0 也是有效 ID。 */
  public get hasOrphan(): boolean {
    const id = V.orphanHawkChildId;
    return id !== undefined && this.party.some(child => child.childId === id);
  }

  /** 鹰塔与新巢中的鹰崽总数，用于判断“只剩孤儿一只”之外的差分。 */
  public get count(): number {
    return this.all.filter(child => childIsBorn(child) && ['tower', 'otherNest'].includes(child.development.location ?? '')).length;
  }

  /** 初始化已孵化鹰崽的成长数据，重复调用保留已有值。 */
  public init(childId: number): void {
    const child = V.childRecords[childId] as HawkChild | undefined;
    if (child?.species !== 'hawk' || !childIsBorn(child)) return;
    // 原版已有的小鹰按每天一顿建立喂食基线；收养的鹰崽从收养日起算。
    const started = child.development.adopted_date ?? child.bornDate;
    child.development.fed_total ??= started == null ? 0 : Math.clamp(Math.ceil((Time.date.timeStamp - started) / TimeConstants.secondsPerDay), 0, 200);
    child.development.fed_daily ??= 0;
    const days = getChildDays(childId);
    child.development.stage ??= BIRD_TOWER_STAGES.find(entry => days >= entry.from && days <= entry.to)?.stage ?? 'ERROR';
    this.assignTrait(child, days);
  }

  /**
   * 离巢后才分配性格。体型与累计喂食量会小幅偏移随机值：
   * 大体型、喂食充足偏向强势，小体型、长期饥饿偏向笨拙。
   */
  private assignTrait(child: HawkChild, days: number): void {
    if (days < 65 || child.development.trait != null) return;
    const fed = child.development.fed_total ?? 0;
    let roll = Math.random();
    if (child.features.size === 'large') roll += 0.2;
    else if (child.features.size === 'small') roll -= 0.1;
    else if (child.features.size === 'tiny') roll -= 0.2;
    const surplus = fed - days;
    if (surplus > 5) roll += 0.1;
    if (surplus > 10) roll += 0.1;
    if (surplus < -5) roll -= 0.1;
    if (surplus < -10) roll -= 0.1;
    child.development.trait = roll < 0.25 ? 'clumsy' : roll < 0.5 ? 'sympathy' : roll < 0.75 ? 'clever' : 'dominant';
  }

  /** 按原版刷新间隔挑选活动；尚未归巢的独自狩猎不会被日常活动覆盖。 */
  public activity(childId: number): void {
    const child = V.childRecords[childId] as HawkChild | undefined;
    if (child?.species !== 'hawk' || !childIsBorn(child)) return;
    this.init(childId);
    const { activity, activityDay = Time.days, activityHour = Time.hour } = child.development;
    if (activity === 'hunting') {
      child.development.timer ??= 30;
      if (Number.isFinite(child.development.timer)) return;
    }
    const elapsed = Time.hour - activityHour + 24 * Math.clamp(Time.days - activityDay, 0, Infinity);
    if (elapsed < 4 && !(Time.hour === 7 && elapsed >= 2) && activity !== 'noEvent') return;
    const days = getChildDays(childId);
    const night = Time.dayState === 'night' && V.bird.state === 'home' && ['sleep', 'rest', 'brood'].includes(V.bird.activity);
    const pool: string[] = [];
    const push = (...items: string[]) => pool.push(...items);

    if (days <= 13) {
      if (night) push('sleepingWithGreatHawk', 'sleepingWithGreatHawk', 'sleepingWithGreatHawk', 'sleeping');
      else push('sleeping', 'sleeping', 'sleeping', 'crying', 'reaching', 'flap', 'perch', 'bathe');
    } else if (days <= 34) {
      if (night) push('sleepingWithGreatHawk', 'sleepingWithGreatHawk', 'sleepingWithGreatHawk', 'sleeping');
      else push('sleeping', 'crying', 'reaching', 'flap', 'preen', 'perch', 'bathe');
    } else if (days <= 64) {
      if (night) push('sleepingWithGreatHawk', 'sleepingWithGreatHawk', 'sleeping');
      else push('rest', 'crying', 'reaching', 'explore', 'Fledgling_fly', 'Fledgling_preen', 'Fledgling_perch', 'batheSelf');
    } else if (days <= 89) {
      if (night) push('sleepingWithGreatHawk', 'sleeping');
      else push('rest', 'reaching', 'explore', 'Subadult_fly', 'Subadult_preen', 'Subadult_perch', 'batheSelf');
    } else {
      if (night) push('sleeping');
      else push('rest', 'reaching', 'Subadult_fly', 'Subadult_preen', 'Subadult_perch', 'batheSelf');
    }

    // 还留在塔里且没吃饱的小鹰会主动乞食。
    if (child.development.location !== 'otherNest' && this.needsFood(child)) push('beg', 'beg');
    if (days >= 15 && Time.dayState !== 'night') push('GreatHawk', 'weather');
    if (child.childId === V.orphanHawkChildId && V.BirdTower.ring.kept) push('GoldRing');
    if (child.development.location === 'otherNest' && Time.dayState !== 'night') push('hunting');

    child.development.activity = pool.length ? pool[random(0, pool.length - 1)] : 'noEvent';
    if (child.development.activity === 'hunting') child.development.timer = 30;
    child.development.event = true;
    child.development.activityDay = Time.days;
    child.development.activityHour = Time.hour;
  }

  /** 跨日结算：喂食统计、体型成长与阶段推进。 */
  private dayTick(days: number, midnight: number): void {
    if (days <= 0) return;
    for (const child of this.all) {
      const location = child.development.location;
      if (!childIsBorn(child) || (location !== 'tower' && location !== 'otherNest')) continue;
      const id = child.childId;
      this.init(id);
      const age = getChildDays(id);
      this.settleFeeding(child, days, midnight);
      for (let day = 0; day < Math.min(days, 3); day++) this.growSize(child, age);
      this.growStage(child, age);
    }
    V.BirdTower.daily.at_tower = false;
    V.BirdTower.daily.moor_event = false;
    V.BirdTower.daily.hunt_ask = false;
  }

  /** 小结当天的喂食。PC 不在鹰塔时视为大鹰自行喂饱，按一顿计入。 */
  private settleFeeding(child: HawkChild, days: number, midnight: number): void {
    let fed = child.development.fed_daily ?? 0;
    if (!V.bird.injured && !npcIsPregnant('Great Hawk')) child.development.fed_total = (child.development.fed_total ?? 0) + days - (V.BirdTower.daily.at_tower ? 1 : 0);
    // 离巢后的小鹰一天要吃两顿，乞食计数按两顿折算成一顿的累计量。
    const age = Math.floor((midnight - (child.bornDate ?? midnight)) / TimeConstants.secondsPerDay);
    if (age > 34) fed = Math.floor(fed / 2);
    child.development.fed_total = (child.development.fed_total ?? 0) + fed;
    child.development.fed_daily = 0;
  }

  /** 喂食长期高于同龄水平会让体型变大，长期不足则偏小。 */
  private growSize(child: HawkChild, days: number): void {
    const surplus = (child.development.fed_total ?? 0) - days;
    const size = child.features.size;
    if (size === 'large') return;
    if (size === 'normal' && surplus >= 9) child.features.size = 'large';
    else if (size === 'small' && surplus >= 7) child.features.size = 'normal';
    else if (size === 'tiny' && surplus >= 5) child.features.size = 'small';
    else return;
    child.development.size_hint = 1;
  }

  /** 跨过阶段边界时写入换羽提示，具体事件由鹰塔页面消费。 */
  private growStage(child: HawkChild, days: number): void {
    const current = BIRD_TOWER_STAGES.findIndex(entry => entry.stage === child.development.stage);
    const next = BIRD_TOWER_STAGES.findIndex(entry => days >= entry.from && days <= entry.to);
    if (next <= current) return;
    // 一次推进多天也保留跨过的成长提示。
    for (const entry of BIRD_TOWER_STAGES.slice(current + 1, next + 1)) {
      const hint = BIRD_TOWER_HINTS[entry.stage];
      if (hint) child.development[hint] = 1;
    }
    child.development.stage = BIRD_TOWER_STAGES[next].stage;
    this.assignTrait(child, days);
  }

  /** 从参与狩猎的鹰崽中选出领队：优先强势或聪明，否则随机。 */
  public pickLeader(): void {
    const hunt = this.hunt;
    const party = this.party;
    const leader = party.find(child => ['dominant', 'clever'].includes(child.development.trait ?? '')) ?? (party.length ? party[random(0, party.length - 1)] : undefined);
    hunt.leader = leader?.childId ?? null;
  }

  /** 调试用：生成一只指定性格的成年鹰崽。 */
  public createDebugChild(name: string, gender: string, features: Record<string, unknown>, trait: BirdTowerTrait): number {
    const hatched = new DateTime(Time.date).addDays(-200).timeStamp;
    const laid = new DateTime(hatched).addDays(-28).timeStamp;
    const conceived = new DateTime(laid).addDays(-14).timeStamp;
    const pregnancyId = pushPregnancyRecord({
      carrier: 'unknown hawk',
      carrierSpecies: 'hawk',
      donor: 'unknown hawk',
      donorSpecies: 'hawk',
      conceivedDate: conceived,
      conceivedLocation: 'unknown',
      orifice: 'vagina',
      deliveredDate: laid,
      deliveredLocation: 'unknown',
      hatchDelay: 0,
      layCare: 0
    });
    const childId = pushChildRecord({ pregnancyId, species: 'hawk', name, gender, features, bornDate: hatched });
    const child = V.childRecords[childId] as HawkChild;
    beginRearing(child, 'otherNest', 'unknown');
    child.development.trait = trait;
    this.init(childId);
    return childId;
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly BirdTower: BirdTower;
  }
}

export default BirdTower;
