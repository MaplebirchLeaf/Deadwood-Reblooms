// ./src/module/DynamicMusic.ts
import Effects from './DynamicMusic/Effects';
import { parseDMConfig, type DynamicMusicConfig, type DynamicMusicTrack, type MusicState } from './DynamicMusic/Config';
export { parseDMConfig } from './DynamicMusic/Config';

type AudioLayer = 'music' | 'place' | 'weather' | 'voice';
const AUDIO_PACK = 'deadwood-reblooms-audio';

function voice(): string {
  if (Number(V.combat) !== 1) return '';
  if (Number(V.orgasmdown) >= 1) return 'climax';
  const max = Number(V.arousalmax) || 1;
  const ratio = (Number(V.arousal) || 0) / max;
  const speed = ratio >= 0.75 ? 'vfast' : ratio >= 0.5 ? 'fast' : ratio >= 0.25 ? 'mid' : 'slow';
  return ratio >= 0.15 ? `moans-${speed}` : `panting-${speed === 'vfast' ? 'fast' : speed}`;
}
const FADE_MS = 1500;

interface AudioChannels {
  setModVolume(modName: string, volume: number): void;
  ambience: {
    play(modName: string, path: string, volume?: number, fadeMs?: number, layer?: string): Promise<boolean>;
    setVolume(volume: number, fadeMs?: number, layer?: string): void;
    stop(fadeMs?: number, layer?: string): void;
  };
  effects: {
    play(modName: string, path: string, options?: { volume?: number; channel?: string; cooldownMs?: number }): Promise<boolean>;
    stop(modName?: string, channel?: string): void;
  };
}

class DynamicMusic {
  static readonly options = {
    enabled: false,
    musicEnabled: true,
    ambienceEnabled: true,
    effectsEnabled: true,
    voiceEnabled: true,
    volume: 0.5,
    ambienceVolume: 0.25,
    effectsVolume: 0.35,
    voiceVolume: 0.35
  };

  private config: DynamicMusicConfig | null = null;
  private loading: Promise<void> | null = null;
  private failed = false;
  private readonly desired: Record<AudioLayer, DynamicMusicTrack | null> = { music: null, place: null, weather: null, voice: null };
  private readonly syncing = new Set<AudioLayer>();
  private readonly ambient = new Map<AudioLayer, DynamicMusicTrack>();
  private readonly variants = new Map<string, number>();
  private readonly effects: Effects;

  public constructor(private readonly core: typeof maplebirch) {
    this.effects = new Effects(
      core,
      () => this.options?.enabled === true && this.options.effectsEnabled !== false && this.installed && this.config !== null,
      event => this.effect(event)
    );
  }

  private get options() {
    return typeof V === 'undefined' ? undefined : V.options?.maplebirch?.DynamicMusic;
  }

  private get audio() {
    return this.core.audio as typeof this.core.audio & AudioChannels;
  }

  public get installed(): boolean {
    return this.core.host.modLoader.modLoader?.getModZip(AUDIO_PACK) != null;
  }

  private get state(): MusicState {
    const passage = this.core.passage.title;
    const heist = V.StreetLife?.heist?.stage;
    const action =
      passage.startsWith('Deadwood Street Heist') && ['entry', 'challenge', 'vault', 'escape'].includes(heist ?? '')
        ? heist === 'escape'
          ? 'pursuit'
          : 'heist'
        : passage.startsWith('Deadwood Street Bounty') && V.StreetLife?.bounties?.active?.stage === 'pursuit'
          ? 'pursuit'
          : 'none';
    const state: MusicState = {
      combat: Number(V.combat) || 0,
      consensual: V.consensual === 1,
      scene: 'unknown',
      action,
      location: String(V.location ?? '').toLowerCase(),
      passage,
      bus: String(V.bus ?? ''),
      outside: V.outside === 1,
      lightning: Weather.enableLightning === true,
      solarEclipse: Weather.solarEclipse === true,
      bloodMoon: Weather.bloodMoon === true,
      meteorShower: Weather.meteorShower === true,
      weather: Weather.current.name,
      precipitation: Weather.precipitation,
      dayState: Time.dayState,
      season: Time.season,
      rainproof: V.worn?.head?.type?.includes('rainproof') === true || V.worn?.handheld?.type?.includes('rainproof') === true,
      gender: String(V.player?.gender_appearance ?? 'f'),
      voice: voice()
    };
    state.scene = this.config?.scenes.find(rule => rule.when(state))?.scene ?? 'unknown';
    return state;
  }

