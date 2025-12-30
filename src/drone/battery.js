// src/drone/battery.js
import { CONFIG } from '../config.js';

export class BatteryManager {
    constructor() {
        this.current = CONFIG.BATTERY.MAX;
        this.max = CONFIG.BATTERY.MAX;
        this.depleted = false;
    }

    update(dt, droneVelocity, input) {
        if (this.depleted) return;

        let drainRate = CONFIG.BATTERY.DRAIN_RATE;
        // Use World setting if available
        if (window.app && window.app.world && window.app.world.batteryDrain !== undefined) {
            drainRate = window.app.world.batteryDrain;
        }

        let drain = 0;
        // Calculate total speed magnitude (3D)
        const speed = droneVelocity.length();

        // Unified drain logic:
        // Moving in any direction (Speed > threshold) causes drain.
        // Rotation and hovering (Speed ~ 0) causes no drain.
        if (speed > 0.1) {
            drain = drainRate * dt;
        }

        this.current -= drain;

        if (this.current <= 0) {
            this.current = 0;
            this.depleted = true;
        }
    }

    add(amount) {
        this.current = Math.min(this.max, this.current + amount);
        // If revived from depleted?
        if (this.current > 0) this.depleted = false;
    }

    reset() {
        this.current = this.max;
        this.depleted = false;
    }
}
