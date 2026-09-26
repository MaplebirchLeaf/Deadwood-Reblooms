# Dynamic music pack

`dynamic-music.json` belongs in the root of the optional audio pack. The main mod reads it from the installed pack; it contains no built-in song list.

Each entry in `music` or `ambience` has a unique `track` ID, an audio `file` under `audio/`, a numeric `priority`, and a `when` object. The highest-priority matching entry in each layer plays. Conditions in one `when` object must all match; an array accepts any listed value. An empty object always matches and is useful for a fallback music track.

Available condition names: `combat`, `solarEclipse`, `bloodMoon`, `meteorShower`, `weather`, `precipitation`, and `dayState`. Audio file paths must point to files included in this pack. The packager checks these references before creating the ZIP.

Music uses the framework audio playlist. Ambience loops independently so its volume slider does not follow the music slider. Both layers stop when dynamic music is disabled or the audio pack is unavailable.
