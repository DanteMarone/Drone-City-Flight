import * as THREE from 'three';
import { strict as assert } from 'assert';
import { TrafficLightEntity } from './trafficLight.js';

// Test Helper (Minimal runner)
function describe(name, fn) {
    console.log(`\n🔍 Testing: ${name}`);
    try {
        fn();
    } catch (e) {
        console.error(`❌ Suite failed: ${name}`);
        console.error(e);
        process.exit(1);
    }
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
    } catch (e) {
        console.error(`  ❌ ${name}`);
        console.error(e);
        throw e;
    }
}

// -----------------------------------------------------------------------------
// Suite: TrafficLightEntity
// -----------------------------------------------------------------------------
describe('TrafficLightEntity', () => {

    it('should initialize with default values', () => {
        const trafficLight = new TrafficLightEntity();
        assert.equal(trafficLight.type, 'trafficLight');
        assert.ok(trafficLight._lightMaterials instanceof Array, 'Should have light materials array');
        assert.equal(trafficLight._phaseIndex, 0, 'Should start at phase 0');
    });

    it('should create mesh and materials on init', () => {
        const trafficLight = new TrafficLightEntity();
        trafficLight.init();

        assert.ok(trafficLight.mesh, 'Mesh should be created');
        assert.ok(trafficLight.box, 'Collider box should be created');

        // Traffic light creates 3 light materials
        assert.equal(trafficLight._lightMaterials.length, 3, 'Should have 3 light materials');

        // Check colors
        const colors = [0xff3b30, 0xffd60a, 0x34c759]; // Red, Yellow, Green (in order of pushing? No, let's check order in code)
        // Code pushes loop 0..2
        // i=0: color[0]=Red. position y high.
        // i=1: color[1]=Yellow. position y mid.
        // i=2: color[2]=Green. position y low.

        for(let i=0; i<3; i++) {
             assert.equal(trafficLight._lightMaterials[i].color.getHex(), colors[i], `Material ${i} color matches`);
        }
    });

    it('should cycle phases correctly over time', () => {
        const trafficLight = new TrafficLightEntity();
        trafficLight.init();

        // Reset random start time to known state for testing
        trafficLight._time = 0;
        trafficLight._phaseIndex = 0; // Phase 0 is Green in code?
        // Code: PHASES = [{name:'green', duration:4.2}, {name:'yellow', duration:1.2}, {name:'red', duration:4.2}]
        // Index 0 is Green.

        const phase0Duration = 4.2;

        // Advance time by slightly less than duration
        trafficLight.update(phase0Duration - 0.1);
        assert.equal(trafficLight._phaseIndex, 0, 'Should still be in Phase 0 (Green)');

        // Advance past duration
        trafficLight.update(0.2);
        assert.equal(trafficLight._phaseIndex, 1, 'Should switch to Phase 1 (Yellow)');

        // Reset internal time check
        // The update logic sets _time = 0 when switching.
        // We advanced 4.1. Then 0.2. Total 4.3.
        // 4.1 -> update(0.2) -> _time becomes 4.3 -> triggers switch -> _time=0 -> phase=1.
        // So _time is now 0.

        const phase1Duration = 1.2;
        trafficLight.update(phase1Duration + 0.1);
        assert.equal(trafficLight._phaseIndex, 2, 'Should switch to Phase 2 (Red)');
    });

    it('should update emissive intensity', () => {
        const trafficLight = new TrafficLightEntity();
        trafficLight.init();

        // Force state
        trafficLight._time = 0;
        trafficLight._phaseIndex = 0; // Green

        // Phase 0 (Green) has activeIndex: 2 (Green light material)
        // PHASES[0] = { activeIndex: 2 }
        // materials[2] is Green.

        // Initial intensities are 0.25
        assert.equal(trafficLight._lightMaterials[2].emissiveIntensity, 0.25);

        // Update a bit
        trafficLight.update(0.1);

        // Should be lerping towards 2.2 for active, 0.25 for inactive
        // active (2) should increase
        assert.ok(trafficLight._lightMaterials[2].emissiveIntensity > 0.25, 'Green light should brighten');

        // inactive (0 - Red) should stay/go to 0.25
        assert.ok(Math.abs(trafficLight._lightMaterials[0].emissiveIntensity - 0.25) < 0.01, 'Red light should stay dim');
    });

    it('should handle large dt without crashing', () => {
        const trafficLight = new TrafficLightEntity();
        trafficLight.init();

        // Very large DT
        trafficLight.update(100.0);

        // Should have cycled but just resets time and increments phase by 1
        // Code: if (time >= duration) { time=0; phase++ }
        // It does NOT loop multiple times in one frame.
        // So phase should increment by exactly 1.

        // We can assert this behavior (even if suboptimal, it is the current behavior)
        const startPhase = trafficLight._phaseIndex;
        // Re-init to clear random
        trafficLight._phaseIndex = 0;
        trafficLight._time = 0;

        trafficLight.update(100.0);
        assert.equal(trafficLight._phaseIndex, 1, 'Should increment phase by 1 even with huge dt');
        assert.equal(trafficLight._time, 0, 'Time should reset to 0');
    });

});
