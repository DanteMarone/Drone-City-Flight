# Command Palette

The **Command Palette** is a keyboard-centric tool that provides quick access to commands, toggles, and scripts within Developer Mode.

**Philosophy:**
- **Invisible Design:** Hidden by default (`Ctrl+K`), appears only when needed.
- **Speed:** Users can type partial names to filter commands.
- **Accessibility:** Fully navigable via keyboard.

## Usage

1.  Press `Ctrl+K` (or `Cmd+K`) to open the palette.
2.  Type to search for a command (e.g., "Grid", "Save").
3.  Use `Up/Down` arrows to navigate.
4.  Press `Enter` to execute.
5.  Press `Esc` to close.

## Implementation

The `CommandPalette` class manages the overlay DOM and command registry.

### Location
`src/dev/tools/commandPalette.js`

### Integration
It is instantiated in `DevMode` (`src/dev/devMode.js`) and bound to the global `Ctrl+K` shortcut.

### API

```javascript
// Register a new command
devMode.commandPalette.registerCommand(
    'unique_id',
    'Human Readable Name',
    () => { /* Action */ },
    'Optional Shortcut Display'
);
```

## Architecture

```mermaid
graph TD
    User[User] -->|Ctrl+K| DevMode
    DevMode -->|toggle()| CommandPalette
    CommandPalette -->|Render| DOM[Overlay DOM]
    User -->|Type| Input[Search Input]
    Input -->|Filter| CommandList
    User -->|Enter| Execute
    Execute -->|Callback| Action[Dev Action]
```

## Styling
Styles are defined in `src/style.css` under the `.command-palette-*` classes. It uses a centered modal approach with a dark theme.
