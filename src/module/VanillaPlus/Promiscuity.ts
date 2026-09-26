// ./src/module/VanillaPlus/Promiscuity.ts

import type VanillaPlus from '../VanillaPlus';

type PenisDestination = 'vagina' | 'anus';

type PromiscuityAction =
  | 'hand-vagina'
  | 'hand-penis'
  | 'hand-anus'
  | 'mouth-kiss'
  | 'mouth-chest'
  | 'mouth-thigh'
  | 'mouth-bottom'
  | 'mouth-vagina'
  | 'mouth-penis'
  | 'mouth-anus'
  | 'offer-penis-to-mouth'
  | 'offer-vagina-to-mouth'
  | 'offer-anus-to-mouth'
  | 'penetrate-vagina'
  | 'penetrate-anus'
  | 'offer-vagina-to-penis'
  | 'offer-anus-to-penis';

class Promiscuity {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  private npc(index: number) {
    const target = Number(index);
    const npc = V.NPCList?.[target];
    return Number.isInteger(target) && npc?.active === 'active' && npc.stance !== 'defeated' ? npc : undefined;
  }

  private hasStrapon(index: number): boolean {
    return window.npcHasStrapon?.(index) ?? false;
  }

  public get expanded(): boolean {
    return V.VanillaPlus.lock.promiscuity && V.promiscuity >= this.vanillaPlus.normalCeiling('promiscuity');
  }

  public get mastered(): boolean {
    return !!V.VanillaPlus.traits.promiscuity;
  }

  // 原版用 0 同时表示“部位空闲”和“并不存在”；主动动作还要确认 NPC 确实拥有该部位。
  public hasPenis(index: number): boolean {
    const target = Number(index);
    const npc = this.npc(target);
    return !!npc && (npc.penissize > 0 || this.hasStrapon(target));
  }

  public penisAvailable(index: number): boolean {
    const target = Number(index);
    return this.npc(target)?.penis === 0 && this.hasPenis(target);
  }

  public vaginaAvailable(index: number): boolean {
    const target = Number(index);
    const npc = this.npc(target);
    // 原版以 vagina === "none" 表示没有阴部；0 则表示确实拥有且当前空闲，不能再由 gender 推断。
    return !!npc && npc.vagina === 0;
  }

  public anusAvailable(index: number): boolean {
    const target = Number(index);
    const npc = this.npc(target);
    if (!npc) return false;
    const occupied = [npc.penis, npc.vagina].some(value => typeof value === 'string' && value.includes('otheranus'));
    return !occupied && (npc.penis === 0 || npc.vagina === 0);
  }

  // PC 已对准当前 NPC 的一个穴位时，可以主动移向同一人的另一个穴位。
  public canSwitchPenis(destination: PenisDestination, index: number): boolean {
    const target = Number(index);
    const npc = this.npc(target);
    if (!npc || Number(V.penistarget) !== target) return false;

    if (destination === 'vagina') {
      if (V.penisuse !== 'otheranus' || !['otheranusentrance', 'otheranusimminent', 'otheranus'].includes(V.penisstate)) return false;
      return npc.vagina === 0 || (typeof npc.vagina === 'string' && npc.vagina.includes('otheranus'));
    }

    if (V.penisuse !== 'othervagina' || !['entrance', 'imminent', 'penetrated'].includes(V.penisstate)) return false;
    const anusOccupied = [npc.penis, npc.vagina].some(value => typeof value === 'string' && value.includes('otheranus'));
    const vaginaOccupiedByPlayer = ['penisentrance', 'penisimminent', 'penis'].includes(String(npc.vagina));
    return !anusOccupied && (npc.penis === 0 || vaginaOccupiedByPlayer);
  }

  // 先释放旧穴位，再交给原版 penistovagina/penistoanus 效果完成新姿势及技能检定。
  public preparePenisSwitch(destination: PenisDestination, index: number): boolean {
    const target = Number(index);
    if (!this.canSwitchPenis(destination, target)) return false;
    if (destination === 'vagina') this.releaseAnus(target);
    else this.releaseVagina(target);
    return this.canDirect(destination === 'vagina' ? 'offer-vagina-to-penis' : 'offer-anus-to-penis', target);
  }

