### Prerequisites and entrance

Enable **IncantationCheatCollection**, reload and open **Framework content → Cheat collection**. No location, character or skill unlock applies. It is separate from the vanilla cheat menu.

### Creating and executing

1. Enter a recognisable name and command.
2. Input starting with `<<` is treated as Twine macros, otherwise as JavaScript. Detection does not supply correct story variables.
3. Check the current save before Execute. Execution is immediate, not a preview.
4. Select a name to edit. Search filters names and sorting changes list order.
5. Star frequent commands to put them first. Unstar before deleting, since only unstarred entries offer deletion.

### Import, export and devices

Export creates a `.cheat` file. Import **replaces the entire library**, rather than appending one command. Export a backup before importing, and export/import to transfer devices.

The library is in this browser's IndexedDB, not an individual save. Different saves share the library, but executing a command changes only the current game.

### Effects and limits

Stores and repeats commands without checking their suitability for the current story. Changes to time, character state or funds can affect later events. Save and confirm purpose before execution.

### Troubleshooting

Check changed browsers/devices, cleared site data and search filters if commands disappear. For execution errors check syntax type, save state and console output. A familiar command name does not validate its code.
