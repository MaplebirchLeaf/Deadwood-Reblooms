export type NPCDoubleOrifice = 'vagina' | 'anus';
export type NPCDoubleStage = 'entrance' | 'imminent' | 'penetrated';

export interface NPCDoublePenetrationState {
  recipient: number;
  partner: number;
  partnerLocation?: string | number;
  partnerVagina?: string | number;
  orifice: NPCDoubleOrifice;
  stage: NPCDoubleStage;
  playerLegLock?: NPCDoublePlayerLegLockState;
}

export interface NPCDoublePlayerLegLockState {
  targets: number[];
}

export type NPCDoublePenetrationData = Partial<NPCDoublePenetrationState> & {
  playerLegLock?: NPCDoublePlayerLegLockState;
};

// 沿用原版“插入另一名 NPC”的 other 阶段命名；不含 vagina/anus/double，避免原版把同伴误判为正在插入 PC。
const PARTNER_ENTRANCE = 'otherentrance';
const PARTNER_IMMINENT = 'otherimminent';
const PARTNER_PENETRATED = 'otherpenetrated';
const PARTNER_BODY = 'idle';
const PARTNER_STATES = [PARTNER_ENTRANCE, PARTNER_IMMINENT, PARTNER_PENETRATED];
const PLAYER_VAGINA_STATES = ['vaginaentrance', 'vaginaimminent', 'vagina'];
const PLAYER_ANUS_STATES = ['anusentrance', 'anusimminent', 'anus'];

class NPCDoublePenetration {
  private hasStrapon(index: number): boolean {
    return window.npcHasStrapon?.(index) ?? false;
  }

  public get state(): NPCDoublePenetrationState | undefined {
    const state = V.VanillaPlus?.npcDoublePenetration;
    if (!state || typeof state.recipient !== 'number' || typeof state.partner !== 'number' || !state.orifice || !state.stage) return undefined;
    return state as NPCDoublePenetrationState;
  }

  public setPlayerLegLock(targets: number[]): void {
    const activeTargets = [...new Set(targets.map(Number))].filter(target => this.validNPC(target));
    if (activeTargets.length < 2) return;
    const state = V.VanillaPlus.npcDoublePenetration ?? {};
    state.playerLegLock = { targets: activeTargets };
    V.VanillaPlus.npcDoublePenetration = state;
  }

  public clearPlayerLegLock(): void {
    const state = V.VanillaPlus?.npcDoublePenetration;
    if (!state) return;
    delete state.playerLegLock;
    if (typeof state.recipient !== 'number' || typeof state.partner !== 'number') V.VanillaPlus.npcDoublePenetration = null;
  }

  public get playerLegLock(): NPCDoublePlayerLegLockState | undefined {
    return V.VanillaPlus?.npcDoublePenetration?.playerLegLock;
  }

  // 阴道与肛门双插可以同时存在；锁腿需要得到当前所有实际插入 PC 的 NPC。
  public playerPenetrators(orifice?: NPCDoubleOrifice): number[] {
    const targets: number[] = [];
    if ((!orifice || orifice === 'vagina') && V.vaginause === 'penisdouble' && V.vaginastate === 'doublepenetrated') {
      targets.push(Number(V.vaginatarget), Number(V.vaginadoubletarget));
    }
    if ((!orifice || orifice === 'anus') && V.anususe === 'penisdouble' && V.anusstate === 'doublepenetrated') {
      targets.push(Number(V.anustarget), Number(V.anusdoubletarget));
    }
    return [...new Set(targets)].filter(target => this.validNPC(target));
  }

  public get visible(): boolean {
    return this.state?.stage === 'penetrated' && this.valid();
  }

  public isPartner(index: number): boolean {
    return this.state?.partner === Number(index) && this.valid();
  }

  // NPC 目标双插只使用真正空闲的阴茎，不能把正在插入 PC 的 NPC 强行挪走。
  public canJoin(index: number): boolean {
    const target = Number(index);
    const npc = V.NPCList?.[target];
    return Number.isInteger(target) && !!npc && this.validNPC(target) && npc.penis === 0 && (npc.penissize > 0 || this.hasStrapon(target));
  }

