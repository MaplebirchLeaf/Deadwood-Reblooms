// ./src/module/Orchard/Remy.ts

import type Orchard from '../Orchard';

class Remy {
  public static readonly defaults = { visits: 0, dates: 0, romance: false, last_talk_day: -1, last_gift_day: -1, last_date_day: -1 };

  public constructor(private readonly orchard: Orchard) {}

  public preInit(): void {
    this.orchard.core.npc.add({ nam: 'Remy' }, { important: true, loveInterest: true, romance: [() => V.Orchard?.remy?.romance === true] });
  }

  public get state(): typeof Remy.defaults {
    return this.orchard.state.remy;
  }

  private get ready(): boolean {
    return !!V.Orchard?.remy && C.npc.Remy?.init === 1 && !V.statFreeze && !V.replayScene && V.combat !== 1 && V.stress < V.stressmax;
  }

  public get available(): boolean {
    return this.ready && V.location === 'riding_school' && V.remySeen?.includes('riding_school') && Time.dayState !== 'night' && Time.hour !== V.closinghour && V.exposed <= 0 && !V.gag;
  }

  public get captive(): boolean {
    return this.ready && this.orchard.core.passage.title === 'Livestock Cell Remy' && !!V.livestock && !V.gag;
  }

  public get farmConflict(): boolean {
    return V.farm_stage >= 7 && !!V.remySeen?.includes('farm');
  }

  public get canTalk(): boolean {
    return (this.available || this.captive) && this.state.last_talk_day !== Time.days;
  }

  public get canGift(): boolean {
    return this.available && !window.pcAreArmsBound('both') && this.state.last_gift_day !== Time.days && (V.foodstuff.apple?.amount ?? 0) > (this.orchard.state.reserve.apple ?? 0);
  }

  public get canDate(): boolean {
    return this.available && !window.pcAreArmsBound('both') && this.state.visits >= 3 && C.npc.Remy.love >= 20 && this.state.last_date_day !== Time.days && Time.hour + 1 < V.closinghour;
  }

  public get canCourt(): boolean {
    return this.available && !window.pcAreArmsBound('both') && !this.state.romance && this.state.visits >= 5 && this.state.dates >= 2 && C.npc.Remy.love >= 30;
  }

  public act(action: 'talk' | 'confront' | 'gift' | 'date' | 'romance' | 'break'): boolean {
    const passage = this.orchard.core.passage.title;
    if (action === 'break') {
      if ((!this.available || passage !== 'Deadwood Remy Conversation') && !this.captive) return false;
      if (!this.state.romance) return false;
      this.orchard.core.SugarCube.Wikifier.wikifyEval('<<loveInterestRemove "Remy">>');
      this.state.romance = false;
      return true;
    }
    if (!this.available) return false;
    if (action === 'talk' || action === 'confront') {
      if (!['Deadwood Remy Talk', 'Deadwood Remy Business'].includes(passage) || !this.canTalk) return false;
      this.state.last_talk_day = Time.days;
      if (action === 'talk') this.state.visits++;
    } else if (action === 'gift') {
      if (passage !== 'Deadwood Remy Gift' || !this.canGift) return false;
      this.state.last_gift_day = Time.days;
      V.foodstuff.apple.amount--;
    } else if (action === 'date') {
      if (passage !== 'Deadwood Remy Date' || !this.canDate) return false;
      this.state.last_date_day = Time.days;
      this.state.dates++;
    } else if (action === 'romance') {
      if (passage !== 'Deadwood Remy Promise' || !this.canCourt) return false;
      this.state.romance = true;
      return true;
    } else return false;
    return true;
  }
}

export default Remy;
