### Prerequisites

Enable **DynamicMusic** and install the separate **deadwood-reblooms-audio** pack. The main mod schedules playback, while the pack supplies configuration and tracks. Both are needed.

### Activation steps

1. Confirm the loader loaded the pack rather than leaving it in Downloads.
2. Save and reload module changes.
3. Tick enable in **Mod settings → Dynamic music**. This playback option is separate from the module toggle.
4. Adjust music and ambience independently, defaulting to 50% and 25%. Muting one does not mute the other.
5. Click inside the game to permit browser audio, then enter a configured scene.

### Track selection

| Layer    | Priority                                                     | Basis                                |
| -------- | ------------------------------------------------------------ | ------------------------------------ |
| Music    | Combat → eclipse → blood moon → meteors → ordinary day/night | Current state and pack configuration |
| Ambience | Thunderstorm → rain → snowy wind                             | Weather and pack configuration       |

Ambience is independent. Time, weather and scene changes refresh playback. Clicking does not randomly choose a new track every time.

### Effects and limits

Sound only, without changing dates, weather or dates with characters. Eclipse and meteor scheduling belongs to CelestialAnomalies. A track does not establish date eligibility. Ordinary blood moons do not need the eclipse toggle.

### Troubleshooting

Check **pack loaded → module reload → playback enabled → both volumes → game master volume → tab mute / autoplay → resource errors**. For one missing weather sound, check that the pack actually includes it. Volume cannot create missing tracks.
