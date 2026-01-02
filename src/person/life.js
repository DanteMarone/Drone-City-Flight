import { CONFIG } from '../config.js';

export class LifeManager {
    constructor() {
        this.max = CONFIG.LIFE.MAX;
        this.current = this.max;
    }

    applyDamage(amount) {
        this.current = Math.max(0, this.current - amount);
    }

    heal(amount) {
        this.current = Math.min(this.max, this.current + amount);
    }

    reset() {
        this.current = this.max;
    }
}
