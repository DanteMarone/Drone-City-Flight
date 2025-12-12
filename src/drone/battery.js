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

        const conf = CONFIG.BATTERY;
        let drain = 0;

        // Spec 3.4.2 Logic
        // Hovering drains 0 when no translation and no altitude change.
        // We approximate "no change" by checking input or velocity?
        // Spec says "no translation and no altitude change".
        // Let's use Input for intention + Velocity for effort.

        // Actually, simple rule:
        // Horizontal Move
        const hSpeed = Math.sqrt(droneVelocity.x**2 + droneVelocity.z**2);
        if (hSpeed > 0.1) {
            drain += conf.DRAIN_MOVE * (hSpeed / CONFIG.DRONE.MAX_SPEED) * dt;
        }

        // Ascend/Descend
        // Input y > 0 ascend, < 0 descend
        if (input.y > 0) {
            drain += conf.DRAIN_ASCEND * dt;
        } else if (input.y < 0) {
            drain += conf.DRAIN_DESCEND * dt;
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