  // 动作栏绘制与回合结算共用占用规则，避免覆盖另一名 NPC 正在使用的部位。
  public canDirect(action: PromiscuityAction, index: number): boolean {
    const target = Number(index);
    const npc = this.npc(target);
    if (!npc) return false;

    const handAvailable = npc.lefthand === 0 || npc.righthand === 0;
    const mouthAvailable = npc.mouth === 0;
    switch (action) {
      case 'hand-vagina':
        return handAvailable && !!V.player?.vaginaExist && !V.vaginause;
      case 'hand-penis':
        return handAvailable && !!V.player?.penisExist && !V.penisuse;
      case 'hand-anus':
        return handAvailable && !V.anususe;
      case 'mouth-kiss':
        return mouthAvailable && !V.mouthuse;
      case 'mouth-chest':
        return mouthAvailable && !V.chestuse;
      case 'mouth-thigh':
        return mouthAvailable && !V.thighuse;
      case 'mouth-bottom':
        return mouthAvailable && !V.bottomuse;
      case 'mouth-vagina':
        return mouthAvailable && !!V.player?.vaginaExist && !V.vaginause;
      case 'mouth-penis':
        return mouthAvailable && !!V.player?.penisExist && !V.penisuse;
      case 'mouth-anus':
        return mouthAvailable && !V.anususe;
      case 'offer-penis-to-mouth':
        return !V.mouthuse && this.penisAvailable(target);
      case 'offer-vagina-to-mouth':
        return !V.mouthuse && this.vaginaAvailable(target);
      case 'offer-anus-to-mouth':
        return !V.mouthuse && this.anusAvailable(target) && npc.vagina === 0;
      case 'penetrate-vagina':
        return !!V.player?.vaginaExist && !V.vaginause && this.penisAvailable(target);
      case 'penetrate-anus':
        return !V.anususe && this.penisAvailable(target);
      case 'offer-vagina-to-penis':
        return !!V.player?.penisExist && !V.penisuse && this.vaginaAvailable(target);
      case 'offer-anus-to-penis':
        return !!V.player?.penisExist && !V.penisuse && this.anusAvailable(target);
    }
  }

  // Ask 可以把同一名 NPC 从旧动作移到新动作；这里只检查身体条件与目标位置，不要求其当前部位空闲。
  public canAsk(action: PromiscuityAction, index: number): boolean {
    const target = Number(index);
    const npc = this.npc(target);
    if (!npc) return false;

    const destinationAvailable = (part: 'mouth' | 'vagina' | 'penis' | 'anus' | 'chest' | 'thigh' | 'bottom', sameAction: boolean) => {
      const state = V as unknown as Record<string, unknown>;
      const use = state[`${part}use`];
      return !use || (Number(state[`${part}target`]) === target && !sameAction);
    };
    const vaginaFree = (sameAction: boolean) => destinationAvailable('vagina', sameAction);
    const penisFree = (sameAction: boolean) => destinationAvailable('penis', sameAction);
    const anusFree = (sameAction: boolean) => destinationAvailable('anus', sameAction);
    const mouthFree = (sameAction: boolean) => destinationAvailable('mouth', sameAction);
    const hasVagina = ['f', 'h'].includes(npc.gender);

    switch (action) {
      case 'hand-vagina':
        return !!V.player?.vaginaExist && vaginaFree(V.vaginause === 1 || String(V.vaginause).includes('hand'));
      case 'hand-penis':
        return !!V.player?.penisExist && penisFree(V.penisuse === 1 || String(V.penisuse).includes('hand'));
      case 'hand-anus':
        return anusFree(String(V.anususe).includes('hand'));
      case 'mouth-kiss':
        return mouthFree(V.mouthuse === 'kiss');
      case 'mouth-chest':
        return destinationAvailable('chest', V.chestuse === 'mouth');
      case 'mouth-thigh':
        return destinationAvailable('thigh', V.thighuse === 'mouth');
      case 'mouth-bottom':
        return destinationAvailable('bottom', V.bottomuse === 'mouth');
      case 'mouth-vagina':
        return !!V.player?.vaginaExist && vaginaFree(V.vaginause === 'othermouth');
      case 'mouth-penis':
        return !!V.player?.penisExist && penisFree(V.penisuse === 'othermouth');
      case 'mouth-anus':
        return anusFree(V.anususe === 'othermouth');
      case 'offer-penis-to-mouth':
        return mouthFree(V.mouthuse === 'penis') && this.hasPenis(target);
      case 'offer-vagina-to-mouth':
        return mouthFree(V.mouthuse === 'facesit' && V.mouthstate === 'vagina') && hasVagina;
      case 'offer-anus-to-mouth':
        return mouthFree(V.mouthuse === 'facesit' && V.mouthstate === 'anal');
      case 'penetrate-vagina':
        return !!V.player?.vaginaExist && vaginaFree(String(V.vaginause).includes('penis')) && this.hasPenis(target);
      case 'penetrate-anus':
        return anusFree(String(V.anususe).includes('penis')) && this.hasPenis(target);
      case 'offer-vagina-to-penis':
      case 'offer-anus-to-penis':
        return this.canDirect(action, target);
    }
  }

