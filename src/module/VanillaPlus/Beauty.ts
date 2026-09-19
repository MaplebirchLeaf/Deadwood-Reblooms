// ./src/module/VanillaPlus/Beauty.ts

class Beauty {
  private get unadorned(): boolean {
    const makeup = V.makeup ?? {};
    return !makeup.lipstick && !makeup.eyeshadow && !makeup.mascara && !makeup.blusher && !makeup.browscolour && !makeup.concealer && !makeup.eyelenses?.left && !makeup.eyelenses?.right;
  }

  public get alluring(): boolean {
    return V.baseAllure >= 7000 && V.outside === 1 && !Time.isBloodMoon();
  }

  public rememberAllure(): void {
    if (this.alluring) V.VanillaPlus.beauty.alluring = true;
  }

  public get unlock(): boolean {
    return !V.VanillaPlus.lock.beauty && V.beauty >= V.beautymax && V.VanillaPlus.beauty.alluring && V.fame.model >= 1000 && this.unadorned && !V.worn.face.type.includes('mask');
  }

  public complete(): void {
    if (this.unlock) V.VanillaPlus.lock.beauty = true;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.beauty && V.beauty >= Math.floor(V.beautymax * 1.25);
  }

  public get floor(): number {
    if (V.VanillaPlus.traits.incorrigible) return Math.floor(V.beautymax * 1.25);
    return V.VanillaPlus.traits.beauty ? V.beautymax : 0;
  }

  public developer(): void {
    V.VanillaPlus.lock.beauty = false;
    V.VanillaPlus.beauty.alluring = true;
    V.beauty = V.beautymax;
    V.fame.model = Math.max(V.fame.model, 1000);
    V.makeup ??= {};
    Object.assign(V.makeup, {
      lipstick: 0,
      eyeshadow: 0,
      mascara: 0,
      blusher: 0,
      browscolour: 0,
      concealer: 0,
      eyelenses: { left: 0, right: 0 }
    });
  }
}

export default Beauty;
