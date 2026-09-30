### Installation and options

The main mod contains only the scheduler. Also sideload the **deadwood-reblooms-audio** pack, which contains `dynamic-music.json` and the sound files. Open **Mod Options → Dynamic Music**, enable it, then set music and ambience volumes separately. Added tracks do not play without the audio pack.

### When tracks play

Combat has the highest music priority. Outside combat, solar eclipse, blood moon, and meteor shower take precedence over ordinary day and night music in that order. Ambience is separate: thunderstorm takes precedence over rain, which takes precedence over snowy wind. The track changes when the game state matches a condition in the pack configuration.

If playback is silent, check that **the pack is loaded, the DynamicMusic module is enabled, the checkbox is on, game audio is unmuted, and neither volume slider is zero**. A weather state with no configured ambience remains silent.
