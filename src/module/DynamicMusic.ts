interface MusicState {
  combat: unknown;
  solarEclipse: unknown;
  bloodMoon: unknown;
  meteorShower: unknown;
  weather: unknown;
  precipitation: unknown;
  dayState: unknown;
}

interface DynamicMusicTrack {
  track: string;
  file?: string;
  priority: number;
  when: (state: MusicState) => boolean;
}

interface DynamicMusicConfig {
  music: DynamicMusicTrack[];
  ambience: DynamicMusicTrack[];
}

const stateTypes: Record<keyof MusicState, string> = {
  combat: 'number',
  solarEclipse: 'boolean',
  bloodMoon: 'boolean',
  meteorShower: 'boolean',
  weather: 'string',
  precipitation: 'string',
  dayState: 'string'
};

const audioPath = /^audio\/(?!.*(?:^|\/)\.\.\/)[\w/-]+\.(?:ogg|mp3|wav|m4a|flac|webm)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseDynamicMusicConfig(value: unknown, hasFile: (file: string) => boolean): DynamicMusicConfig {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.music) || !Array.isArray(value.ambience)) {
    throw new Error('Invalid dynamic music config header');
  }

  const parseLayer = (layer: unknown[], name: string): DynamicMusicTrack[] => {
    const names = new Set<string>();
    return layer.map((raw, index) => {
      if (!isRecord(raw) || typeof raw.track !== 'string' || !/^[\w-]+$/.test(raw.track) || names.has(raw.track)) {
        throw new Error(`Invalid ${name} track at index ${index}`);
      }
      if (typeof raw.file !== 'string' || !audioPath.test(raw.file) || !hasFile(raw.file)) {
        throw new Error(`Missing or invalid audio file for ${raw.track}`);
      }
      if (typeof raw.priority !== 'number' || !Number.isFinite(raw.priority) || !isRecord(raw.when)) {
        throw new Error(`Invalid priority or condition for ${raw.track}`);
      }
      const conditions = Object.entries(raw.when).map(([key, expected]) => {
        if (!Object.prototype.hasOwnProperty.call(stateTypes, key)) throw new Error(`Unknown music state ${key}`);
        const type = stateTypes[key as keyof MusicState];
        const values = Array.isArray(expected) ? expected : [expected];
        if (!values.length || !values.every(item => typeof item === type && (typeof item !== 'number' || Number.isFinite(item)))) {
          throw new Error(`Invalid condition for ${raw.track}`);
        }
        return { key: key as keyof MusicState, values };
      });
      names.add(raw.track);
      return {
        track: raw.track,
        file: raw.file,
        priority: raw.priority,
        when: (state: MusicState) => conditions.every(({ key, values }) => values.includes(state[key] as string | number | boolean))
      };
    });
  };

  return { music: parseLayer(value.music, 'music'), ambience: parseLayer(value.ambience, 'ambience') };
}

type DynamicAudioLayer = 'music' | 'ambience';

const DYNAMIC_AUDIO_MOD_NAME = 'deadwood-reblooms-audio';
const AMBIENCE_FADE_SECONDS = 2;

const DEFAULT_DYNAMIC_MUSIC_OPTIONS = {
  enabled: false,
  volume: 0.5,
  ambienceVolume: 0.25
};

class DynamicMusicRegistry {
  private readonly tracks = new Map<string, DynamicMusicTrack>();

  public constructor(tracks: Iterable<DynamicMusicTrack> = []) {
    for (const track of tracks) this.register(track);
  }

  public register(track: DynamicMusicTrack): this {
    this.tracks.set(track.track, track);
    return this;
  }

  public unregister(track: string): boolean {
    return this.tracks.delete(track);
  }

  public has(track: string): boolean {
    return this.tracks.has(track);
  }

  public selectTrack(state: MusicState): DynamicMusicTrack | null {
    return [...this.tracks.values()].sort((left, right) => right.priority - left.priority).find(track => track.when(state)) ?? null;
  }

  public select(state: MusicState): string | null {
    return this.selectTrack(state)?.track ?? null;
  }
}

interface ActiveAmbience {
  track: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

class AmbientLoop {
  private readonly buffers = new Map<string, AudioBuffer>();
  private active: ActiveAmbience | null = null;
  private request = 0;

