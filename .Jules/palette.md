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
