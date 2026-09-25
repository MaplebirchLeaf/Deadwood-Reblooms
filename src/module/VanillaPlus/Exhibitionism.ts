// ./src/module/VanillaPlus/Exhibitionism.ts

class Exhibitionism {
  public get unlock(): boolean {
    const exhibitionism = V.VanillaPlus.exhibitionism;
    return !V.VanillaPlus.lock.exhibitionism && V.exhibitionism >= window.maplebirch.VP.normalCeiling('exhibitionism') && exhibitionism.swimming && exhibitionism.ballroom && exhibitionism.highStreet;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.exhibitionism && V.exhibitionism >= window.maplebirch.VP.ceiling('exhibitionism');
  }

  public developer(): void {
    V.VanillaPlus.lock.exhibitionism = false;
    Object.assign(V.VanillaPlus.exhibitionism, {
      swimming: true,
      ballroom: true,
      highStreet: true
    });
    V.exhibitionism = window.maplebirch.VP.normalCeiling('exhibitionism');
  }
}

export default Exhibitionism;
