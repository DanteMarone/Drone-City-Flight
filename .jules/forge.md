# Forge's Journal - Creative Log

## 🔨 Forge: Added BillboardEntity
**Date**: [Current Date]

### 🎨 Visuals
-   **Structure**: A monopole design with a V-truss support and catwalk, resembling highway or city billboards.
-   **Procedural Content**: Uses `TextureGenerator.createBillboardAd(seed)` to generate unique advertisements for each instance.
    -   Random background HSL colors.
    -   Random patterns (Circles or Stripes).
    -   Random slogans combining words like "BUY", "EAT", "FUTURE", "BOT".
-   **Night Mode**: The ad face uses `emissiveMap` to simulate backlighting or floodlighting, ensuring visibility at night.

### ⚙️ Functionality
-   **Static Prop**: Extends `BaseEntity`.
-   **Placement**: Can be placed on ground or rooftops.
-   **Variety**: Every placed billboard has a random seed (unless copied via serialization), ensuring a diverse skyline.

### 🏗️ Parent Class
-   `BaseEntity` (in `src/world/entities/base.js`)
