// ./src/module/VanillaPlus/Promiscuity.ts

type BodyActions = Partial<Record<'hands' | 'feet' | 'mouth' | 'penis' | 'vagina' | 'anus' | 'chest' | 'thigh', unknown>>;

class Promiscuity {
  private readonly bodyParts: Array<keyof BodyActions> = ['hands', 'feet', 'mouth', 'penis', 'vagina', 'anus', 'chest', 'thigh'];

  private isVoluntary(action: unknown): boolean {
    if (Array.isArray(action)) return action.some(value => this.isVoluntary(value));
    if (typeof action !== 'string' || !action || action === '0') return false;
    return !/(?:rest|pull|resist|escape|bite|headbutt|hit|kick|slap|punch|protect|cover|struggle|stop|stifle|ask|speak|noises|letout)/i.test(action);
  }

  public record(actions: BodyActions): boolean {
    const progress = V.VanillaPlus.promiscuity;
    let recorded = false;
    for (const [part, action] of Object.entries(actions)) {
      if (!this.isVoluntary(action)) continue;
      progress[part as keyof BodyActions] = true;
      recorded = true;
    }
    return recorded;
  }

  public get ready(): boolean {
    const progress = V.VanillaPlus.promiscuity;
    const genitals = (!V.player.penisExist || progress.penis) && (!V.player.vaginaExist || progress.vagina);
    return V.promiscuity >= 100 && V.exhibitionism >= 100 && V.deviancy >= 100 && progress.hands && progress.feet && progress.mouth && progress.anus && progress.chest && progress.thigh && genitals;
  }

  public get unlock(): boolean {
    return !V.VanillaPlus.lock.promiscuity && this.ready;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.promiscuity && V.promiscuity >= 150;
  }

  public developer(): void {
    V.VanillaPlus.lock.promiscuity = false;
    for (const part of this.bodyParts) V.VanillaPlus.promiscuity[part] = true;
    V.promiscuity = 100;
    V.exhibitionism = Math.max(V.exhibitionism, 100);
    V.deviancy = Math.max(V.deviancy, 100);
  }
}

export default Promiscuity;
