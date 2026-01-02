// src/person/life.js
import { CONFIG } from '../config.js';

export class LifeManager {
    constructor() {
        this.max = CONFIG.PERSON.MAX_LIFE;
        this.current = CONFIG.PERSON.MAX_LIFE;
        this.depleted = false;
    }

    applyDamage(amount) {
        this.current = Math.max(0, this.current - amount);
        if (this.current === 0) {
            this.depleted = true;
        }
    }

    heal(amount) {
        this.current = Math.min(this.max, this.current + amount);
        if (this.current > 0) {
            this.depleted = false;
        }
    }

    reset() {
        this.current = this.max;
        this.depleted = false;
    }
}
