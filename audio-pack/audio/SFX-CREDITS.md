# Sound effect credits

本目录包含 7 个衣料、皮革、打击与枪械音效，合计 66,331 字节（约 65 KiB），不含人声。下列来源以 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) 发布素材。替换文件时保留文件名即可沿用对应配置。

The selection contains clothing, leather, impact and firearm effects. No voices or audio from BoL are included.

## Sources

| Packaged files                              | Original release                                                         | License |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------- |
| `cloth-1.ogg`, `cloth-2.ogg`, `leather.ogg` | [Source](https://kenney.nl/assets/rpg-audio)                             | CC0 1.0 |
| `hit-1.ogg`, `hit-2.ogg`                    | [Source](https://kenney.nl/assets/impact-sounds)                         | CC0 1.0 |
| `gunshot-1.ogg`, `shotgun.ogg`              | [Source](https://opengameart.org/content/the-free-firearm-sound-library) | CC0 1.0 |

## Processing

- Native source sample rates are retained. Stereo recordings are downmixed to mono and encoded as OGG Vorbis at quality 0.25.
- Each effect receives a fixed gain toward a peak of -10 dBFS, with amplification limited to +18 dB. No dynamic compression or pitch shifting is used.
- Near-silent margins are trimmed with up to 15 ms of attack padding and 35 ms of tail padding. Clips have a 2 ms fade-in and 12 ms fade-out to avoid clicks.
- Individual gunshots are excerpted from the original recordings. `sfx-assets.json` records source details, exact excerpt ranges, source and output hashes, size and duration.
