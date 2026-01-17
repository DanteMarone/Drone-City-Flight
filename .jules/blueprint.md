## 2026-01-03 - Added Help System [Feature] [Blueprint]
**Learning:**
- Implemented a modal Help System with tabbed interface ('Gameplay', 'Dev Mode').
- Created reusable CSS classes for keycap visualization (`.help-key`).
- Integrated with MenuSystem and App pause logic.

**Action:**
- Created `src/ui/help.js`.
- Updated `src/ui/menu.js`, `src/core/app.js`, `src/style.css`.
- Documented in `docs/help_system.md`.

## 2026-01-04 - Command Palette [Tool] [Blueprint]
**Discovery:**
- Developer tools were scattered across menus and shortcuts, creating friction for power users.
- Needed a unified entry point for all actions ("Invisible Design").

**Action:**
- Implemented `src/dev/tools/commandPalette.js`.
- Added styles to `src/style.css`.
- Integrated `Ctrl+K` shortcut in `src/dev/devMode.js`.
- Documented in `docs/tools/command_palette.md`.
