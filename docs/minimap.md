# Minimap

The **Minimap** is a UI component that provides a top-down 2D view of the world, aiding in navigation and orientation.

## Usage

-   **Toggle Visibility**: Press `M` key.
-   **Display**: Located in the bottom-right corner of the screen.

## Features

-   **Static Geometry Caching**: Renders static world elements (roads, buildings, landing pads) to an offscreen canvas (`staticCanvas`) once (or when the map loads) to maximize performance.
-   **Dynamic Updates**: Renders the player (Drone/Person) position and rotation every frame on top of the static map.
-   **Circular Viewport**: Uses a clipped circular canvas for a classic radar/minimap aesthetic.
-   **North-Up Orientation**: The map remains fixed (North is Up), while the player arrow rotates to indicate heading.

## Architecture

The `Minimap` class is located in `src/ui/minimap.js`.

### Key Components

-   **Main Canvas**: The visible `<canvas>` element on the HUD.
-   **Static Canvas**: An offscreen `<canvas>` that holds the rasterized map of the static world.
-   **World Offset**: A coordinate offset (default 2000) to map negative world coordinates to positive canvas coordinates.

### Logic Flow

```mermaid
graph TD
    App[App] -->|Init| Minimap
    App -->|Load Map| Minimap.refreshStatic
    App -->|Update Frame| Minimap.update

    subgraph Minimap
        refreshStatic[refreshStatic()] -->|Iterate Entities| WorldColliders[World.colliders]
        WorldColliders -->|Draw Static| StaticCanvas[Offscreen Static Canvas]

        update[update(dt)] -->|Clear| MainCanvas[Visible Canvas]
        update -->|Draw Portion| StaticCanvas
        update -->|Draw Player| Player[Drone/Person]
        Player --> MainCanvas
    end
```

## Styling

Styles are defined in `style.css` (root) under the `.minimap-container` class.

## Integration

-   **Instantiation**: `src/core/app.js` initializes `this.minimap` in `init()`.
-   **Update Loop**: `App.update()` calls `this.minimap.update(dt)`.
-   **Map Loading**: `App.loadMap()` calls `this.minimap.refreshStatic(this.world)` after the world is loaded.
