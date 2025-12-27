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

## 2025-05-24 - Interactive Elements Semantics
**Learning:** In "editor" or "tool" interfaces (like Dev Mode), items that are primarily draggable are often implemented as `<div>`s, making them inaccessible to keyboard users. Converting these to `<button>` elements immediately provides keyboard focusability and click events (Enter/Space), which can be mapped to "select tool" actions, significantly improving accessibility without changing the visual design (if CSS is reset correctly).
**Action:** When building palette or toolbar interfaces, always use `<button>` elements instead of `<div>`s, even if the primary interaction is drag-and-drop, to ensure keyboard users can access the functionality (e.g., via a "click to select" fallback).
