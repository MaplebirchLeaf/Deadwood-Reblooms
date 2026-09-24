export interface MusicState {
  combat: unknown;
  solarEclipse: unknown;
  bloodMoon: unknown;
  meteorShower: unknown;
  weather: unknown;
  precipitation: unknown;
  dayState: unknown;
}

export interface DynamicMusicTrack {
  track: string;
  priority: number;
  when: (state: MusicState) => boolean;
}

export type DynamicAudioLayer = 'music' | 'ambience';

export const DYNAMIC_AUDIO_MOD_NAME = 'deadwood-reblooms-audio';
const AMBIENCE_FADE_SECONDS = 2;

export const DEFAULT_DYNAMIC_MUSIC_TRACKS: readonly DynamicMusicTrack[] = [
  { track: 'encounter', priority: 900, when: state => state.combat === 1 },
  { track: 'solar-eclipse', priority: 800, when: state => state.solarEclipse === true },
  { track: 'blood-moon', priority: 700, when: state => state.bloodMoon === true },
  { track: 'meteor-shower', priority: 600, when: state => state.meteorShower === true },
  { track: 'night', priority: 100, when: state => state.dayState === 'night' },
  { track: 'day', priority: 0, when: () => true }
];

export const DEFAULT_DYNAMIC_AMBIENCE_TRACKS: readonly DynamicMusicTrack[] = [
  {
    track: 'ambience-thunderstorm',
    priority: 600,
    when: state => state.weather === 'storm' || state.weather === 'thunderstorm'
  },
  { track: 'ambience-rain', priority: 500, when: state => state.precipitation === 'rain' },
  { track: 'ambience-wind', priority: 400, when: state => state.precipitation === 'snow' }
];

export const DEFAULT_DYNAMIC_MUSIC_OPTIONS = {
  enabled: false,
  volume: 0.5,
  ambienceVolume: 0.25
};

export class DynamicMusicRegistry {
  private readonly tracks = new Map<string, DynamicMusicTrack>();
  private ordered: DynamicMusicTrack[] = [];

  public constructor(tracks: Iterable<DynamicMusicTrack> = []) {
    for (const track of tracks) this.register(track);
  }

  public register(track: DynamicMusicTrack): this {
    this.tracks.set(track.track, track);
    this.ordered = [...this.tracks.values()].sort((left, right) => right.priority - left.priority);
    return this;
  }

  public unregister(track: string): boolean {
    const removed = this.tracks.delete(track);
    if (removed) this.ordered = [...this.tracks.values()].sort((left, right) => right.priority - left.priority);
    return removed;
  }

  public has(track: string): boolean {
    return this.tracks.has(track);
  }

  public select(state: MusicState): string | null {
    return this.ordered.find(track => track.when(state))?.track ?? null;
  }
}

const defaultRegistry = new DynamicMusicRegistry(DEFAULT_DYNAMIC_MUSIC_TRACKS);
const defaultAmbienceRegistry = new DynamicMusicRegistry(DEFAULT_DYNAMIC_AMBIENCE_TRACKS);

export function selectMusic(state: MusicState): string {
  return defaultRegistry.select(state) ?? 'day';
}

export function selectAmbience(state: MusicState): string | null {
  return defaultAmbienceRegistry.select(state);
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
    const file = this.core.modLoader?.getModZip(DYNAMIC_AUDIO_MOD_NAME)?.zip.file(`audio/${track}.ogg`);
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
      this.setVolume(volume);
      return true;
    }
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

  private readonly tracks = new DynamicMusicRegistry(DEFAULT_DYNAMIC_MUSIC_TRACKS);
  private readonly ambienceTracks = new DynamicMusicRegistry(DEFAULT_DYNAMIC_AMBIENCE_TRACKS);
  private readonly ambience: AmbientLoop;
  private requested: string | null = null;
  private syncing = false;

  public constructor(private readonly core: typeof maplebirch) {
    this.ambience = new AmbientLoop(core);
  }

  private get options() {
    const options = ((V.options ??= {}).maplebirch ??= {});
    return (options.DynamicMusic ??= { ...DEFAULT_DYNAMIC_MUSIC_OPTIONS });
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
      do {
        desired = this.requested;
        const current = this.core.audio.CurrentTrack;
        if (desired == null) {
          if (current?.modName === DYNAMIC_AUDIO_MOD_NAME && this.tracks.has(current.audioName)) this.core.audio.stop();
        } else if (current?.modName !== DYNAMIC_AUDIO_MOD_NAME || current.audioName !== desired) {
          if (await this.core.audio.playFromMod(DYNAMIC_AUDIO_MOD_NAME, desired)) {
            this.core.audio.PlayMode = 'loop_one';
            this.core.audio.Volume = this.volume;
          }
        } else {
          this.core.audio.PlayMode = 'loop_one';
          this.core.audio.Volume = this.volume;
        }
      } while (this.requested !== desired);
    } finally {
      this.syncing = false;
    }
  }

  public refresh(): void {
    const enabled = this.options.enabled === true && this.audioPackInstalled;
    const state = this.state();
    this.requested = enabled ? this.tracks.select(state) : null;
    void this.drain();
    if (enabled) {
      const ambience = this.ambienceTracks.select(state);
      if (ambience) void this.ambience.play(ambience, this.ambienceVolume);
      else this.ambience.stop();
    } else {
      this.ambience.stop();
    }
  }

  public setVolume(value: number): void {
    this.options.volume = Math.clamp(Number(value) || 0, 0, 1);
    const current = this.core.audio.CurrentTrack;
    if (current?.modName === DYNAMIC_AUDIO_MOD_NAME && this.tracks.has(current.audioName)) this.core.audio.Volume = this.options.volume;
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
