# Performance Monitor

## Overview
The Performance Monitor is a Developer Mode tool designed to provide real-time feedback on the rendering engine's performance. It displays critical metrics such as Frames Per Second (FPS), Entity Count, Draw Calls, and Triangle Count.

## Usage
1.  **Enable Dev Mode**: Press \` \` (Backtick).
2.  **Toggle Monitor**: Click "View" -> "Toggle Performance Stats" in the Top Bar.

## Metrics
-   **FPS**: Frames Per Second. Measures the smoothness of the simulation. Target is 60 FPS.
-   **Entities**: Total number of colliders/entities in the world. Useful for tracking scene complexity.
-   **Draw Calls**: Number of WebGL draw calls per frame. High numbers can indicate CPU bottlenecks.
-   **Triangles**: Total number of triangles rendered. High numbers can indicate GPU bottlenecks.

## Implementation
-   **File**: \`src/dev/tools/performanceMonitor.js\`
-   **Class**: \`PerformanceMonitor\`
-   **Integration**: Instantiated in \`DevMode\`. Updated in \`DevMode.update(dt)\`.
-   **Data Source**:
    -   FPS: Calculated manually using \`performance.now()\`.
    -   Render Stats: Accessed via \`app.renderer.threeRenderer.info.render\`.
    -   Entity Count: \`app.world.colliders.length\`.

## Dependencies
-   `src/dev/devMode.js`
-   `src/dev/ui/topBar.js`
-   `src/style.css`
