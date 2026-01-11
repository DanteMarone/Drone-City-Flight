import * as THREE from 'three';

export class RingCompass {
    constructor(scene, drone, ringsManager) {
        this.scene = scene;
        this.drone = drone;
        this.ringsManager = ringsManager;

        this.container = null;
        this.strip = null;

        // Config
        this.pixelsPerDeg = 3.0; // 300px = 100 degrees visible
        this.markerWidth = 135; // 45 degrees * 3.0 = 135px spacing

        this._init();
    }

    _init() {
        // Create container attached to UI layer
        // Ideally this should be inside .hud-top-bar, but we'll append to ui-layer
        // and rely on absolute positioning or manual appending by HUD if we refactor.
        // Current Plan Step 5 will refactor HUD, but Compass logic needs to work now.
        // We will append to 'ui-layer' but with absolute styling matching CSS.

        const layer = document.getElementById('ui-layer');

        this.container = document.createElement('div');
        this.container.className = 'compass-container';
        // Force styling if CSS didn't pick up (it should have)
        // Center it horizontally at top
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';

        this.strip = document.createElement('div');
        this.strip.className = 'compass-strip';

        // Create 3 cycles of content to ensure seamless wrapping
        // N, NE, E, SE, S, SW, W, NW
        const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        let html = '';

        // We render 3 full sets.
        // Set 0: -360 to 0
        // Set 1: 0 to 360 (Center)
        // Set 2: 360 to 720

        for (let k = 0; k < 3; k++) {
            points.forEach(p => {
                // Inline style for marker width
                html += `<div style="
                    min-width: ${this.markerWidth}px;
                    text-align: center;
                    color: ${p.length === 1 ? '#0ff' : 'rgba(255,255,255,0.7)'};
                    font-weight: ${p.length === 1 ? 'bold' : 'normal'};
                    font-size: ${p.length === 1 ? '16px' : '12px'};
                ">${p}</div>`;
            });
        }

        this.strip.innerHTML = html;
        this.container.appendChild(this.strip);

        // Add Center Marker (Triangle)
        const marker = document.createElement('div');
        marker.className = 'compass-marker';
        this.container.appendChild(marker);

        layer.appendChild(this.container);
    }

    update(dt) {
        if (!this.drone || !this.drone.mesh) return;

        // Get Yaw
        // ThreeJS standard: Rotate Y.
        // We assume 0 is -Z (North).
        // CCW rotation (Left) is positive Y rotation.
        let yaw = this.drone.mesh.rotation.y;

        // Convert to degrees
        let deg = yaw * (180 / Math.PI);

        // Normalize to 0-360
        // deg can be negative or > 360
        deg = deg % 360;
        if (deg < 0) deg += 360;

        // Calculate offset
        // We want 'N' (0 deg) to be centered.
        // The strip has 3 cycles. 'N' of the 2nd cycle is at index 8.
        // 8 * markerWidth.

        const startOffset = 8 * this.markerWidth; // Pixels to reach start of Cycle 1

        // Current rotation offset
        // If we turn Left (+deg), the strip should move Right (-deg visual?).
        // If I face West (Left, +90), 'W' should appear.
        // 'W' is to the Right of 'N' in the list?
        // Sequence: N, NE, E, SE, S, SW, W, NW.
        // If I look 90 deg (E? or W?)
        // Standard Map: East is 90.
        // ThreeJS: +X is Right (East?). -Z is Forward (North).
        // Rotation +Y is CCW. +Z -> +X.
        // So 0=N, 90=W (Left turn), -90=E (Right turn).
        // If I turn Left (+90), I face West.
        // 'W' is at index 6 (N=0, NE=1... W=6).
        // 6 * 45 = 270 deg in list?
        // Wait, standard compass list is Clockwise? N -> E -> S -> W.
        // List above: N, NE, E... that is Clockwise.
        // If I turn Left (CCW), I should see West.
        // But West is at end of list (Clockwise from N).
        // So if I turn Left (+Yaw), I go "Backwards" in the compass tape?
        // Or does the tape move Left/Right?
        // If I turn Left, the world moves Right.
        // So 'W' (which is "Left" of N in world) should slide into view from Left?
        // No, 'W' is "Left" of N.
        // If I hold a compass tape: W -- N -- E.
        // If I turn Left, I look at W. The tape slides Right.
        // My list: N, NE, E... This is N -> Right -> E.
        // So the list represents "Rightward" directions.
        // So Leftward directions are to the left of N.
        // W is at -90 (or 270).
        // So if I turn Left (+90), I want to see -90 offset.
        // offset = deg * pixelsPerDeg?

        // Let's rely on standard: Heading increases CW?
        // ThreeJS +Y is CCW.
        // So Heading = -Yaw.
        // If Yaw=90 (Left), Heading=270 (West).
        // We want to show 270.
        // 270 corresponds to 'W' (index 6).
        // 6 * 45 = 270.
        // So Pixel Offset = 270 * 3.0?

        // The strip moves such that the target degree is at center.
        // Center position = - (startOffset + (heading * pixelsPerDeg)).
        // But we need to check if List is CW or CCW.
        // List: N, NE, E... (CW).
        // If Heading increases CW (N->E), we move further down the list.
        // So we slide strip Left (negative translateX).

        // So:
        // Heading (CW) = -deg (since deg is CCW).
        // Normalize Heading 0-360.

        let heading = -deg;
        if (heading < 0) heading += 360;

        // Now heading 0=N, 90=E, 180=S, 270=W.
        // List aligns with this (N=0, E=2, etc).
        // index = heading / 45.
        // offset in pixels = heading * (markerWidth / 45).

        const pxPerHeading = this.markerWidth / 45.0;
        const currentOffset = heading * pxPerHeading;

        // Total transform
        // We shift by startOffset (to center the 2nd cycle N)
        // Then shift by currentOffset.
        // We align center of 'N' to center of container.
        // 'N' element width is markerWidth. center is markerWidth/2.
        // But we want 'N' to be at 0 relative to center line.
        // CSS: left: 50%. translateX(-50%).
        // Inside strip:
        // [Cycle0][Cycle1][Cycle2]
        // We want Cycle1 N (index 0 relative to Cycle1) to be at x=0 if heading=0.
        // But Flexbox flows L->R.
        // Cycle 1 starts at x = Cycle0_Width.
        // We want Cycle1_Start + (ItemWidth/2) to be at 0?
        // No, we want the CENTER of the N item to be at the Center of the Container.

        // Let Cycle0_Width = 8 * markerWidth.
        // Target X = - (Cycle0_Width + currentOffset) + (markerWidth / 2)?
        // Wait, simpler:
        // Render: [N][NE]...
        // At heading 0, we want N centered.
        // N is the first item of Cycle 1.
        // Its center is at `Cycle0_Width + markerWidth/2`.
        // So we translate strip by `- (Cycle0_Width + markerWidth/2)`.

        const baseShift = (8 * this.markerWidth) + (this.markerWidth / 2);
        const totalShift = baseShift + currentOffset;

        // Apply
        // We need to center the strip element itself?
        // CSS: .compass-strip { left: 50%; transform: translateX(...) }
        // The value in translateX should be relative to the strip's own origin (left edge).
        // So translateX(-totalShift px).

        // Refinement: Wrapping.
        // If we rotate too much, we jump cycles?
        // No, currentOffset is 0-360 mapped. It stays within Cycle 1.
        // We always render Cycle 1.
        // Since we have Cycle 0 and Cycle 2, we have buffer.

        this.strip.style.transform = `translateX(-${totalShift}px)`;
    }
}