  public constructor(private readonly core: typeof maplebirch) {}

  private get context(): AudioContext | null {
    return (this.core.howler.Howler.ctx as AudioContext | undefined) ?? null;
  }

  private async load(track: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(track);
    if (cached) return cached;
    const file = this.core.modLoader?.getModZip(DYNAMIC_AUDIO_MOD_NAME)?.zip.file(track);
    const context = this.context;
    if (!file || !context) return null;
    const bytes = await file.async('uint8array');
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const buffer = await context.decodeAudioData(data);
    this.buffers.set(track, buffer);
    return buffer;
  }

  private fadeOut(active: ActiveAmbience): void {
    const context = this.context;
    if (!context) {
      active.source.stop();
      active.source.disconnect();
      active.gain.disconnect();
      return;
    }
    const now = context.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(active.gain.gain.value, now);
    active.gain.gain.linearRampToValueAtTime(0, now + AMBIENCE_FADE_SECONDS);
    setTimeout(
      () => {
        try {
          active.source.stop();
        } catch {}
        active.source.disconnect();
        active.gain.disconnect();
      },
      AMBIENCE_FADE_SECONDS * 1000 + 100
    );
  }

  public async play(track: string, volume: number): Promise<boolean> {
    if (this.active?.track === track) {
      this.request++;
      this.setVolume(volume);
      return true;
    }
    // 解码可能晚于下一次场景切换；序号让旧请求无法在新天气下启动旧环境音。
    const request = ++this.request;
    const buffer = await this.load(track);
    const context = this.context;
    if (request !== this.request || !buffer || !context) return false;

    void context.resume?.();
    const source = context.createBufferSource();
    const gain = context.createGain();
    const now = context.currentTime;
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(Math.clamp(volume, 0, 1), now + AMBIENCE_FADE_SECONDS);
    source.start();

    const previous = this.active;
    this.active = { track, source, gain };
    if (previous) this.fadeOut(previous);
    return true;
  }

  public setVolume(volume: number): void {
    const context = this.context;
    if (!this.active || !context) return;
    const now = context.currentTime;
    this.active.gain.gain.cancelScheduledValues(now);
    this.active.gain.gain.setValueAtTime(this.active.gain.gain.value, now);
    this.active.gain.gain.linearRampToValueAtTime(Math.clamp(volume, 0, 1), now + 0.1);
  }

  public stop(): void {
    this.request++;
    const active = this.active;
    this.active = null;
    if (active) this.fadeOut(active);
  }
}

class DynamicMusic {
  public readonly exposed = true;
  static readonly options = { ...DEFAULT_DYNAMIC_MUSIC_OPTIONS };

  private readonly tracks = new DynamicMusicRegistry();
  private readonly ambienceTracks = new DynamicMusicRegistry();
  private readonly ambience: AmbientLoop;
  private configReady = false;
  private configLoading: Promise<void> | null = null;
  private requested: string | null = null;
  private syncing = false;

  public constructor(private readonly core: typeof maplebirch) {
    this.ambience = new AmbientLoop(core);
  }

  private get options() {
    this.core.var.options.define('DynamicMusic', DynamicMusic.options);
    return V.options.maplebirch.DynamicMusic;
  }

  private get volume(): number {
    const volume = Number(this.options.volume);
    return Number.isFinite(volume) ? Math.clamp(volume, 0, 1) : DynamicMusic.options.volume;
  }

  private get ambienceVolume(): number {
    const volume = Number(this.options.ambienceVolume);
    if (this.core.audio.Mute) return 0;
    return Number.isFinite(volume) ? Math.clamp(volume, 0, 1) : DynamicMusic.options.ambienceVolume;
  }

  private get audioPackInstalled(): boolean {
    return this.core.modLoader?.getModZip(DYNAMIC_AUDIO_MOD_NAME) != null;
  }

