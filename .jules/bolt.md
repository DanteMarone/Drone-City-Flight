## 2024-12-14 - [Scan vs Registry]
**Learning:** Iterating over a large general-purpose list (like `world.colliders`) to find a specific subtype (like `landingPad`) every frame is a silent performance killer. It scales linearly with world size, not feature usage.
**Action:** Maintain specialized lists (registries) for objects that require specific per-frame logic (e.g., `landingPads`, `updatables`) and iterate those instead.
