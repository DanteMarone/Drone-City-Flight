// src/person/life.js
import { CONFIG } from '../config.js';

export class LifeManager {
    constructor() {
        this.max = CONFIG.PERSON.LIFE_MAX;
        this.current = this.max;
    }

    reset() {
        this.current = this.max;
    }

    add(amount) {
        this.current = Math.min(this.max, this.current + amount);
    }

    damage(amount) {
        this.current = Math.max(0, this.current - amount);
    }

    get depleted() {
        return this.current <= 0;
    }
}
