// ./src/module/LifeSimulation/PoolParty.ts

import { POOL_PARTY_COMPANIONS, type PoolPartyCompanion, type PoolPartyState } from '../constants';

const SCHOOL_MEETING_PASSAGES: Record<string, string> = { library: 'School Library', canteen: 'Canteen', rear_courtyard: 'School Rear Courtyard' };

type PoolPartyReply = 'accept' | 'refuse' | 'decline';

class PoolParty {
  public constructor(private readonly core: typeof maplebirch) {}

  private get store(): PoolPartyState {
    return V.LifeSimulation.pool_party as PoolPartyState;
  }

  private get stage(): string {
    return String(V.weekly.schoolNightPoolParty ?? '');
  }

  public get known(): boolean {
    return ['intro', 'discover', 'admission'].includes(this.stage);
  }

  public get tonight(): boolean {
    return ['changingRoom', 'party', 'rape'].includes(this.stage);
  }

  public get companions(): readonly PoolPartyCompanion[] {
    return this.store.companions.filter(name => this.available(name));
  }

  public has(name: PoolPartyCompanion): boolean {
    return this.companions.includes(name);
  }

  /** 原版围堵与换衣阶段不追加自愿互动。 */
  public get canInteract(): boolean {
    return this.stage === 'party' && !V.combat && V.exposed <= 0 && V.stress < V.stressmax && !V.gag && !this.kylarRaging;
  }

  public canTogether(name: PoolPartyCompanion): boolean {
    return this.canInteract && this.has(name) && this.reply(name) === 'accept';
  }

  public get groupAllowed(): boolean {
    return this.canTogether('Whitney');
  }

  private available(name: PoolPartyCompanion): boolean {
    if (C.npc[name]?.init !== 1 || !window.isLoveInterest(name)) return false;
    switch (name) {
      case 'Robin':
        return !V.robinmissing && V.robin.timer.hurt === 0 && V.RobinExpansion?.asylum.status !== 'admitted';
      case 'Whitney':
        return !['prison', 'dungeon', 'pillory'].includes(C.npc.Whitney.state);
      case 'Kylar':
        return C.npc.Kylar.state === 'active';
      case 'Sydney':
        return !['prison', 'dungeon'].includes(C.npc.Sydney.state) && V.daily.sydney?.punish !== 1;
    }
  }

  /** 当面邀约跟随原版日程和页面入口，不把整个 school／docks 当成 NPC 在场。 */
  private present(name: PoolPartyCompanion): boolean {
    const passage = this.core.passage.title;
    switch (name) {
      case 'Robin':
        return (
          (passage === "Robin's Room Entrance" && window.getRobinLocation() === 'orphanage' && T.uniqueoptions === false) ||
          (passage === 'History Classroom' && window.getRobinLocation() === 'school' && V.schoolstate === 'lunch' && V.robinhistory === 'seat')
        );
      case 'Whitney':
        return (
          passage === 'School Front Courtyard' &&
          Time.schoolDay &&
          V.schoolstate === 'afternoon' &&
          V.bullytimer >= 1 &&
          V.bullytimeroutside >= 1 &&
          V.daily.whitney?.bullyGate !== 1 &&
          !(V.detention >= 1 && V.daily.school.detentionAttended !== 1 && V.headnodetention !== 1 && V.pillory.tenant.special.name !== 'Leighton')
        );
      case 'Kylar':
        return SCHOOL_MEETING_PASSAGES[window.getKylarLocation().area] === passage;
      case 'Sydney':
        window.sydneySchedule?.();
        return (
          (T.sydney_location === 'library' && passage === 'School Library') ||
          (T.sydney_location === 'canteen' && passage === 'Canteen') ||
          (T.sydney_location === 'temple' && passage === 'Temple' && ['pray', 'garden', 'quarters'].includes(V.sydney_templeWork))
        );
    }
  }

  public canInvite(name: PoolPartyCompanion): boolean {
    return this.known && !this.has(name) && this.available(name) && !V.combat && !V.statFreeze && !V.replayScene && V.exposed <= 0 && V.stress < V.stressmax && !V.gag && this.present(name);
  }

  public reply(name: PoolPartyCompanion): PoolPartyReply {
    if (!this.available(name)) return 'refuse';
    const npc = C.npc[name];

    switch (name) {
      case 'Robin':
        if (npc.trauma >= 60) return 'refuse';
        return npc.love >= 60 ? 'accept' : 'refuse';
      case 'Whitney':
        return npc.love >= 21 ? 'accept' : 'refuse';
      case 'Kylar':
        return npc.love >= 60 ? 'accept' : 'refuse';
      default:
        if (npc.purity >= 50) return 'decline';
        return npc.corruption >= 30 ? 'accept' : 'refuse';
    }
  }