  // Ask 成功后才换位：先收回 NPC 要用的部位，再解除他对目标位置的旧占用。
  public move(action: PromiscuityAction, index: number): boolean {
    const target = Number(index);
    if (!this.canAsk(action, target)) return false;
    if (action.startsWith('hand-')) this.releaseHands(target);
    else if (action.startsWith('mouth-')) this.releaseMouth(target);
    else if (action === 'offer-vagina-to-mouth') this.releaseVagina(target);
    else if (action === 'offer-anus-to-mouth') this.releaseAnus(target);
    else this.releasePenis(target);
    this.releaseDestination(action, target);
    return this.canDirect(action, target);
  }

  private releaseDestination(action: PromiscuityAction, target: number): void {
    const part =
      action.includes('vagina') && !action.startsWith('offer-vagina')
        ? 'vagina'
        : action.includes('anus') && !action.startsWith('offer-anus')
          ? 'anus'
          : action.includes('penis') && !action.startsWith('offer-penis')
            ? 'penis'
            : action.startsWith('mouth-') && action !== 'mouth-kiss'
              ? action.replace('mouth-', '')
              : 'mouth';
    const state = V as unknown as Record<string, unknown>;
    if (Number(state[`${part}target`]) !== target) return;
    const use = String(state[`${part}use`] ?? '');
    if (use === '1' || use.includes('hand')) this.releaseHands(target);
    else if (use.includes('mouth') || use === 'kiss') this.releaseMouth(target);
    else if (use.includes('penis')) this.releasePenis(target);
    else if (use === 'facesit') {
      if (V.mouthstate === 'anal') this.releaseAnus(target);
      else this.releaseVagina(target);
    } else if (use.includes('vagina')) this.releaseVagina(target);
    else if (use.includes('anus')) this.releaseAnus(target);
  }

  public releasePenis(index: number): void {
    const target = Number(index);
    const npc = this.npc(target);
    if (!npc) return;

    if (this.vanillaPlus.NPCDoublePenetration.isPartner(target)) this.vanillaPlus.NPCDoublePenetration.clear();
    if (V.mouthuse === 'penis' && Number(V.mouthtarget) === target) this.clear('mouth');
    if (V.penisuse === 'otherpenis' && Number(V.penistarget) === target) this.clear('penis');
    this.releaseVaginalPenis(target);
    this.releaseAnalPenis(target);
    npc.penis = 0;
    this.resetGenitals(target);
  }

  private releaseHands(target: number): void {
    const npc = this.npc(target);
    if (!npc) return;
    if (Number(V.vaginatarget) === target && (V.vaginause === 1 || String(V.vaginause).includes('hand'))) this.clear('vagina');
    if (Number(V.penistarget) === target && (V.penisuse === 1 || String(V.penisuse).includes('hand'))) this.clear('penis');
    if (Number(V.anustarget) === target && String(V.anususe).includes('hand')) this.clear('anus');
    if (Number(V.mouthtarget) === target && ['lefthand', 'righthand'].includes(String(V.mouthuse))) this.clear('mouth');
    npc.lefthand = 0;
    npc.righthand = 0;
  }

