// ./src/module/DynamicMusic.ts

interface MusicState {
  combat: number;
  consensual: boolean;
  scene: string;
  action: string;
  location: string;
  passage: string;
  bus: string;
  outside: boolean;
  lightning: boolean;
  solarEclipse: boolean;
  bloodMoon: boolean;
  meteorShower: boolean;
  weather: string;
  precipitation: string;
  dayState: string;
  season: string;
}

interface DynamicMusicTrack {
  track: string;
  file: string;
  title?: string;
  artist?: string;
  priority: number;
  when: (state: MusicState) => boolean;
}

interface MusicScene {
  scene: string;
  when: (state: MusicState) => boolean;
}

interface DynamicMusicConfig {
  scenes: MusicScene[];
  music: DynamicMusicTrack[];
  ambience: DynamicMusicTrack[];
}

const stateTypes: Record<keyof MusicState, string> = {
  combat: 'number',
  consensual: 'boolean',
  scene: 'string',
  action: 'string',
  location: 'string',
  passage: 'string',
  bus: 'string',
  outside: 'boolean',
  lightning: 'boolean',
  solarEclipse: 'boolean',
  bloodMoon: 'boolean',
  meteorShower: 'boolean',
  weather: 'string',
  precipitation: 'string',
  dayState: 'string',
  season: 'string'
};

const audioPath = /^audio\/(?!.*(?:^|\/)\.\.\/)[\w/-]+\.(?:ogg|mp3|wav|m4a|flac|webm)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseDMConfig(value: unknown, hasFile: (file: string) => boolean): DynamicMusicConfig {
  if (!isRecord(value) || value.version !== 2 || !Array.isArray(value.scenes) || !Array.isArray(value.music) || !Array.isArray(value.ambience)) {
    throw new Error('Invalid dynamic music config header');
  }

  const parseCondition = (raw: unknown, name: string, sceneRule = false): MusicScene['when'] => {
    if (!isRecord(raw)) throw new Error('Invalid condition for ' + name);
    const conditions = Object.entries(raw).map(([key, expected]) => {
      if (!Object.hasOwn(stateTypes, key) || (sceneRule && key === 'scene')) throw new Error('Unknown music state ' + key);
      const type = stateTypes[key as keyof MusicState];
      const values = Array.isArray(expected) ? expected : [expected];
      if (!values.length || !values.every(item => typeof item === type && (typeof item !== 'number' || Number.isFinite(item)))) {
        throw new Error('Invalid condition for ' + name);
      }
      return { key: key as keyof MusicState, values };
    });
    // 字符串末尾的 * 只表示前缀匹配，配置不能执行代码或注入正则。
    return state =>
      conditions.every(({ key, values }) =>
        values.some(expected => (typeof expected === 'string' && expected.endsWith('*') ? String(state[key]).startsWith(expected.slice(0, -1)) : state[key] === expected))
      );
  };

  const parseLayer = (layer: unknown[], name: string): DynamicMusicTrack[] => {
    const names = new Set<string>();
    return layer
      .map((raw, index) => {
        if (!isRecord(raw) || typeof raw.track !== 'string' || !/^[\w-]+$/.test(raw.track) || names.has(raw.track)) {
          throw new Error('Invalid ' + name + ' track at index ' + index);
        }
        if (typeof raw.file !== 'string' || !audioPath.test(raw.file) || !hasFile(raw.file)) throw new Error('Missing or invalid audio file for ' + raw.track);
        if (typeof raw.priority !== 'number' || !Number.isFinite(raw.priority)) throw new Error('Invalid priority for ' + raw.track);
        if (raw.title !== undefined && typeof raw.title !== 'string') throw new Error('Invalid title for ' + raw.track);
        if (raw.artist !== undefined && typeof raw.artist !== 'string') throw new Error('Invalid artist for ' + raw.track);
        names.add(raw.track);
        return {
          track: raw.track,
          file: raw.file,
          title: raw.title as string | undefined,
          artist: raw.artist as string | undefined,
          priority: raw.priority,
          when: parseCondition(raw.when, raw.track)
        };
      })
      .sort((left, right) => right.priority - left.priority);
  };

  const scenes = value.scenes.map((raw, index) => {
    if (!isRecord(raw) || typeof raw.scene !== 'string' || !/^[\w-]+$/.test(raw.scene)) throw new Error('Invalid scene at index ' + index);
    return { scene: raw.scene, when: parseCondition(raw.when, raw.scene, true) };
  });
  return { scenes, music: parseLayer(value.music, 'music'), ambience: parseLayer(value.ambience, 'ambience') };
}

