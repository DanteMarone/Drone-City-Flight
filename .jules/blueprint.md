## 2026-01-03 - Added Help System [Feature] [Blueprint]
**Learning:**
- Implemented a modal Help System with tabbed interface ('Gameplay', 'Dev Mode').
- Created reusable CSS classes for keycap visualization (`.help-key`).
- Integrated with MenuSystem and App pause logic.

**Action:**
- Created `src/ui/help.js`.
- Updated `src/ui/menu.js`, `src/core/app.js`, `src/style.css`.
- Documented in `docs/help_system.md`.

## 2026-02-17 - Added Minimap [Feature] [Blueprint]
**Learning:**
- Implemented a 2D Minimap with cached static geometry for performance.
- Integrated with HUD and App loop.
- Ensured accessibility with keyboard toggle ('M').

**Action:**
- Created `src/ui/minimap.js`.
- Updated `src/core/app.js` and `style.css`.
- Documented in `docs/minimap.md`.
