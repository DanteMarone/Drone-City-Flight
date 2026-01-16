## 2026-01-03 - Added Help System [Feature] [Blueprint]
**Learning:**
- Implemented a modal Help System with tabbed interface ('Gameplay', 'Dev Mode').
- Created reusable CSS classes for keycap visualization (`.help-key`).
- Integrated with MenuSystem and App pause logic.

**Action:**
- Created `src/ui/help.js`.
- Updated `src/ui/menu.js`, `src/core/app.js`, `src/style.css`.
- Documented in `docs/help_system.md`.

## 2024-05-23 - Added Performance Monitor [Tool] [Blueprint]
**Learning:**
- Implemented a lightweight `PerformanceMonitor` class that polls `threeRenderer.info` every 500ms.
- Discovered that accessing `app.renderer.threeRenderer.info.render.calls` provides the Draw Call count.
- Added a "Toggle Performance Stats" item to the TopBar View menu.

**Action:**
- Created `src/dev/tools/performanceMonitor.js`.
- Updated `src/dev/devMode.js`, `src/dev/ui/topBar.js`, `src/style.css`.
- Documented in `docs/ux/performance_monitor.md`.