  private async loadConfig(): Promise<void> {
    try {
      const pack = this.core.host.modLoader.modLoader?.getModZip(AUDIO_PACK);
      const file = pack?.zip.file('dynamic-music.json');
      if (!file || !pack) throw new Error('Audio pack has no dynamic-music.json');
      const config = parseDMConfig(JSON.parse(await file.async('string')), path => pack.zip.file(path) != null);
      const playlist = await this.audio.getPlaylist(AUDIO_PACK);
      for (const track of config.music) {
        const item = playlist.tracks.find(item => item.audioName === track.file.slice(6).replace(/\.[^.]+$/, ''));
        if (item) {
          if (track.title) item.title = track.title;
          if (track.artist) item.artist = track.artist;
        }
      }
      this.config = config;
    } catch (error) {
      this.failed = true;
      this.audio.log('Dynamic music config could not be loaded', 'WARN', error);
    } finally {
      this.loading = null;
    }
    if (this.config) this.refresh();
  }

  private async sync(layer: AudioLayer): Promise<void> {
    if (this.syncing.has(layer)) return;
    this.syncing.add(layer);
    try {
      let desired: DynamicMusicTrack | null;
      // 各层分别收敛。同曲刷新复用请求，关闭后不会启动晚到的音轨。
      do {
        desired = this.desired[layer];
        try {
          if (layer === 'music') {
            const name = desired?.file.slice(6).replace(/\.[^.]+$/, '');
            if (!name) {
              if (this.audio.CurrentTrack?.modName === AUDIO_PACK) this.audio.stop();
            } else if (this.audio.CurrentTrack?.modName !== AUDIO_PACK || this.audio.CurrentTrack.audioName !== name) {
              if (await this.audio.playFromMod(AUDIO_PACK, name)) this.audio.PlayMode = 'loop_one';
            }
          } else if (desired === null) {
            this.audio.ambience.stop(FADE_MS, `${AUDIO_PACK}:${layer}`);
            this.ambient.delete(layer);
          } else {
            const mix = layer === 'voice' ? (this.options?.voiceVolume ?? DynamicMusic.options.voiceVolume) : (this.options?.ambienceVolume ?? DynamicMusic.options.ambienceVolume);
            const volume = mix * desired.volume;
            if (await this.audio.ambience.play(AUDIO_PACK, desired.file, volume, FADE_MS, `${AUDIO_PACK}:${layer}`)) {
              this.ambient.set(layer, desired);
              const currentVolume =
                (layer === 'voice' ? (this.options?.voiceVolume ?? DynamicMusic.options.voiceVolume) : (this.options?.ambienceVolume ?? DynamicMusic.options.ambienceVolume)) * desired.volume;
              if (currentVolume !== volume) this.audio.ambience.setVolume(currentVolume, 100, `${AUDIO_PACK}:${layer}`);
            }
          }
        } catch (error) {
          this.audio.log(`Dynamic ${layer} could not be played (${desired?.file}): ${String(error)}`, 'WARN', error);
        }
      } while (this.desired[layer] !== desired);
    } finally {
      this.syncing.delete(layer);
    }
  }