  private releaseMouth(target: number): void {
    const npc = this.npc(target);
    if (!npc) return;
    if (Number(V.mouthtarget) === target && V.mouthuse === 'kiss') this.clear('mouth');
    if (Number(V.vaginatarget) === target && V.vaginause === 'othermouth') this.clear('vagina');
    if (Number(V.penistarget) === target && V.penisuse === 'othermouth') this.clear('penis');
    if (Number(V.anustarget) === target && V.anususe === 'othermouth') this.clear('anus');
    if (Number(V.chesttarget) === target && V.chestuse === 'mouth') this.clear('chest');
    if (Number(V.thightarget) === target && V.thighuse === 'mouth') this.clear('thigh');
    if (Number(V.bottomtarget) === target && V.bottomuse === 'mouth') this.clear('bottom');
    npc.mouth = 0;
    npc.location ??= {};
    npc.location.head = 0;
  }

  private releaseVagina(target: number): void {
    const npc = this.npc(target);
    if (!npc) return;
    if (Number(V.mouthtarget) === target && V.mouthuse === 'facesit' && V.mouthstate === 'vagina') this.clear('mouth');
    if (Number(V.penistarget) === target && V.penisuse === 'othervagina') this.clear('penis');
    if (Number(V.vaginatarget) === target && V.vaginause === 'othervagina') this.clear('vagina');
    npc.vagina = 0;
    this.resetGenitals(target);
  }

  private releaseAnus(target: number): void {
    const npc = this.npc(target);
    if (!npc) return;
    if (Number(V.mouthtarget) === target && V.mouthuse === 'facesit' && V.mouthstate === 'anal') this.clear('mouth');
    if (Number(V.penistarget) === target && V.penisuse === 'otheranus') this.clear('penis');
    if (typeof npc.vagina === 'string' && npc.vagina.includes('otheranus')) npc.vagina = 0;
    if (typeof npc.penis === 'string' && npc.penis.includes('otheranus')) npc.penis = 0;
    this.resetGenitals(target);
  }

  private resetGenitals(target: number): void {
    const npc = this.npc(target);
    if (!npc || ![0, 'none'].includes(npc.penis) || ![0, 'none'].includes(npc.vagina)) return;
    npc.location ??= {};
    npc.location.genitals = 0;
  }

  private releaseVaginalPenis(target: number): void {
    if (V.vaginause === 'penis' && Number(V.vaginatarget) === target) {
      this.clear('vagina');
      return;
    }
    if (V.vaginause !== 'penisdouble') return;
    const primary = Number(V.vaginatarget);
    const secondary = Number(V.vaginadoubletarget);
    if (target !== primary && target !== secondary) return;
    const remaining = target === primary ? secondary : primary;
    V.vaginatarget = remaining;
    V.vaginadoubletarget = undefined;
    V.vaginause = 'penis';
    V.vaginastate = String(V.vaginastate).replace('double', '') || 'entrance';
    const remainingNpc = this.npc(remaining);
    if (remainingNpc) remainingNpc.penis = String(remainingNpc.penis).replace('double', '');
  }

  private releaseAnalPenis(target: number): void {
    if (V.anususe === 'penis' && Number(V.anustarget) === target) {
      this.clear('anus');
      return;
    }
    if (V.anususe !== 'penisdouble') return;
    const primary = Number(V.anustarget);
    const secondary = Number(V.anusdoubletarget);
    if (target !== primary && target !== secondary) return;
    const remaining = target === primary ? secondary : primary;
    V.anustarget = remaining;
    V.anusdoubletarget = undefined;
    V.anususe = 'penis';
    V.anusstate = String(V.anusstate).replace('double', '') || 'entrance';
    const remainingNpc = this.npc(remaining);
    if (remainingNpc) remainingNpc.penis = String(remainingNpc.penis).replace('double', '');
  }

  private clear(part: 'mouth' | 'vagina' | 'penis' | 'anus' | 'chest' | 'thigh' | 'bottom'): void {
    const state = V as unknown as Record<string, unknown>;
    state[`${part}use`] = 0;
    state[`${part}state`] = 0;
    state[`${part}actiondefault`] = 'rest';
  }

  public get ready(): boolean {
    return (
      V.promiscuity >= this.vanillaPlus.normalCeiling('promiscuity') && V.exhibitionism >= this.vanillaPlus.normalCeiling('exhibitionism') && V.deviancy >= this.vanillaPlus.normalCeiling('deviancy')
    );
  }

  public get unlock(): boolean {
    return !V.VanillaPlus.lock.promiscuity && this.ready;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.promiscuity && V.promiscuity >= this.vanillaPlus.ceiling('promiscuity');
  }
}

export default Promiscuity;
