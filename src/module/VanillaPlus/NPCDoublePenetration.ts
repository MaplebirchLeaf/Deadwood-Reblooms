export type NPCDoubleOrifice = 'vagina' | 'anus';
export type NPCDoubleStage = 'entrance' | 'imminent' | 'penetrated';

export interface NPCDoublePenetrationState {
  recipient: number;
  partner: number;
  partnerLocation?: string | number;
  partnerVagina?: string | number;
  orifice: NPCDoubleOrifice;
  stage: NPCDoubleStage;
}

// 不含 vagina/anus，避免原版把第二名 NPC 误判为正在插入 PC。
const PARTNER_ENTRANCE = 'dr-npc-double-entrance';
const PARTNER_IMMINENT = 'dr-npc-double-imminent';
const PARTNER_PENETRATED = 'dr-npc-double';
const PARTNER_BODY = 'dr-npc-double-body';
const PARTNER_STATES = [PARTNER_ENTRANCE, PARTNER_IMMINENT, PARTNER_PENETRATED];
const PLAYER_VAGINA_STATES = ['vaginaentrance', 'vaginaimminent', 'vagina'];
const PLAYER_ANUS_STATES = ['anusentrance', 'anusimminent', 'anus'];

class NPCDoublePenetration {
  private hasStrapon(index: number): boolean {
    return (window as typeof window & { npcHasStrapon?: (target: number) => boolean }).npcHasStrapon?.(index) ?? false;
  }

  public get state(): NPCDoublePenetrationState | undefined {
    return V.NPCDoublePenetration;
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
    return Number.isInteger(target) && !!npc && this.validNpc(target) && npc.penis === 0 && (npc.penissize > 0 || this.hasStrapon(target));
  }

  // 玩家身上的阴道、肛门双插沿用原版状态；两组可同时存在，也不会占用 NPC 目标双插的数据。
  public canJoinPlayer(index: number, orifice: NPCDoubleOrifice): boolean {
    const target = Number(index);
    const npc = V.NPCList?.[target];
    if (!Number.isInteger(target) || !npc || !this.validNpc(target) || npc.penis !== 0 || (npc.penissize <= 0 && !this.hasStrapon(target))) return false;
    if (orifice === 'vagina') {
      const primary = V.NPCList?.[V.vaginatarget];
      return V.player?.vaginaExist && V.vaginause === 'penis' && Number(V.vaginatarget) !== target && !!primary && PLAYER_VAGINA_STATES.includes(primary.penis);
    }
    const primary = V.NPCList?.[V.anustarget];
    return V.anususe === 'penis' && Number(V.anustarget) !== target && !!primary && PLAYER_ANUS_STATES.includes(primary.penis);
  }

  // 把指定 NPC 写入原版第二目标；后续动作、X-ray 与射精都继续由原版双插逻辑处理。
  public joinPlayer(index: number, orifice: NPCDoubleOrifice): boolean {
    const target = Number(index);
    if (!this.canJoinPlayer(target, orifice)) return false;
    const npc = V.NPCList[target];
    npc.location ??= {};
    npc.location.genitals = 'genitals';

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
    this.clear();
    const recipientTarget = Number(recipient);
    const partnerTarget = Number(partner);
    if (!Number.isInteger(recipientTarget) || !Number.isInteger(partnerTarget) || recipientTarget === partnerTarget || !this.validNpc(recipientTarget) || !this.validNpc(partnerTarget)) return false;
    const partnerNpc = V.NPCList[partnerTarget];
    if (!this.canJoin(partnerTarget)) return false;

    V.NPCDoublePenetration = {
      recipient: recipientTarget,
      partner: partnerTarget,
      partnerLocation: partnerNpc.location?.genitals ?? 0,
      partnerVagina: partnerNpc.vagina,
      orifice,
      stage: this.pcStage(orifice)
    };
    partnerNpc.location ??= {};
    partnerNpc.location.genitals = 'genitals';
    partnerNpc.penis = this.partnerState(V.NPCDoublePenetration.stage);
    // 双性 NPC 的空闲阴部会触发原版 vaginainit，造成其一边插入目标、一边随机转向 PC。
    if (partnerNpc.vagina === 0) partnerNpc.vagina = PARTNER_BODY;
    return this.update();
  }

  // 每回合跟随 PC 的插入阶段；目标变化、拔出或 NPC 退场时立即清理。
  public update(): boolean {
    const state = this.state;
    if (!state || !this.valid()) {
      this.clear();
      return false;
    }

    state.stage = this.pcStage(state.orifice);
    const partner = V.NPCList[state.partner];
    partner.penis = this.partnerState(state.stage);
    if (state.partnerVagina === 0) partner.vagina = PARTNER_BODY;
    return true;
  }

  public clear(): void {
    const state = this.state;
    const partner = state && V.NPCList?.[state.partner];
    if (partner && PARTNER_STATES.includes(partner.penis)) {
      partner.penis = 0;
      partner.location ??= {};
      partner.location.genitals = state?.partnerLocation ?? 0;
    }
    if (partner?.vagina === PARTNER_BODY) partner.vagina = state?.partnerVagina ?? 0;
    delete V.NPCDoublePenetration;
  }

  private valid(): boolean {
    const state = this.state;
    if (!state || V.combat !== 1 || Number(V.penistarget) !== state.recipient) return false;
    if (!this.validNpc(state.recipient) || !this.validNpc(state.partner)) return false;
    if (!PARTNER_STATES.includes(V.NPCList[state.partner].penis)) return false;
    return state.orifice === 'vagina'
      ? V.penisuse === 'othervagina' && ['entrance', 'imminent', 'penetrated'].includes(V.penisstate)
      : V.penisuse === 'otheranus' && ['otheranusentrance', 'otheranus'].includes(V.penisstate);
  }

  private validNpc(index: number): boolean {
    const npc = V.NPCList?.[index];
    return npc?.active === 'active' && npc.stance !== 'defeated';
  }

  private pcStage(orifice: NPCDoubleOrifice): NPCDoubleStage {
    if (orifice === 'anus') return V.penisstate === 'otheranus' ? 'penetrated' : 'entrance';
    if (V.penisstate === 'penetrated') return 'penetrated';
    return V.penisstate === 'imminent' ? 'imminent' : 'entrance';
  }

  private partnerState(stage: NPCDoubleStage): string {
    if (stage === 'penetrated') return PARTNER_PENETRATED;
    return stage === 'imminent' ? PARTNER_IMMINENT : PARTNER_ENTRANCE;
  }
}

export default NPCDoublePenetration;
