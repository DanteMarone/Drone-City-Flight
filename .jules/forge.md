## 2024-05-23 - Dumpster (Forge)
**Learning:**
Composite geometries can create convincing industrial props without external models.
- **Pattern:** Using a `CanvasTexture` to generate "grime" (random noise + dark patches) significantly improves the look of simple box primitives, breaking up the "clean CG" look.
- **Technique:** `ctx.globalAlpha` with randomized small rectangles creates a good "rust/dirt" mask.

**Action:**
Added `DumpsterEntity` to `src/world/entities/dumpster.js`.
