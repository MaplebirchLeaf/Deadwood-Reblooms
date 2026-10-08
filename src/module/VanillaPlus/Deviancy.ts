// ./src/module/VanillaPlus/Deviancy.ts

import type VanillaPlus from '../VanillaPlus';

type MirrorId = 'home' | 'farm' | 'tower' | 'temple' | 'sirris' | 'kylar';
type MirrorDiscovery = Record<MirrorId, boolean> & { property: Record<string, boolean> };

class Deviancy {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  private get mirrors(): MirrorDiscovery {
    const mirrors = (V.VanillaPlus.deviancy.mirrors ??= { home: false, property: {}, farm: false, tower: false, temple: false, sirris: false, kylar: false });
    if (typeof mirrors.property !== 'object' || mirrors.property === null) mirrors.property = {};
    return mirrors;
  }

  public discover(mirror: MirrorId | 'property', propertyId?: string): void {
    if (mirror === 'property') {
      if (propertyId) this.mirrors.property[propertyId] = true;
    } else this.mirrors[mirror] = true;
  }

  public discovered(mirror: MirrorId | 'property', propertyId?: string): boolean {
    return V.VanillaPlus.traits.deviancy && (mirror === 'property' ? Boolean(propertyId && this.mirrors.property[propertyId]) : this.mirrors[mirror] === true);
  }

  public enter(): void {
    // 在点击入口时重排出口，而不是在入口 Passage 渲染时重排，以免读档后坐标移动。
    const locations: typeof V.VanillaPlus.deviancy.mirror_locations = {};
    V.VanillaPlus.deviancy.mirror_locations = locations;
    const randomLocation = () => ({ north: Math.floor(Math.random() * 9) - 4, east: Math.floor(Math.random() * 9) - 4 });
    for (const mirror of ['home', 'farm', 'tower', 'temple', 'sirris', 'kylar']) locations[mirror] = randomLocation();
    for (const property of this.vanillaPlus.core.get('Finance')?.realEstate.properties ?? []) locations[`property:${property.id}`] = randomLocation();
  }

  public get mirrorOpen(): boolean {
    return V.VanillaPlus.traits.deviancy && Time.hour === 3 && V.settings.tentaclesEnabled && (V.hallucinations >= 2 || V.daily?.mirrorTentacles === 1);
  }

  public get canConduct(): boolean {
    return (
      !V.VanillaPlus.lock.deviancy &&
      !V.VanillaPlus.deviancy.conducted &&
      V.deviancy >= this.vanillaPlus.normalCeiling('deviancy') &&
      V.VanillaPlus.deviancy.wildsong &&
      V.gwylan.purged >= 20 &&
      V.dateCount.GwylanSex >= 3 &&
      V.dateCount.GwylanBeast >= 3
    );
  }

  public finish(ritual: { purge?: number; sealed?: boolean } | undefined): void {
    if (!V.VanillaPlus.deviancy.conducting) return;
    V.VanillaPlus.deviancy.conducting = false;
    if (ritual?.sealed && (ritual.purge ?? 0) >= 9) V.VanillaPlus.deviancy.conducted = true;
  }

  public get unlock(): boolean {
    return !V.VanillaPlus.lock.deviancy && V.deviancy >= this.vanillaPlus.normalCeiling('deviancy') && V.VanillaPlus.deviancy.wildsong && V.VanillaPlus.deviancy.conducted;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.deviancy && V.deviancy >= this.vanillaPlus.ceiling('deviancy');
  }

  public preInit(): void {
    const mirrors: Record<string, 'home' | 'farm' | 'tower' | 'temple'> = {
      Mirror: 'home',
      'Eerie Mirror': 'home',
      'Farm Mirror': 'farm',
      'Bird Tower Mirror': 'tower',
      'Temple Mirror': 'temple'
    };

    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'deviancy-unlock', {
      output: 'deadwood-reblooms-deviancy-unlock',
      cond: () => V.VanillaPlus != null && this.unlock
    });

    // 到达镜面页就记录发现，无文本输出、不截断页面，也不依赖各页 effects 的写法。
    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'deviancy-mirror-discovery', {
      forceExit: false,
      extra: { passage: Object.keys(mirrors) },
      cond: () => V.VanillaPlus != null,
      action: () => this.discover(mirrors[this.vanillaPlus.core.host.sugarcube.passage.title])
    });

    // 原版镜子入口没有模组来源，清除其它离开方式留下的记录。
    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'deviancy-mirror-native-entry', {
      extra: { passage: ['Eerie Mirror Tentacle Plains'] },
      cond: () => V.VanillaPlus != null,
      action: () => {
        V.VanillaPlus.deviancy.mirror = '';
      }
    });

    for (const [passage, arrival] of [
      ['Passout Tentacle World 4', 'passout'],
      ['Tentacle Home Return', 'return']
    ] as const) {
      this.vanillaPlus.core.dynamic.regStateEvent('gate', `deviancy-mirror-${arrival}`, {
        output: `deadwood-reblooms-deviancy-mirror-return "${arrival}"`,
        forceExit: true,
        extra: { passage: [passage] },
        cond: () => V.tentacleEntrance === 'mirror' && Boolean(V.VanillaPlus?.deviancy.mirror)
      });
    }
  }
}

export default Deviancy;
