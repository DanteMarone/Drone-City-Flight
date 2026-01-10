// src/world/generation.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { EntityRegistry } from './entities/index.js';

export class DistrictGenerator {
    constructor(scene, colliderSystem) {
        this.scene = scene;
        this.colliderSystem = colliderSystem;
    }

    generateCityLayout() {
        const colliders = [];
        colliders.push(...this._generateDistrict(0, 0, 'downtown'));
        colliders.push(...this._generateDistrict(1, 0, 'commercial'));
        colliders.push(...this._generateDistrict(-1, 0, 'suburbs'));
        this._generateRoads();
        return colliders;
    }

    _generateDistrict(gridX, gridZ, type) {
        const generated = [];
        const zoneSize = 200;
        const startX = gridX * zoneSize;
        const startZ = gridZ * zoneSize;

        const blockSize = type === 'downtown' ? 24 : (type === 'commercial' ? 30 : 18);
        const streetWidth = type === 'downtown' ? 12 : (type === 'commercial' ? 15 : 10);
        const spacing = blockSize + streetWidth;

        const count = Math.floor(zoneSize / spacing);
        const offset = -zoneSize / 2 + spacing / 2;

        for (let ix = 0; ix < count; ix++) {
            for (let iz = 0; iz < count; iz++) {
                const wx = startX + offset + ix * spacing;
                const wz = startZ + offset + iz * spacing;

                if (Math.abs(wx) < 20 && Math.abs(wz) < 20) continue;

                let entity = null;
                if (type === 'downtown') {
                    entity = EntityRegistry.create('skyscraper', { x: wx, z: wz, width: blockSize });
                } else if (type === 'commercial') {
                    entity = EntityRegistry.create('shop', { x: wx, z: wz, width: blockSize });
                } else if (type === 'suburbs') {
                    entity = EntityRegistry.create('house', { x: wx, z: wz, width: blockSize });
                }

                if (entity && entity.mesh) {
                    this.scene.add(entity.mesh);
                    generated.push(entity);
                }
            }
        }
        return generated;
    }

    _generateRoads() {
        // Original was one big plane. Let's keep it simple or recreate as big plane via factory?
        // Factory makes segments.
        // For compatibility with old look, we can just make a big plane manually or add a createLargeRoad method.
        // Or just use the factory to make a huge road.
        const road = EntityRegistry.create('road', { x: 0, z: 0, width: 600, length: 200 });
        if (road && road.mesh) {
            this.scene.add(road.mesh);
        }
    }
}