  // 玩家身上的阴道、肛门双插沿用原版状态；两组可同时存在，也不会占用 NPC 目标双插的数据。
  public canJoinPlayer(index: number, orifice: NPCDoubleOrifice): boolean {
    const target = Number(index);
    const npc = V.NPCList?.[target];
    if (!Number.isInteger(target) || !npc || !this.validNPC(target) || npc.penis !== 0 || (npc.penissize <= 0 && !this.hasStrapon(target))) return false;
    if (orifice === 'vagina') {
      const primary = V.NPCList?.[V.vaginatarget];
      return V.player?.vaginaExist && V.vaginause === 'penis' && Number(V.vaginatarget) !== target && this.validNPC(Number(V.vaginatarget)) && PLAYER_VAGINA_STATES.includes(primary.penis);
    }
    const primary = V.NPCList?.[V.anustarget];
    return V.anususe === 'penis' && Number(V.anustarget) !== target && this.validNPC(Number(V.anustarget)) && PLAYER_ANUS_STATES.includes(primary.penis);
  }

  // 把指定 NPC 写入原版第二目标；后续动作、X-ray 与射精都继续由原版双插逻辑处理。
  public joinPlayer(index: number, orifice: NPCDoubleOrifice): boolean {
    const target = Number(index);
    if (!this.canJoinPlayer(target, orifice)) return false;
    const npc = V.NPCList[target];
    npc.location ??= {};
    npc.location.genitals = 'genitals';
    // 原版开始双插时会先释放正在占用对应穴位的手，避免部位同时保留两种动作。
    if (V.leftarm === orifice) V.leftarm = 0;
    if (V.rightarm === orifice) V.rightarm = 0;

    if (orifice === 'vagina') {
      const primary = V.NPCList[V.vaginatarget];
      V.vaginadoubletarget = target;
      V.vaginause = 'penisdouble';
      V.vaginaactiondefault = 'vaginatopenisdouble';
      npc.penis = 'vaginaentrancedouble';
      if (primary.penis === 'vagina') {
        primary.penis = 'vaginadouble';
        V.vaginastate = 'doublepenetrated';
      } else if (primary.penis === 'vaginaimminent') {
        primary.penis = 'vaginaimminentdouble';
        V.vaginastate = 'doubleimminent';
      } else {
        primary.penis = 'vaginaentrancedouble';
        V.vaginastate = 'doubleentrance';
      }
      return true;
    }

    const primary = V.NPCList[V.anustarget];
    V.anusdoubletarget = target;
    V.anususe = 'penisdouble';
    V.anusactiondefault = 'penisdoubletease';
    npc.penis = 'anusentrancedouble';
    if (primary.penis === 'anus') {
      primary.penis = 'anusdouble';
      V.anusstate = 'doublepenetrated';
    } else if (primary.penis === 'anusimminent') {
      primary.penis = 'anusimminentdouble';
      V.anusstate = 'doubleimminent';
    } else {
      primary.penis = 'anusentrancedouble';
      V.anusstate = 'doubleentrance';
    }
    return true;
  }

  // 记录目标和第二名插入者；PC 仍沿用原版 $penis* 状态。
  public begin(recipient: number, partner: number, orifice: NPCDoubleOrifice): boolean {
    const recipientTarget = Number(recipient);
    const partnerTarget = Number(partner);
    if (!Number.isInteger(recipientTarget) || !Number.isInteger(partnerTarget) || recipientTarget === partnerTarget || !this.validNPC(recipientTarget) || !this.validNPC(partnerTarget)) return false;
    const partnerNPC = V.NPCList[partnerTarget];
    if (!this.canJoin(partnerTarget)) return false;
    const playerLegLock = this.playerLegLock;
    this.clearNPCPenetration();

    V.VanillaPlus.npcDoublePenetration = {
      recipient: recipientTarget,
      partner: partnerTarget,
      partnerLocation: partnerNPC.location?.genitals ?? 0,
      partnerVagina: partnerNPC.vagina,
      orifice,
      stage: this.pcStage(orifice),
      ...(playerLegLock ? { playerLegLock } : {})
    };
    partnerNPC.location ??= {};
    partnerNPC.location.genitals = 'genitals';
    partnerNPC.penis = this.partnerState(V.VanillaPlus.npcDoublePenetration.stage);
    this.markRecipient(V.VanillaPlus.npcDoublePenetration);
    // 双性 NPC 的空闲阴部会触发原版 vaginainit，造成其一边插入目标、一边随机转向 PC。
    if (partnerNPC.vagina === 0) partnerNPC.vagina = PARTNER_BODY;
    return this.update();
  }

