import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class WaterTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'waterTower';
        this._time = 0;
        this._swayTarget = new THREE.Group();
    }

    static get displayName() { return 'Rooftop Water Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const seed = params.seed || Math.random() * 1000;
        const towerHeight = params.towerHeight || 6 + Math.random() * 3;
        const tankRadius = params.tankRadius || 1.4 + Math.random() * 0.4;
        const legHeight = params.legHeight || 3 + Math.random() * 1.2;
        const woodColor = new THREE.Color(0x8b6b46).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
        const metalColor = new THREE.Color(0x9da3ad).offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);

        this.params.seed = seed;
        this.params.towerHeight = towerHeight;
        this.params.tankRadius = tankRadius;
        this.params.legHeight = legHeight;

        // Support legs
        const legGeo = new THREE.CylinderGeometry(0.1, 0.13, legHeight, 10);
        const legMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.7, metalness: 0.05 });
        const legOffset = tankRadius * 0.9;
        const legPositions = [
            [legOffset, 0, legOffset],
            [-legOffset, 0, legOffset],
            [legOffset, 0, -legOffset],
            [-legOffset, 0, -legOffset]
        ];
        legPositions.forEach(([x, y, z]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(x, legHeight / 2, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        });

        // Cross braces
        const braceMat = new THREE.MeshStandardMaterial({ color: woodColor.clone().offsetHSL(0, 0, -0.1), roughness: 0.75, metalness: 0.05 });
        const braceGeo = new THREE.BoxGeometry(legOffset * 2, 0.08, 0.16);
        const brace1 = new THREE.Mesh(braceGeo, braceMat);
        brace1.position.set(0, legHeight * 0.4, 0);
        brace1.castShadow = true;
        brace1.receiveShadow = true;
        group.add(brace1);

        const brace2 = brace1.clone();
        brace2.rotation.y = Math.PI / 2;
        group.add(brace2);

        // Tank container
        const tankMat = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.3, metalness: 0.65 });
        const tankGeo = new THREE.CylinderGeometry(tankRadius * 1.05, tankRadius * 0.95, towerHeight, 24, 1, true);
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.y = legHeight + towerHeight / 2;
        tank.castShadow = true;
        tank.receiveShadow = true;
        this._swayTarget.add(tank);

        // Tank bands
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x5c6a78, roughness: 0.4, metalness: 0.7 });
        const bandGeo = new THREE.TorusGeometry(tankRadius, 0.06, 10, 32);
        const bandCount = 3;
        for (let i = 0; i < bandCount; i++) {
            const band = new THREE.Mesh(bandGeo, bandMat);
            band.rotation.x = Math.PI / 2;
            band.position.y = tank.position.y + towerHeight * (i / (bandCount - 1) - 0.5);
            band.castShadow = true;
            band.receiveShadow = true;
            this._swayTarget.add(band);
        }

        // Conical roof
        const roofMat = new THREE.MeshStandardMaterial({ color: woodColor.clone().offsetHSL(0, 0, 0.08), roughness: 0.6, metalness: 0.15 });
        const roofGeo = new THREE.ConeGeometry(tankRadius * 1.05, tankRadius * 0.9, 24);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = legHeight + towerHeight + roofGeo.parameters.height / 2;
        roof.castShadow = true;
        roof.receiveShadow = true;
        this._swayTarget.add(roof);

        // Fill pipe
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x3b4854, roughness: 0.35, metalness: 0.85 });
        const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, legHeight + towerHeight * 0.6, 12);
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(-legOffset * 0.6, (legHeight + tank.position.y) / 2, tankRadius + 0.1);
        pipe.castShadow = true;
        pipe.receiveShadow = true;
        group.add(pipe);

        // Ladder
        const ladder = new THREE.Group();
        const rungCount = 8;
        const rungSpacing = (legHeight + towerHeight * 0.7) / (rungCount - 1);
        const rungGeo = new THREE.BoxGeometry(0.04, 0.02, tankRadius * 0.8);
        const railGeo = new THREE.BoxGeometry(0.04, legHeight + towerHeight * 0.7, 0.04);
        const ladderMat = new THREE.MeshStandardMaterial({ color: metalColor.clone().offsetHSL(0, 0, -0.05), roughness: 0.45, metalness: 0.7 });

        const railLeft = new THREE.Mesh(railGeo, ladderMat);
        railLeft.position.set(tankRadius + 0.12, (railGeo.parameters.height) / 2, -tankRadius * 0.4);
        const railRight = railLeft.clone();
        railRight.position.z *= -1;
        ladder.add(railLeft, railRight);

        for (let i = 0; i < rungCount; i++) {
            const rung = new THREE.Mesh(rungGeo, ladderMat);
            rung.position.set(tankRadius + 0.12, 0.1 + i * rungSpacing, 0);
            rung.castShadow = true;
            rung.receiveShadow = true;
            ladder.add(rung);
        }

        ladder.rotation.y = Math.PI / 4;
        ladder.castShadow = true;
        group.add(ladder);

        // Elevate sway target to sit on legs
        this._swayTarget.position.y = 0;
        group.add(this._swayTarget);

        return group;
    }

    update(dt) {
        this._time += dt;
        const sway = Math.sin(this._time * 0.8 + this.params.seed) * 0.02;
        this._swayTarget.rotation.z = sway;
        this._swayTarget.position.x = Math.sin(this._time * 0.6 + this.params.seed * 0.5) * 0.05;
    }
}

EntityRegistry.register('waterTower', WaterTowerEntity);