  private async loadConfig(): Promise<boolean> {
    const pack = this.core.modLoader?.getModZip(DYNAMIC_AUDIO_MOD_NAME);
    try {
      if (!pack) throw new Error('Audio pack is unavailable');
      const file = pack.zip.file('dynamic-music.json');
      if (!file) throw new Error('Audio pack has no dynamic-music.json');
      const config = parseDynamicMusicConfig(JSON.parse(await file.async('string')), path => pack.zip.file(path) != null);
      for (const track of config.music) if (!this.tracks.has(track.track)) this.tracks.register(track);
      for (const track of config.ambience) if (!this.ambienceTracks.has(track.track)) this.ambienceTracks.register(track);
      this.configReady = true;
      return true;
    } catch (error) {
      this.core.audio.log('Dynamic music config could not be loaded', 'WARN', error);
      return false;
    }
  }

  private state(): MusicState {
    return {
      combat: V.combat,
      solarEclipse: Weather.solarEclipse,
      bloodMoon: Weather.bloodMoon,
      meteorShower: Weather.meteorShower,
      weather: Weather.current.name,
      precipitation: Weather.precipitation,
      dayState: Time.dayState
    };
  }

  private async drain(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    try {
      let desired: string | null;
      // 播放接口异步返回时，玩家可能已经进了战斗或关闭音乐；始终收敛到最后一次请求。
      do {
        desired = this.requested;
        const current = this.core.audio.CurrentTrack;
        if (desired == null) {
          if (current?.modName === DYNAMIC_AUDIO_MOD_NAME) this.core.audio.stop();
        } else {
          let playing = current?.modName === DYNAMIC_AUDIO_MOD_NAME && current.audioName === desired;
          if (!playing) {
            try {
              playing = (await this.core.audio.playFromMod(DYNAMIC_AUDIO_MOD_NAME, desired)) !== false;
            } catch (error) {
              this.core.audio.log('Dynamic music could not be played', 'WARN', error);
            }
          }
          if (playing) {
            this.core.audio.PlayMode = 'loop_one';
            this.core.audio.Volume = this.volume;
          }
        }
      } while (this.requested !== desired);
    } finally {
      this.syncing = false;
    }
  }

  public refresh(): void {
    const enabled = this.options.enabled === true && this.audioPackInstalled;
    // 本体只保存调度器；曲目和资源路径都从可选音频包的 JSON 读取。
    if (enabled && !this.configReady) {
      this.configLoading ??= this.loadConfig().then(loaded => {
        this.configLoading = null;
        // 失败后等待下次状态刷新再尝试，避免坏配置在同一轮微任务里无限重试。
        if (loaded) this.refresh();
      });
      return;
    }
    const state = this.state();
    const music = enabled ? this.tracks.selectTrack(state) : null;
    this.requested = music ? (music.file?.replace(/^audio\//, '').replace(/\.[^.]+$/, '') ?? music.track) : null;
    void this.drain();
    const ambience = enabled ? this.ambienceTracks.selectTrack(state) : null;
    if (ambience)
      void this.ambience.play(ambience.file ?? `audio/${ambience.track}.ogg`, this.ambienceVolume).catch(error => this.core.audio.log('Dynamic ambience could not be played', 'WARN', error));
    else this.ambience.stop();
  }

  public setVolume(value: number): void {
    this.options.volume = Math.clamp(Number(value) || 0, 0, 1);
    const current = this.core.audio.CurrentTrack;
    if (current?.modName === DYNAMIC_AUDIO_MOD_NAME) this.core.audio.Volume = this.options.volume;
  }

  public setAmbienceVolume(value: number): void {
    this.options.ambienceVolume = Math.clamp(Number(value) || 0, 0, 1);
    this.ambience.setVolume(this.ambienceVolume);
  }

  public register(track: DynamicMusicTrack, layer: DynamicAudioLayer = 'music'): this {
    (layer === 'music' ? this.tracks : this.ambienceTracks).register(track);
    return this;
  }

  public unregister(track: string, layer: DynamicAudioLayer = 'music'): boolean {
    return (layer === 'music' ? this.tracks : this.ambienceTracks).unregister(track);
  }

  public preInit(): void {
    this.core.var.options.define('DynamicMusic', DynamicMusic.options);
    this.core.on(':passagedisplay', () => this.refresh(), 'DM');
    this.core.on(':audio', () => this.ambience.setVolume(this.ambienceVolume), 'DM ambience volume');
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly DM: DynamicMusic;
  }
}

export default DynamicMusic;
