[中文](README.md) | [English](README.EN.md)

# Deadwood Reblooms

[![Game](https://img.shields.io/badge/Game-Degrees%20of%20Lewdity-purple)](https://gitgud.io/Vrelnir/degrees-of-lewdity)
[![Framework](https://img.shields.io/badge/Framework-maplebirch-blue)](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)
[![Issues](https://img.shields.io/github/issues-raw/MaplebirchLeaf/Deadwood-Reblooms?label=issues)](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/issues)

**Deadwood Reblooms** is a _Degrees of Lewdity_ content mod built on the [Maplebirch Framework](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework). It expands character stories, school life, housing and finance, transformations, encounters, and game UI. Its modules are managed through the framework.

---

## Contents

- [Installation and dependencies](#installation-and-dependencies)
- [Modules and game guide](#modules-and-game-guide)
- [Optional audio pack](#optional-audio-pack)
- [Acknowledgements and asset sources](#acknowledgements-and-asset-sources)
- [Issues and related projects](#issues-and-related-projects)

## Installation and dependencies

1. Use a game build with SugarCube 2 ModLoader. Separate packages target **DoL 0.5.12.13** and **DoL 0.5.11.9**.
2. Load the [Maplebirch Framework](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework). Its version must satisfy the mod package's `maplebirch >= 5.1.1` requirement, together with the other listed dependencies.
3. From [Releases](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/releases), load only the main `deadwood-reblooms-*.modpack` matching your game version. To use dynamic music, also load the audio `deadwood-reblooms-audio-*.modpack` for that same game version.
4. To change modules, use the framework's module manager and reload when prompted.

`DR` is the root module. Turning it off stops every Deadwood Reblooms module. When an installed external mod provides overlapping functionality, Deadwood Reblooms turns off its corresponding module and retains the external mod. Character stories still follow vanilla relationships, locations, and schedules.

## Modules and game guide

| Module                | Content                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `DR`                  | Base options, game guide, clothing search, and mod statistics             |
| `Sydney`              | Sydney's dormitory, Sirris estate, and relationship scenes                |
| `Robin`               | Robin's stands, Cliff Street drink shop, shared life, and intimate scenes |
| `Whitney`             | Underground brothel rescue, reunion, and daily interactions               |
| `Kylar`               | Manor stays and room interactions                                         |
| `LS`                  | Attendance pass, prefect, student president, school reputation, and gym   |
| `VP`                  | Stat breakthroughs, homes, banking, stocks, and other vanilla additions   |
| `CA`                  | Solar eclipses, meteor showers, and changing sky and weather visuals      |
| `MoreTransformations` | Horse and fish transformations, locations, equipment, and traits          |
| `LongerCombat`        | Longer encounters, staged dialogue, and fluid displays                    |
| `MLIANPCA`            | More love interests and social sidebar portraits                          |
| `NPCSidebarPortrait`  | NPC portraits in scenes and the sidebar                                   |
| `UCACSD`              | Vanilla cheat access and encounter stat values                            |
| `ICC`                 | A searchable, importable, and exportable cheat command collection         |
| `DM`                  | Music selected by combat, time of day, weather, and celestial events      |

Open **Mod Hints** in the game sidebar for the single-page guide. Its sections and search cover characters, places, unlock conditions, and troubleshooting. **Character → Statistics → Mod Statistics** shows progress for the current save, including stats, school, finance, property, and character routes. Check the journal and the actual scene for the next story step.

## Optional audio pack

The audio files and `dynamic-music.json` for `DM` live in a separate pack. The main mod only provides the playback controller. After loading the audio pack, enable **Dynamic Music** in mod options and adjust music and ambience volumes separately. Without the audio pack, dynamic music stays silent and the other modules still work.

## Acknowledgements and asset sources

Thanks to the following creators for their work and help. You can turn off the corresponding Deadwood Reblooms module when using an overlapping original mod:

- `LongerCombat`: [Longer Combat](https://github.com/emicoto/DOLMods/) by 狐千月.
- `MLIANPCA`: [social sidebar portraits](https://github.com/Eudemonism00/DOL-npcicon-mods/) by Eudemonism00 and [More Love Interests](https://github.com/Nephthelana/DoL-More-Love-Interests-Mod) by 苯环.
- `Robin`: [Dom Robin](https://github.com/ZeroRing233/Degrees-of-Lewdity-RobinMod) by 零环零幻想.
- `LS`: [DoLSims](https://github.com/MissedHeart/Degrees-of-Lewdity-DolSims) by 丧心.
- Horse transformation sprites: 元夕.

Dynamic music uses CC0 audio by Kresiek The Furry, Augmentality (Brandon Morris), AdoTheLimey, primbal, Breviceps, Joth, TinyWorlds, isaiah658, SketchMan3, and rubberduck. See the [audio source record](audio-pack/audio/CREDITS.md) for individual tracks. Thanks also to everyone who shared ideas, testing feedback, and other help.

Social sidebar icons and scene portraits are fan art, not official character depictions. The in-game guide also lists creators and asset sources.

## Issues and related projects

Open an [issue](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/issues) with the game, framework, and mod versions, enabled modules, location, and steps to reproduce. Mention the game branch or localization combination if the problem occurs only there.

- [Degrees of Lewdity](https://gitgud.io/Vrelnir/degrees-of-lewdity)
- [Maplebirch Framework](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)
