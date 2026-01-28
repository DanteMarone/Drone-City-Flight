# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-05-24 - Implicit Dependencies in Three.js Examples
**Learning:** `three/examples` loaders (like FBXLoader) often rely on implicit dependencies like `fflate` which are not listed in `three`'s `package.json`. When using strict package managers like `pnpm`, these must be explicitly added to the root `package.json` to prevent them from being pruned during install/update cycles.
**Action:** Always check for implicit dependencies when working with `three/examples` and add them to `package.json` if missing.