  // 每回合跟随 PC 的插入阶段；目标变化、拔出或 NPC 退场时立即清理。
  public update(): boolean {
    this.updatePlayerLegLock();
    const state = this.state;
    if (!state) return false;
    if (!this.valid()) {
      this.clearNPCPenetration();
      return false;
    }

    state.stage = this.pcStage(state.orifice);
    const partner = V.NPCList[state.partner];
    partner.penis = this.partnerState(state.stage);
    if (state.partnerVagina === 0) partner.vagina = PARTNER_BODY;
    this.markRecipient(state);
    return true;
  }

  public clear(): void {
    this.clearNPCPenetration();
    if (V.VanillaPlus) V.VanillaPlus.npcDoublePenetration = null;
  }

  private clearNPCPenetration(): void {
    const state = this.state;
    const partner = state && V.NPCList?.[state.partner];
    if (partner && PARTNER_STATES.includes(partner.penis)) {
      partner.penis = 0;
      partner.location ??= {};
      partner.location.genitals = state?.partnerLocation ?? 0;
    }
    if (state?.partnerVagina === 0 && partner?.vagina === PARTNER_BODY) partner.vagina = 0;
    const recipient = state && V.NPCList?.[state.recipient];
    if (state && recipient?.VanillaPlus?.npcDoublePenetration?.partner === state.partner) {
      delete recipient.VanillaPlus.npcDoublePenetration;
      if (Object.keys(recipient.VanillaPlus).length === 0) delete recipient.VanillaPlus;
    }
    if (V.VanillaPlus && state) {
      const playerLegLock = state.playerLegLock;
      V.VanillaPlus.npcDoublePenetration = playerLegLock ? { playerLegLock } : null;
    }
  }

  private updatePlayerLegLock(): void {
    const lock = this.playerLegLock;
    if (!lock) return;
    const targets = lock.targets.map(Number);
    const activeTargets = this.playerPenetrators();
    const stillLocked = targets.length >= 2 && targets.length === activeTargets.length && targets.every(target => activeTargets.includes(target));
    if (V.feetuse !== 'legLock' || !stillLocked) {
      V.feetuse = 0;
      V.leglocktarget = undefined;
      this.clearPlayerLegLock();
    }
  }

  private valid(): boolean {
    const state = this.state;
    if (!state || V.combat !== 1 || Number(V.penistarget) !== state.recipient) return false;
    if (!this.validNPC(state.recipient) || !this.validNPC(state.partner)) return false;
    return state.orifice === 'vagina'
      ? V.penisuse === 'othervagina' && ['entrance', 'imminent', 'penetrated'].includes(V.penisstate)
      : V.penisuse === 'otheranus' && ['otheranusentrance', 'otheranusimminent', 'otheranus'].includes(V.penisstate);
  }

  private validNPC(index: number): boolean {
    const npc = V.NPCList?.[index];
    return npc?.active === 'active' && npc.stance !== 'defeated';
  }

  private markRecipient(state: NPCDoublePenetrationState): void {
    const recipient = V.NPCList[state.recipient];
    recipient.VanillaPlus ??= {};
    recipient.VanillaPlus.npcDoublePenetration = { partner: state.partner, orifice: state.orifice, stage: state.stage };
  }

  private pcStage(orifice: NPCDoubleOrifice): NPCDoubleStage {
    if (orifice === 'anus') {
      if (V.penisstate === 'otheranus') return 'penetrated';
      return V.penisstate === 'otheranusimminent' ? 'imminent' : 'entrance';
    }
    if (V.penisstate === 'penetrated') return 'penetrated';
    return V.penisstate === 'imminent' ? 'imminent' : 'entrance';
  }

  private partnerState(stage: NPCDoubleStage): string {
    if (stage === 'penetrated') return PARTNER_PENETRATED;
    return stage === 'imminent' ? PARTNER_IMMINENT : PARTNER_ENTRANCE;
  }
}

export default NPCDoublePenetration;
