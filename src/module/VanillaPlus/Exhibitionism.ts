// ./src/module/VanillaPlus/Exhibitionism.ts

import type VanillaPlus from '../VanillaPlus';

class Exhibitionism {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  public get comfortable(): boolean {
    if (!V.VanillaPlus || !V.VanillaPlus.traits.exhibitionism || V.exposedRaw < 1) return false;
    return V.exposedRaw >= 2 ? V.uncomfortable.nude === false : V.uncomfortable.underwear === false;
  }

  public get canRoamTown(): boolean {
    return this.comfortable;
  }

  public get canRoamTemple(): boolean {
    const aid = this.vanillaPlus.core.get('Finance')?.donations.aid;
    return (
      this.comfortable &&
      ['initiate', 'monk', 'priest'].includes(V.temple_rank) &&
      aid?.has('temple') === true &&
      aid.state('temple').privacy === true &&
      V.stress < V.stressmax &&
      !V.combat &&
      !V.possessed &&
      !V.nextPassageCheck &&
      !V.replayScene &&
      !V.statFreeze &&
      !window.isPregnancyEnding()
    );
  }

  public get requirements(): boolean[] {
    return [V.exhibitionism >= this.vanillaPlus.normalCeiling('exhibitionism'), (V.swimnudecounter ?? 0) >= 5, V.feats?.currentSave?.['A Lewd Adventure'] != null];
  }

  public get unlock(): boolean {
    return !V.VanillaPlus.lock.exhibitionism && this.requirements.every(Boolean);
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.exhibitionism && V.exhibitionism >= this.vanillaPlus.ceiling('exhibitionism');
  }

  public preInit(): void {
    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'exhibitionism-unlock', {
      output: 'deadwood-reblooms-unlock "exhibitionism"',
      cond: () => V.VanillaPlus != null && this.unlock
    });
  }
}

export default Exhibitionism;
