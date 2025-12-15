import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class WaterTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'waterTower';
        this._time = Math.random() * Math.PI * 2;
        this._beaconMaterial = null;
        this._swayAmplitude = (params.swayAmplitude ?? 0.02) + Math.random() * 0.01;
    }

    static get displayName() { return 'Water Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const towerHeight = params.towerHeight || 10 + Math.random() * 4;
        const tankRadius = params.tankRadius || 2.4 + Math.random() * 0.6;
        const tankHeight = params.tankHeight || 4.5 + Math.random();
        const legSpread = params.legSpread || tankRadius * 1.2;
        const legThickness = params.legThickness || 0.25;
        const legCount = 4;

        this.params.towerHeight = towerHeight;
        this.params.tankRadius = tankRadius;
        this.params.tankHeight = tankHeight;
        this.params.legSpread = legSpread;
        this.params.legThickness = legThickness;
        this.params.swayAmplitude = this._swayAmplitude;

        const steelColor = 0x666a70;
        const tankColor = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.25, 0.55);

        const steelMat = new THREE.MeshStandardMaterial({ color: steelColor, roughness: 0.5, metalness: 0.6 });
        const tankMat = new THREE.MeshStandardMaterial({ color: tankColor, roughness: 0.35, metalness: 0.25 });

        // Legs
        for (let i = 0; i < legCount; i++) {
            const angle = (i / legCount) * Math.PI * 2;
            const x = Math.cos(angle) * legSpread;
            const z = Math.sin(angle) * legSpread;
            const legGeo = new THREE.CylinderGeometry(legThickness * 0.85, legThickness, towerHeight, 8);
            const leg = new THREE.Mesh(legGeo, steelMat);
            leg.position.set(x, towerHeight / 2, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        }

        // Cross braces
        const braceGeo = new THREE.BoxGeometry(legSpread * 1.6, legThickness * 0.6, legThickness * 0.6);
        const braceCount = 3;
        for (let i = 0; i < braceCount; i++) {
            const brace = new THREE.Mesh(braceGeo, steelMat);
            brace.position.y = (towerHeight * 0.25) + (i * (towerHeight / braceCount));
            brace.rotation.y = (i % 2 === 0) ? 0 : Math.PI / 2;
            brace.castShadow = true;
            brace.receiveShadow = true;
            group.add(brace);
        }

        // Platform
        const platformThickness = 0.3;
        const platformGeo = new THREE.CylinderGeometry(legSpread * 1.2, legSpread * 1.2, platformThickness, 16);
        const platform = new THREE.Mesh(platformGeo, steelMat);
        platform.position.y = towerHeight + platformThickness / 2;
        platform.castShadow = true;
        platform.receiveShadow = true;
        group.add(platform);

        // Tank body
        const tankGeo = new THREE.CylinderGeometry(tankRadius * 1.02, tankRadius * 1.08, tankHeight, 24, 1, false);
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.y = platform.position.y + tankHeight / 2 + 0.05;
        tank.castShadow = true;
        tank.receiveShadow = true;
        group.add(tank);

        // Ribs around the tank
        const ribGeo = new THREE.TorusGeometry(tankRadius * 1.05, 0.08, 8, 32);
        for (let i = 0; i < 3; i++) {
            const rib = new THREE.Mesh(ribGeo, steelMat);
            rib.rotation.x = Math.PI / 2;
            rib.position.y = tank.position.y - tankHeight / 2 + (i + 1) * (tankHeight / 4);
            rib.castShadow = true;
            rib.receiveShadow = true;
            group.add(rib);
        }

        // Tank roof
        const roofGeo = new THREE.ConeGeometry(tankRadius * 1.1, tankHeight * 0.4, 20);
        const roof = new THREE.Mesh(roofGeo, steelMat);
        roof.position.y = tank.position.y + tankHeight / 2 + (tankHeight * 0.2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        // Ladder
        const ladderHeight = towerHeight + tankHeight;
        const ladderGeo = new THREE.BoxGeometry(legThickness * 0.5, ladderHeight, legThickness * 0.3);
        const ladder = new THREE.Mesh(ladderGeo, steelMat);
        ladder.position.set(legSpread * 1.05, ladderHeight / 2, 0);
        ladder.castShadow = true;
        ladder.receiveShadow = true;
        group.add(ladder);

        // Beacon
        const beaconGeo = new THREE.SphereGeometry(0.25, 12, 12);
        this._beaconMaterial = new THREE.MeshStandardMaterial({
            color: 0xff3355,
            emissive: new THREE.Color(0xff3355),
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.1
        });
        const beacon = new THREE.Mesh(beaconGeo, this._beaconMaterial);
        beacon.position.set(0, roof.position.y + (tankHeight * 0.2) + 0.35, 0);
        beacon.castShadow = true;
        group.add(beacon);

        // Access hatch detail
        const hatchGeo = new THREE.CylinderGeometry(legThickness * 0.7, legThickness * 0.7, 0.4, 12);
        const hatch = new THREE.Mesh(hatchGeo, steelMat);
        hatch.position.set(-tankRadius * 0.6, tank.position.y + tankHeight / 4, tankRadius * 0.85);
        hatch.rotation.x = Math.PI / 2;
        hatch.castShadow = true;
        hatch.receiveShadow = true;
        group.add(hatch);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;
        const sway = Math.sin(this._time * 0.8 + (this.params.seed || 0)) * this._swayAmplitude;
        this.mesh.rotation.z = sway;

        if (this._beaconMaterial) {
            const pulse = 0.3 + 0.2 * Math.sin(this._time * 3.5);
            this._beaconMaterial.emissiveIntensity = 0.6 + pulse;
        }
    }
}

EntityRegistry.register('waterTower', WaterTowerEntity);
