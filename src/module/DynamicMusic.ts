type MusicTrack = 'encounter' | 'blood-moon' | 'night' | 'day';

interface MusicState {
  combat: unknown;
  bloodMoon: unknown;
  dayState: unknown;
}

const MOD_NAME = 'deadwood-reblooms';
const TRACKS = new Set<MusicTrack>(['encounter', 'blood-moon', 'night', 'day']);

export const DEFAULT_DYNAMIC_MUSIC_OPTIONS = {
  enabled: false,
  volume: 0.5
};

export function selectMusic(state: MusicState): MusicTrack {
  if (state.combat === 1) return 'encounter';
  if (state.bloodMoon === true) return 'blood-moon';
  return state.dayState === 'night' ? 'night' : 'day';
}

class DynamicMusic {
  public readonly exposed = true;
  static readonly options = { ...DEFAULT_DYNAMIC_MUSIC_OPTIONS };

  private requested: MusicTrack | null = null;
  private syncing = false;

  public constructor(private readonly core: typeof maplebirch) {}

  private get options() {
    return V.options.maplebirch.DynamicMusic;
  }

  private get volume(): number {
    const volume = Number(this.options.volume);
    return Number.isFinite(volume) ? Math.clamp(volume, 0, 1) : DynamicMusic.options.volume;
  }

  private current(): MusicTrack {
    return selectMusic({
      combat: V.combat,
      bloodMoon: Weather.bloodMoon,
      dayState: Time.dayState
    });
  }

  private async drain(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    try {
      let desired: MusicTrack | null;
      do {
        desired = this.requested;
        const current = this.core.audio.CurrentTrack;
        if (desired == null) {
          if (current?.modName === MOD_NAME && TRACKS.has(current.audioName as MusicTrack)) this.core.audio.stop();
        } else if (current?.modName !== MOD_NAME || current.audioName !== desired) {
          if (await this.core.audio.playFromMod(MOD_NAME, desired)) {
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
    this.requested = this.options.enabled ? this.current() : null;
    void this.drain();
  }

  public setVolume(value: number): void {
    this.options.volume = Math.clamp(Number(value) || 0, 0, 1);
    const current = this.core.audio.CurrentTrack;
    if (current?.modName === MOD_NAME && TRACKS.has(current.audioName as MusicTrack)) this.core.audio.Volume = this.options.volume;
  }

  public preInit(): void {
    this.core.var.options.define('DynamicMusic', DynamicMusic.options);
    this.core.on(':passagedisplay', () => this.refresh(), 'DM');
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly DM: DynamicMusic;
  }
}

export default DynamicMusic;