  public invite(name: PoolPartyCompanion): PoolPartyReply | 'unavailable' {
    if (!this.canInvite(name)) return 'unavailable';
    const result = this.reply(name);
    if (result === 'accept') this.store.companions.push(name);
    return result;
  }

  public get reachable(): PoolPartyCompanion[] {
    return POOL_PARTY_COMPANIONS.filter(name => this.canInvite(name));
  }

  public once(key: string): boolean {
    if (this.store.scenes.includes(key)) return false;
    this.store.scenes.push(key);
    return true;
  }

  public hasScene(key: string): boolean {
    return this.store.scenes.includes(key);
  }

  public attend(): boolean {
    if (!this.tonight) return false;
    this.store.companions = this.store.companions.filter(name => this.reply(name) === 'accept');
    if (!this.companions.length || !this.once('greeting')) return false;
    for (const name of this.companions) {
      if (!this.store.met.includes(name)) this.store.met.push(name);
    }
    return true;
  }

  public get met(): readonly PoolPartyCompanion[] {
    return this.store.met;
  }

  public get kylarRage(): number {
    return Math.trunc(Number(C.npc.Kylar?.rage) || 0);
  }

  public get kylarRaging(): boolean {
    return this.has('Kylar') && this.kylarRage >= this.kylarRageLimit;
  }

  public get kylarRageLimit(): number {
    return 60;
  }

  // 按游戏日去重，散场清空 scenes 后也不会重复提醒或发作。
  public kylarWarned(): boolean {
    return this.onceToday('kylar_warned_day');
  }

  public kylarBroke(): boolean {
    return this.onceToday('kylar_broke_day');
  }

  public get kylarSubdued(): boolean {
    return this.canTogether('Kylar') && this.hasScene('with:Kylar') && C.npc.Kylar.love >= 80 && C.npc.Kylar.lust >= 40 && C.npc.Kylar.dom <= 30;
  }

  public get kylarPartners(): PoolPartyCompanion[] {
    if (!this.kylarSubdued) return [];
    return this.companions.filter(name => (name === 'Robin' || name === 'Sydney') && this.canTogether(name) && (name !== 'Robin' || C.npc.Robin.trauma < 40));
  }

  public witnessed(): boolean {
    if (!this.has('Kylar')) return false;
    this.adjust('Kylar', 'rage', 10);
    return this.kylarRaging;
  }

  public bystanders(except: readonly PoolPartyCompanion[]): PoolPartyCompanion[] {
    return this.companions.filter(name => !except.includes(name));
  }

  public jealous(witnesses: readonly PoolPartyCompanion[]): boolean {
    if (!witnesses.length) return false;

    for (const name of ['Robin', 'Sydney', 'Whitney'] as const) {
      if (!witnesses.includes(name)) continue;
      this.adjust(name, 'love', -1);
      if (name === 'Robin' && C.npc.Robin.trauma >= 40) this.adjust(name, 'trauma', 2);
    }
    return witnesses.includes('Kylar') ? this.witnessed() : this.kylarRaging;
  }

  public breakUp(): void {
    V.weekly.schoolNightPoolParty = false;
    this.settle();
  }

  // met 保留跨场同行记录，嫉妒仍由原版 NPC 属性维护。
  public settle(): void {
    this.store.selected = null;
    this.store.reply = null;
    this.store.return_passage = null;
    this.store.companions = [];
    this.store.scenes = [];
    this.store.last_day = Time.days;
  }

  // 双誓约只读取归途之书，不另存关系状态。
  public get dualPromise(): boolean {
    return Boolean(this.core.get('RobinTemple') && V.RobinTemple?.dual_promise);
  }

  public get vowReady(): boolean {
    return this.canTogether('Robin') && this.canTogether('Sydney') && C.npc.Robin.trauma < 40 && this.dualPromise;
  }

  private onceToday(key: 'kylar_warned_day' | 'kylar_broke_day'): boolean {
    const day = Time.days;
    if (this.store[key] === day) return false;
    this.store[key] = day;
    return true;
  }

  private adjust(name: PoolPartyCompanion, stat: 'love' | 'rage' | 'trauma', amount: number): void {
    this.core.SugarCube.Wikifier.wikifyEval(`<<npcincr ${name} ${stat} ${amount}>>`);
  }

  public preInit(): void {
    // 只在已邀约的派对结束后清场，历史同行记录不受影响。
    this.core.dynamic.regStateEvent('gate', 'life-simulation-pool-party-settle', {
      cond: () => {
        if (!V.LifeSimulation?.pool_party?.companions?.length) return false;
        return !this.known && !this.tonight;
      },
      action: () => this.settle()
    });
  }
}

export default PoolParty;
