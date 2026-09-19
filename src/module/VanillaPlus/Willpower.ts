// ./src/module/VanillaPlus/Willpower.ts

class Willpower {
  public get unlock(): boolean {
    const parasites = V.parasite ?? {};
    const earSlimes = Number(parasites.left_ear?.name === 'slime') + Number(parasites.right_ear?.name === 'slime');

    return (
      !V.VanillaPlus.lock.willpower &&
      V.willpower >= V.willpowermax &&
      earSlimes >= 2 &&
      V.VanillaPlus.willpower.kylar &&
      V.VanillaPlus.willpower.wraith &&
      V.VanillaPlus.willpower.schism &&
      V.VanillaPlus.willpower.vigil &&
      V.temple_confessor_intro === true &&
      V.torturesurvivor >= 1 &&
      V.wraithPrison?.state === 'recovering' &&
      V.wraithPrison?.search === 4
    );
  }

  public get max(): boolean {
    return V.VanillaPlus?.lock?.willpower && V.willpower >= Math.floor(V.willpowermax * 1.25);
  }

  public earSlimeResistance(value: number): number {
    return V.VanillaPlus.traits.willpower ? Infinity : value;
  }

  public developer(): void {
    V.VanillaPlus.lock.willpower = false;
    Object.assign(V.VanillaPlus.willpower, {
      kylar: true,
      wraith: true,
      schism: true,
      vigil: true
    });
    V.willpower = V.willpowermax;
    V.temple_confessor_intro = true;
    V.torturesurvivor = 1;
    V.parasite ??= {};
    V.parasite.left_ear = { ...V.parasite.left_ear, name: 'slime' };
    V.parasite.right_ear = { ...V.parasite.right_ear, name: 'slime' };
    V.wraithPrison ??= {};
    V.wraithPrison.state = 'recovering';
    V.wraithPrison.timer = 120;
    V.wraithPrison.search = 4;
  }
}

export default Willpower;
