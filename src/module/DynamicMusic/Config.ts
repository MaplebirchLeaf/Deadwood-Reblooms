export interface MusicState {
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
  rainproof: boolean;
  gender: string;
  voice: string;
}

export interface DynamicMusicTrack {
  track: string;
  file: string;
  title?: string;
  artist?: string;
  priority: number;
  layer: 'place' | 'weather' | 'voice';
  volume: number;
  when: (state: MusicState) => boolean;
}

interface MusicScene {
  scene: string;
  when: (state: MusicState) => boolean;
}

export interface DynamicMusicEffect {
  event: string;
  files: string[];
  priority: number;
  volume: number;
  cooldown: number;
  when: (state: MusicState) => boolean;
}

export interface DynamicMusicConfig {
  scenes: MusicScene[];
  music: DynamicMusicTrack[];
  ambience: DynamicMusicTrack[];
  effects: DynamicMusicEffect[];
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
  season: 'string',
  rainproof: 'boolean',
  gender: 'string',
  voice: 'string'
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
        if (raw.layer !== undefined && !['place', 'weather', 'voice'].includes(String(raw.layer))) throw new Error('Invalid ambience layer for ' + raw.track);
        if (raw.volume !== undefined && (typeof raw.volume !== 'number' || !Number.isFinite(raw.volume) || raw.volume < 0 || raw.volume > 1)) throw new Error('Invalid volume for ' + raw.track);
        names.add(raw.track);
        return {
          track: raw.track,
          file: raw.file,
          title: raw.title as string | undefined,
          artist: raw.artist as string | undefined,
          priority: raw.priority,
          layer: (raw.layer ?? 'place') as 'place' | 'weather' | 'voice',
          volume: (raw.volume ?? 1) as number,
          when: parseCondition(raw.when, raw.track)
        };
      })
      .sort((left, right) => right.priority - left.priority);
  };

  const scenes = value.scenes.map((raw, index) => {
    if (!isRecord(raw) || typeof raw.scene !== 'string' || !/^[\w-]+$/.test(raw.scene)) throw new Error('Invalid scene at index ' + index);
    return { scene: raw.scene, when: parseCondition(raw.when, raw.scene, true) };
  });
  if (value.effects !== undefined && !Array.isArray(value.effects)) throw new Error('Invalid effects list');
  const effects: DynamicMusicEffect[] = ((value.effects ?? []) as unknown[])
    .map((raw, index) => {
      if (!isRecord(raw) || typeof raw.event !== 'string' || !/^[\w-]+$/.test(raw.event)) throw new Error('Invalid effect at index ' + index);
      if (!Array.isArray(raw.files) || !raw.files.length || !raw.files.every(file => typeof file === 'string' && audioPath.test(file) && hasFile(file)))
        throw new Error('Missing or invalid effect files for ' + raw.event);
      if (typeof raw.priority !== 'number' || !Number.isFinite(raw.priority)) throw new Error('Invalid effect priority for ' + raw.event);
      if (typeof raw.volume !== 'number' || !Number.isFinite(raw.volume) || raw.volume < 0 || raw.volume > 1) throw new Error('Invalid effect volume for ' + raw.event);
      if (typeof raw.cooldown !== 'number' || !Number.isFinite(raw.cooldown) || raw.cooldown < 0 || raw.cooldown > 60000) throw new Error('Invalid effect cooldown for ' + raw.event);
      return {
        event: raw.event,
        files: raw.files as string[],
        priority: raw.priority,
        volume: raw.volume,
        cooldown: raw.cooldown,
        when: parseCondition(raw.when, raw.event)
      };
    })
    .sort((left, right) => right.priority - left.priority);
  return { scenes, music: parseLayer(value.music, 'music'), ambience: parseLayer(value.ambience, 'ambience'), effects };
}
