// src/drone/battery.js
import { CONFIG } from '../config.js';

export class BatteryManager {
    constructor() {
        this.current = CONFIG.BATTERY.MAX;
        this.max = CONFIG.BATTERY.MAX;
        this.depleted = false;

        // Dynamic configuration
        this.drainRates = {
            move: CONFIG.BATTERY.DRAIN_MOVE,
            ascend: CONFIG.BATTERY.DRAIN_ASCEND,
            descend: CONFIG.BATTERY.DRAIN_DESCEND,
            idle: CONFIG.BATTERY.DRAIN_IDLE
        };
    }

    configure(max, baseDrainRate) {
        this.max = max;
        // If a baseDrainRate is provided, we scale or set the move/ascend/descend rates.
        // Assuming the user wants 'baseDrainRate' to be the standard consumption for movement.
        if (baseDrainRate !== undefined) {
            this.drainRates.move = baseDrainRate;
            this.drainRates.ascend = baseDrainRate;
            this.drainRates.descend = baseDrainRate;
            // Idle usually is a fraction, let's keep it low or proportional?
            // If user sets 1.0, idle 0.1 is fine. If user sets 10.0, idle 1.0.
            this.drainRates.idle = baseDrainRate * 0.1;
        }

        // Clamp current if needed (though usually we reset after configure)
        this.current = Math.min(this.current, this.max);
    }

    update(dt, droneVelocity, input) {
        if (this.depleted) return;

        let drain = 0;
        let active = false;

        // Horizontal Move
        const hSpeed = Math.sqrt(droneVelocity.x**2 + droneVelocity.z**2);
        if (hSpeed > 0.1) {
            drain += this.drainRates.move * (hSpeed / CONFIG.DRONE.MAX_SPEED) * dt;
            active = true;
        }

        // Ascend/Descend
        if (input.y > 0) {
            drain += this.drainRates.ascend * dt;
            active = true;
        } else if (input.y < 0) {
            drain += this.drainRates.descend * dt;
            active = true;
        }

        // Idle Drain
        if (!active) {
            drain += this.drainRates.idle * dt;
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