  private effect(event: string): void {
    const options = this.options;
    if (!options?.enabled || options.effectsEnabled === false || !this.config || !this.installed) return;
    const state = this.state;
    const rule = this.config.effects.find(rule => rule.event === event && rule.when(state));
    if (!rule) return;
    const index = this.variants.get(event) ?? 0;
    this.variants.set(event, (index + 1) % rule.files.length);
    const file = rule.files[index % rule.files.length];
    void this.audio.effects
      .play(AUDIO_PACK, file, { volume: (options.effectsVolume ?? DynamicMusic.options.effectsVolume) * rule.volume, channel: 'action', cooldownMs: rule.cooldown })
      .catch(error => this.audio.log(`Dynamic effect could not be played (${event}, ${file})`, 'WARN', error));
  }

  public refresh(): void {
    const options = this.options;
    const enabled = options?.enabled === true && this.installed;
    if (enabled && !this.config) {
      if (!this.failed) this.loading ??= this.loadConfig();
      return;
    }
    const state = enabled ? this.state : null;
    this.desired.music = state && options?.musicEnabled !== false ? (this.config?.music.find(track => track.when(state)) ?? null) : null;
    for (const layer of ['place', 'weather', 'voice'] as const) {
      const audible = layer === 'voice' ? options?.voiceEnabled !== false : options?.ambienceEnabled !== false;
      this.desired[layer] = state && audible ? (this.config?.ambience.find(track => track.layer === layer && track.when(state)) ?? null) : null;
      if (!this.desired[layer] && this.syncing.has(layer)) this.audio.ambience.stop(FADE_MS, `${AUDIO_PACK}:${layer}`);
      void this.sync(layer);
    }
    if (options) this.audio.setModVolume(AUDIO_PACK, options.volume);
    if (this.desired.music === null && this.syncing.has('music') && this.audio.ActivePlaylist?.name === AUDIO_PACK) this.audio.stop();
    if (!enabled || options?.effectsEnabled === false) this.audio.effects.stop(AUDIO_PACK);
    void this.sync('music');
  }

  public setVolume(value: number): void {
    const options = this.options;
    if (!options) return;
    options.volume = Math.clamp(Number(value) || 0, 0, 1);
    this.audio.setModVolume(AUDIO_PACK, options.volume);
  }

  public setAmbienceVolume(value: number): void {
    const options = this.options;
    if (!options) return;
    options.ambienceVolume = Math.clamp(Number(value) || 0, 0, 1);
    for (const [layer, track] of this.ambient) {
      if (layer === 'voice') continue;
      this.audio.ambience.setVolume(options.ambienceVolume * track.volume, 100, `${AUDIO_PACK}:${layer}`);
    }
  }

  public setVoiceVolume(value: number): void {
    const options = this.options;
    if (!options) return;
    options.voiceVolume = Math.clamp(Number(value) || 0, 0, 1);
    const track = this.ambient.get('voice');
    if (track) this.audio.ambience.setVolume(options.voiceVolume * track.volume, 100, `${AUDIO_PACK}:voice`);
  }

  public setEffectsVolume(value: number): void {
    const options = this.options;
    if (!options) return;
    options.effectsVolume = Math.clamp(Number(value) || 0, 0, 1);
    if (!options.effectsVolume) this.audio.effects.stop(AUDIO_PACK);
  }

  public preInit(): void {
    this.core.var.options.define('DynamicMusic', DynamicMusic.options);
    this.effects.install();
    this.core.tool.onInit(() => {
      setup.maplebirch.content.push('<<deadwood-dynamic-music-player>>');
      if (this.installed) this.loading ??= this.loadConfig();
    });
    this.core.on(':passageinit', () => this.audio.effects.stop(AUDIO_PACK), 'DynamicMusic effects navigation');
    this.core.on(':onLoad', () => this.audio.effects.stop(AUDIO_PACK), 'DynamicMusic audio load');
    this.core.on(':passagedisplay', () => this.refresh(), 'DynamicMusic');
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly DynamicMusic: DynamicMusic;
  }
}

export default DynamicMusic;
