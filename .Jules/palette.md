# Palette Journal

## 2023-10-27 - Immediate Feedback for Abstract Settings
**Learning:** Users struggle to gauge the impact of small decimal values (like 0.001 vs 0.005) on sliders. Providing a scaled, human-readable integer (1-50) alongside the slider bridges this gap without changing the underlying logic.
**Action:** Always pair abstract configuration sliders with a live value readout that uses a "friendly" scale.

## 2024-05-23 - Custom Progress Bar Accessibility
**Learning:** Custom progress indicators (like battery bars built with divs) are invisible to screen readers unless explicitly marked with `role="progressbar"`, `aria-valuenow`, and associated labels. Visual text indicators (like "100%") should be hidden with `aria-hidden="true"` to avoid duplicate announcements when the progress bar already announces the value.
**Action:** Always wrap custom progress/meter components with ARIA roles and manage `aria-valuenow` dynamically in the update loop.

## 2024-05-24 - Transitioning "Hidden" UI Elements
**Learning:** Using `display: none` for toggling overlays prevents CSS transitions like opacity fades or scale effects. A pattern of `visibility: hidden; opacity: 0;` allows for smooth transitions while maintaining accessibility (removing it from the accessibility tree when hidden).
**Action:** For modal/overlay transitions, use a `visible` class that toggles `visibility` and `opacity`, rather than removing a `hidden` class that controls `display`.

## 2025-05-24 - [Dev Mode Form Accessibility]
**Learning:** The Dev Mode Property Panel used non-semantic label patterns (`<label>X</label> <input>`) which failed to programmatically associate text with inputs. This is a common pattern in 3D tools where UI is often treated as "debug" rather than "product", but it severely hampers accessibility for screen readers and touch targets.
**Action:** Always use explicit `for` attributes (`<label for="id">`) in generated UI code, even for internal tools, to ensure labels are clickable and accessible.

## 2025-05-24 - Interactive Palette Accessibility
**Learning:** In creative tools, "palette" items are often implemented as draggable divs, which excludes keyboard users from selecting or "picking up" tools. Converting these to `<button>` elements immediately provides tab focus and "click" events (via Enter/Space) for free, enabling alternative interaction modes (like "click to select tool" vs "drag to place") without complex custom key handlers.
**Action:** Implement palette/toolbar items as `<button>` elements by default, even if their primary interaction is drag-and-drop, to ensure a baseline of keyboard accessibility.

## 2025-05-24 - Visible Pause Controls
**Learning:** Users, especially on touch devices or those unfamiliar with keyboard shortcuts (Esc), struggle to find how to pause or access menus if no visible control exists. Relying solely on keyboard events excludes these users and can leave them "stuck" in the game loop.
**Action:** Always provide a visible, accessible UI control for primary system actions like Pause/Menu. Ensure these controls have `pointer-events: auto` if they are placed within overlay layers that default to `pointer-events: none` to prevent "unclickable" phantom buttons.

## 2025-10-27 - Vector Group Accessibility
**Learning:** Complex inputs like 3D vectors (X, Y, Z) often share a single visual label ("Position") but require individual inputs. Using a single `<label>` for the group is invalid HTML for multiple inputs. Instead, the group label should be a visual header (or `<fieldset>` legend), and each individual input needs a specific accessible name (e.g., `aria-label="Position X"`).
**Action:** For multi-input groups where a visible label applies to the set, ensure each sub-input has a unique `aria-label` or `aria-labelledby` to distinguish it (e.g., "X", "Y", "Z").