type AudioLayer = 'music' | 'ambience';
const AUDIO_PACK = 'deadwood-reblooms-audio';
const FADE_MS = 1500;

class DynamicMusic {
  static readonly options = { enabled: false, musicEnabled: true, ambienceEnabled: true, volume: 0.5, ambienceVolume: 0.25 };

  private config: DynamicMusicConfig | null = null;
  private loading: Promise<void> | null = null;
  private failed = false;
  private readonly desired: Record<AudioLayer, string | null> = { music: null, ambience: null };
  private readonly syncing = new Set<AudioLayer>();
  private ambient: string | null = null;

  public constructor(private readonly core: typeof maplebirch) {}

  private get options() {
    return V.options?.maplebirch?.DynamicMusic;
  }

  // 分轨倍率由框架管理，声明包尚未发布此接口，边界仅补充这项公开契约。
  private get audio() {
    return this.core.audio as typeof this.core.audio & { setModVolume(modName: string, volume: number): void };
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
      season: Time.season
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
      let desired: string | null;
      // 两层分别串行收敛。同曲刷新复用正在加载的请求，关闭时也不会启动晚到的音轨。
      do {
        desired = this.desired[layer];
        try {
          if (layer === 'music') {
            if (desired === null) {
              if (this.audio.CurrentTrack?.modName === AUDIO_PACK) this.audio.stop();
            } else if (this.audio.CurrentTrack?.modName !== AUDIO_PACK || this.audio.CurrentTrack.audioName !== desired) {
              if (await this.audio.playFromMod(AUDIO_PACK, desired)) this.audio.PlayMode = 'loop_one';
            }
          } else if (desired === null) {
            if (this.ambient !== null) this.audio.ambience.stop(FADE_MS);
            this.ambient = null;
          } else {
            const volume = this.options?.ambienceVolume ?? DynamicMusic.options.ambienceVolume;
            if (await this.audio.ambience.play(AUDIO_PACK, desired, volume, FADE_MS)) {
              this.ambient = desired;
              const currentVolume = this.options?.ambienceVolume ?? DynamicMusic.options.ambienceVolume;
              if (currentVolume !== volume) this.audio.ambience.setVolume(currentVolume);
            }
          }
        } catch (error) {
          this.audio.log(`Dynamic ${layer} could not be played (${desired}): ${String(error)}`, 'WARN', error);
        }
      } while (this.desired[layer] !== desired);
    } finally {
      this.syncing.delete(layer);
    }
  }

  public refresh(): void {
    const options = this.options;
    const enabled = options?.enabled === true && this.installed;
    if (enabled && !this.config) {
      if (!this.failed) this.loading ??= this.loadConfig();
      return;
    }
    const state = enabled ? this.state : null;
    const music = state && options?.musicEnabled !== false ? this.config?.music.find(track => track.when(state)) : null;
    const ambience = state && options?.ambienceEnabled !== false ? this.config?.ambience.find(track => track.when(state)) : null;
    this.desired.music = music?.file.slice(6).replace(/\.[^.]+$/, '') ?? null;
    this.desired.ambience = ambience?.file ?? null;
    if (options) this.audio.setModVolume(AUDIO_PACK, options.volume);
    if (this.desired.music === null && this.syncing.has('music') && this.audio.ActivePlaylist?.name === AUDIO_PACK) this.audio.stop();
    if (this.desired.ambience === null && this.syncing.has('ambience')) this.audio.ambience.stop(FADE_MS);
    void this.sync('music');
    void this.sync('ambience');
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
    if (this.ambient !== null) this.audio.ambience.setVolume(options.ambienceVolume);
  }

  public preInit(): void {
    this.core.var.options.define('DynamicMusic', DynamicMusic.options);
    this.core.tool.onInit(() => {
      setup.maplebirch.content.push('<<deadwood-dynamic-music-player>>');
      if (this.installed) this.loading ??= this.loadConfig();
    });
    this.core.on(':passagedisplay', () => this.refresh(), 'DynamicMusic');
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly DynamicMusic: DynamicMusic;
  }
}

export default DynamicMusic;
