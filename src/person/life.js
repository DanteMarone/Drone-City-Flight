// src/person/life.js
export class LifeManager {
    constructor() {
        this.max = 100;
        this.current = this.max;
    }

    reset() {
        this.current = this.max;
    }

    damage(amount) {
        this.current = Math.max(0, this.current - amount);
    }

    heal(amount) {
        this.current = Math.min(this.max, this.current + amount);
    }
}
