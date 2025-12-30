## 2025-05-24 - Visible Pause Controls
**Learning:** Users, especially on touch devices or those unfamiliar with keyboard shortcuts (Esc), struggle to find how to pause or access menus if no visible control exists. Relying solely on keyboard events excludes these users and can leave them "stuck" in the game loop.
**Action:** Always provide a visible, accessible UI control for primary system actions like Pause/Menu. Ensure these controls have `pointer-events: auto` if they are placed within overlay layers that default to `pointer-events: none` to prevent "unclickable" phantom buttons.
