
// Mock THREE
const THREE = {
    MathUtils: {
        lerp: (x, y, t) => x + (y - x) * t
    }
};

const PHASES = [
    { name: 'green', duration: 4.2, activeIndex: 2 },
    { name: 'yellow', duration: 1.2, activeIndex: 1 },
    { name: 'red', duration: 4.2, activeIndex: 0 }
];

class TrafficLightLogic {
    constructor() {
        this._time = Math.random() * 2;
        this._phaseIndex = 0;
        this._lightMaterials = [];

        for (let i = 0; i < 3; i++) {
            this._lightMaterials.push({
                emissiveIntensity: 0.25,
                _setCount: 0
            });
        }
    }

    update(dt) {
        this._time += dt;
        const phase = PHASES[this._phaseIndex];
        if (this._time >= phase.duration) {
            this._time = 0;
            this._phaseIndex = (this._phaseIndex + 1) % PHASES.length;
        }

        const activeIndex = PHASES[this._phaseIndex].activeIndex;

        this._lightMaterials.forEach((material, index) => {
            const target = index === activeIndex ? 2.2 : 0.25;
            const newVal = THREE.MathUtils.lerp(material.emissiveIntensity, target, dt * 6);
            material.emissiveIntensity = newVal;
            material._setCount++;
        });
    }
}

class OptimizedTrafficLightLogic {
    constructor() {
        this._time = Math.random() * 2;
        this._phaseIndex = 0;
        this._lightMaterials = [];

        for (let i = 0; i < 3; i++) {
            this._lightMaterials.push({
                emissiveIntensity: 0.25,
                _setCount: 0
            });
        }
    }

    update(dt) {
        this._time += dt;
        const phase = PHASES[this._phaseIndex];
        if (this._time >= phase.duration) {
            this._time = 0;
            this._phaseIndex = (this._phaseIndex + 1) % PHASES.length;
        }

        const activeIndex = PHASES[this._phaseIndex].activeIndex;

        // Optimized: for loop + dirty check
        const len = this._lightMaterials.length;
        for (let i = 0; i < len; i++) {
            const material = this._lightMaterials[i];
            const target = i === activeIndex ? 2.2 : 0.25;

            // Check if already close enough
            if (Math.abs(material.emissiveIntensity - target) < 0.01) {
                if (material.emissiveIntensity !== target) {
                    material.emissiveIntensity = target;
                    material._setCount++;
                }
                continue;
            }

            const newVal = THREE.MathUtils.lerp(material.emissiveIntensity, target, dt * 6);
            material.emissiveIntensity = newVal;
            material._setCount++;
        }
    }
}

function runBenchmark() {
    const count = 1000;
    const frames = 600; // 10 seconds at 60fps
    const dt = 0.016;

    // Baseline
    {
        const lights = [];
        for (let i = 0; i < count; i++) lights.push(new TrafficLightLogic());

        const start = performance.now();
        for (let f = 0; f < frames; f++) {
            for (let i = 0; i < count; i++) lights[i].update(dt);
        }
        const end = performance.now();

        let totalAssignments = 0;
        lights.forEach(l => l._lightMaterials.forEach(m => totalAssignments += m._setCount));

        console.log(`[Baseline] Time: ${(end - start).toFixed(2)}ms, Assignments: ${totalAssignments.toLocaleString()}`);
    }

    // Optimized
    {
        const lights = [];
        for (let i = 0; i < count; i++) lights.push(new OptimizedTrafficLightLogic());

        const start = performance.now();
        for (let f = 0; f < frames; f++) {
            for (let i = 0; i < count; i++) lights[i].update(dt);
        }
        const end = performance.now();

        let totalAssignments = 0;
        lights.forEach(l => l._lightMaterials.forEach(m => totalAssignments += m._setCount));

        console.log(`[Optimized] Time: ${(end - start).toFixed(2)}ms, Assignments: ${totalAssignments.toLocaleString()}`);
    }
}

runBenchmark();
