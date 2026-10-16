# Deadwood Reblooms Audio Pack

Use Maplebirch Framework 5.4.9 or later and matching main mod and audio pack versions.

Enable Dynamic Music in the game settings, then choose Music, Ambience and Sound Effects independently. Defaults are 50%, 25% and 35%. Master volume and mute affect all layers.

The pack provides scene music, place and weather loops, and short effects. Rain can accompany waves or traffic. The moor and ruined castle have open-country wind in dry weather, storm drains have flowing water, and old sewers have quieter dripping. Short effects do not stop or replace the music track.

Muffled rain and distant thunder can be heard from the orphanage bedroom and bathroom, and the main temple quarters. These window-side sounds do not extend to every indoor scene or underground passage. Thunder follows stormy weather with natural pauses, rather than sounding for every visible flash of lightning.

## Files and replacement

- `audio/music/`: tracks shown in the manual music library.
- `audio/ambience/`: scene and weather loops.
- `audio/sfx/`: short clothing, impact and gunfire effects.
- `dynamic-music.json`: the main mod's selection rules.

To replace a sound, keep its packaged path and a supported audio format, or update all references to its new path in the configuration. Rebuild the ZIP with its original directory structure and mod metadata. Back up the original pack before replacing files.

The pack keeps 7 short clips for impacts, gunfire and clothing feedback. It does not add sounds to every interface click or every combat turn.

## Configuration

`dynamic-music.json` is Deadwood Reblooms' own version 2 format. It does not load BoL pack definitions.

### Scene and loop rules

- `scenes`: ordered classifiers with a `scene` ID and `when`. The first match defines the scene.
- `music`: entries with unique `track`, packaged `file`, finite `priority` and `when`. `title` and `artist` are optional library metadata.
- `ambience`: entries with the same core fields, plus `layer: "place"` or `"weather"` and an optional `volume` multiplier from 0 to 1. The default layer is `place` and the default multiplier is 1.
- Music selects one matching track. Each ambience layer independently selects its highest-priority match, so place and weather can overlap.
- An unchanged track keeps playing. Ambience changes fade between loops. No match means silence.

### Short effect rules

The optional `effects` list accepts entries with:

| Field      | Meaning                                                                |
| ---------- | ---------------------------------------------------------------------- |
| `event`    | A registered detector event, such as `equip` or `impact`               |
| `files`    | Nonempty array of packaged paths under `audio/`                        |
| `priority` | Finite number, highest matching rule wins for that event               |
| `volume`   | Multiplier from 0 to 1, combined with Effects volume and master volume |
| `cooldown` | Minimum replay interval in milliseconds, from 0 to 60000               |
| `when`     | Conditions evaluated against the current scene state                   |

For example:

```json
{
  "event": "equip",
  "files": ["audio/sfx/cloth-1.ogg", "audio/sfx/cloth-2.ogg"],
  "priority": 10,
  "volume": 0.6,
  "cooldown": 500,
  "when": {}
}
```

Variants rotate within the selected rule without using the game's random generator. Selecting an effect does not change story or combat rolls. Short effects use their own channel, leaving music and ambience playing.

The detector currently recognises `gun-handgun`, `gun-rifle`, `gun-shotgun`, `impact`, `bind`, `cloth-damage`, `cloth` and `equip`. A rule still needs an eligible state and a packaged file. Attack, restraint and clothing signals are shared by some encounter types, without claiming complete action coverage.

### Conditions

Available keys are `scene`, `action`, `location`, `passage`, `bus`, `outside`, `combat`, `consensual`, `lightning`, `solarEclipse`, `bloodMoon`, `meteorShower`, `weather`, `precipitation`, `dayState`, `season` and `rainproof`.

- Arrays accept any listed value. Different keys must all match.
- A string ending in `*` matches a prefix. Other strings match exactly. Regular expressions and executable code are not accepted.
- `{}` always matches. Scene classifiers cannot test `scene` themselves.
- Locations are lowercase, while passage titles keep their spelling.
- `action` is `none`, `heist` or `pursuit`, limited to its corresponding active passage.
- `combat` is a number. Outdoor, consent, weather-event and `rainproof` flags are booleans.
- `rainproof` reflects the equipped rainproof headwear or handheld capability, including the supported second handheld slot.

## Trigger and playback behaviour

Effects compare confirmed state changes, including ammunition consumption, attack and hit statistics, restraints and clothing integrity. In-passage action clicks, including native keyboard shortcuts, also capture zero-time equipment changes. Plain interface navigation, history replay, the first screen after loading and repeated redraws stay silent. A change produces at most one action sound.

Equipment changes made outside the main passage are not detected. Playback state and variant counters are not written into game saves.

The packager validates referenced files before building the ZIP. Source, licence and processing details are in [audio/CREDITS.md](audio/CREDITS.md). Music and ambience hashes are recorded in [audio/assets.json](audio/assets.json), with short-effect sources in [audio/SFX-CREDITS.md](audio/SFX-CREDITS.md) and metadata in [audio/sfx-assets.json](audio/sfx-assets.json).
