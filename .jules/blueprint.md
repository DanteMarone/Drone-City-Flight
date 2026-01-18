## 2026-01-03 - Added Help System [Feature] [Blueprint]
**Learning:**
- Implemented a modal Help System with tabbed interface ('Gameplay', 'Dev Mode').
- Created reusable CSS classes for keycap visualization (`.help-key`).
- Integrated with MenuSystem and App pause logic.

**Action:**
- Created `src/ui/help.js`.
- Updated `src/ui/menu.js`, `src/core/app.js`, `src/style.css`.
- Documented in `docs/help_system.md`.

## 2026-01-04 - Added Minimap [Feature] [Blueprint]
**Learning:**
- Implemented a high-performance HUD element using Canvas 2D overlay on top of WebGL.
- Hooked into `App.update` for frame-synced UI rendering.

**Action:**
- Created `src/ui/minimap.js`.
- Updated `src/core/app.js`, `src/style.css`.
- Documented in `docs/minimap.md`.
