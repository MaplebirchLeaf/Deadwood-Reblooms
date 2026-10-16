# Sound effect credits

本目录包含三类来源的素材：

- `cloth-*`、`leather`、`hit-*`、`gunshot-1`、`shotgun`：衣料、皮革、打击与枪械音，7 个，以 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) 发布。
- `sex-*`、`kiss-*`：亲密音效，50 个，来自 Breeze of Lewdity 的 Plap Pack。
- `audio/voice/*`：人声循环，27 个，来自同一套 OpenNSFWSP 语音包。

文件名沿用本模组既有风格。替换文件时保留文件名即可沿用对应配置。

## Sources

### CC0 1.0

| Packaged files                              | Original release                                                         | License |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------- |
| `cloth-1.ogg`, `cloth-2.ogg`, `leather.ogg` | [Source](https://kenney.nl/assets/rpg-audio)                             | CC0 1.0 |
| `hit-1.ogg`, `hit-2.ogg`                    | [Source](https://kenney.nl/assets/impact-sounds)                         | CC0 1.0 |
| `gunshot-1.ogg`, `shotgun.ogg`              | [Source](https://opengameart.org/content/the-free-firearm-sound-library) | CC0 1.0 |

### 亲密音效与人声

`sex-*`、`kiss-*` 与 `audio/voice/*` 取自 [Breeze of Lewdity Default Packs](https://gitgud.io/velvetvillainess/breeze-of-lewdity-default-packs) 的 Plap Pack。该包由 OpenNSFWSP 语音包整理，人声来自下列作者：

| 类别                                           | 原始语音包                                                   |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `voice/fem-*`                                  | Rain_va Voicepack, Misuzugon Voicepack, NariAudios Voicepack |
| `voice/masc-*`                                 | KGF_Kiko Voicepack, Lewddmon Voicepack                       |
| `voice/andro-*`                                | Rain_va Voicepack, Lewddmon Voicepack                        |
| `sex-oral-*`（口腔水声）                       | EvilZorak, Mouth Swishes                                     |
| `sex-dry-*`, `sex-wet-*`, `sex-knot-*`         | Plap Pack 打击与水声音效                                     |
| `sex-enter-*`, `sex-cum-in-*`, `sex-cum-out-*` | Plap Pack 插入与射精音效                                     |
| `kiss-*`                                       | Plap Pack 亲吻音效                                           |

原始发放渠道为 Plap Pack 自带的 `credit.txt`。若要替换这些文件，请一并核对上游包的最新声明。

## Processing

### 原有 CC0 音效

- Native source sample rates are retained. Stereo recordings are downmixed to mono and encoded as OGG Vorbis at quality 0.25.
- Each effect receives a fixed gain toward a peak of -10 dBFS, with amplification limited to +18 dB. No dynamic compression or pitch shifting is used.
- Near-silent margins are trimmed with up to 15 ms of attack padding and 35 ms of tail padding. Clips have a 2 ms fade-in and 12 ms fade-out to avoid clicks.
- Individual gunshots are excerpted from the original recordings. `sfx-assets.json` records source details, exact excerpt ranges, source and output hashes, size and duration.

### 亲密音效

- 源文件为 44.1 kHz / 48 kHz / 96 kHz 单声道或立体声。统一重采样为 24 kHz 单声道，立体声下混，编码为 OGG Vorbis quality 0.25。
- 每个文件按自身峰值做固定增益，目标峰值 -10 dBFS，增益上限 ±18 dB。不做动态压缩或变调。
- 文件名与目录结构不沿用上游，改为本模组既有的单层 `audio/sfx/` 与 `audio/voice/` 布局。

### 人声循环

- 源文件为 44.1 kHz / 48 kHz 单声道或立体声。重采样为 24 kHz 单声道，编码为 OGG Vorbis quality 0.3。
- 人声作为独立循环层，由游戏内「亲密人声」开关与音量滑条单独控制，与音乐、环境音、音效互不覆盖。
- 保留原始循环内容，不做截断或拼接。
