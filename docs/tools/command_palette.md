# Command Palette

The **Command Palette** is a developer tool that provides quick access to various actions via a searchable interface, similar to features found in modern IDEs like VS Code or applications like Slack.

## Access

- **Shortcut:** `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac)
- **Scope:** Only available when **Dev Mode** is enabled (`Backquote`).

## Features

- **Searchable Actions:** Type to filter commands by name or category.
- **Keyboard Navigation:** Use `Arrow Up`/`Arrow Down` to navigate, `Enter` to execute, `Escape` to close.
- **Categorized Commands:**
  - `Dev`: General tools (Grid, HUD, Save/Load).
  - `Edit`: Undo, Redo, Copy, Paste, Duplicate, Delete.
  - `Env`: Time of day controls (Sunrise, Noon, Sunset, Night).
  - `Spawn`: Quick access to placement modes (Road, Sidewalk, River).

## Architecture

- **File:** `src/dev/tools/commandPalette.js`
- **Class:** `CommandPalette`
- **Integration:** Instantiated in `BuildUI`, triggered via `DevMode._handleShortcuts`.
- **Styling:** CSS defined in `src/style.css` (prefixed with `.command-palette-`).

## Usage

```javascript
// Programmatic access (internal)
devMode.ui.commandPalette.toggle();
devMode.ui.commandPalette.open();
```

## Adding Commands

Commands are collected in `_collectCommands()`:

```javascript
this._addCommand('Label', () => { /* action */ }, 'Category', 'ShortcutHint');
```
