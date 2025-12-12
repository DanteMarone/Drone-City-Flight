// src/world/generation.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class DistrictGenerator {
    constructor(scene, colliderSystem) {
        this.scene = scene;
        this.colliderSystem = colliderSystem;
        this.materials = {
            downtown: new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.2 }),
            commercial: new THREE.MeshStandardMaterial({ color: 0x998877, roughness: 0.5 }),
            suburbWall: new THREE.MeshStandardMaterial({ color: 0xffffee }),
            suburbRoof: new THREE.MeshStandardMaterial({ color: 0xaa5544 }),
            road: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }),
            grass: new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 1.0 })
        };

        this.geometries = {
            box: new THREE.BoxGeometry(1, 1, 1),
            roof: new THREE.ConeGeometry(0.75, 0.5, 4) // simple pyramid roof
        };
    }

    generateCityLayout() {
        const colliders = [];
        const chunkSize = 200; // Size of a district zone

        // Layout:
        // Center (0,0): Downtown
        // East (+X): Commercial
        // West (-X): Suburbs

        // 1. Downtown (Grid of skyscrapers)
        colliders.push(...this._generateDistrict(0, 0, 'downtown'));

        // 2. Commercial (Warehouses/Shops)
        colliders.push(...this._generateDistrict(1, 0, 'commercial'));

        // 3. Suburbs (Houses)
        colliders.push(...this._generateDistrict(-1, 0, 'suburbs'));

        // 4. Roads (Simple grid connecting them)
        this._generateRoads();

        return colliders;
    }

    _generateDistrict(gridX, gridZ, type) {
        const generated = [];
        const zoneSize = 200; // meter
        const startX = gridX * zoneSize;
        const startZ = gridZ * zoneSize;

        const blockSize = type === 'downtown' ? 24 : (type === 'commercial' ? 30 : 18);
        const streetWidth = type === 'downtown' ? 12 : (type === 'commercial' ? 15 : 10);
        const spacing = blockSize + streetWidth;

        const count = Math.floor(zoneSize / spacing);
        const offset = -zoneSize / 2 + spacing / 2;

        for (let ix = 0; ix < count; ix++) {
            for (let iz = 0; iz < count; iz++) {
                // World Coords
                const wx = startX + offset + ix * spacing;
                const wz = startZ + offset + iz * spacing;

                // Safe zone at 0,0 for takeoff
                if (Math.abs(wx) < 20 && Math.abs(wz) < 20) continue;

                if (type === 'downtown') {
                    generated.push(this._createSkyscraper(wx, wz, blockSize));
                } else if (type === 'commercial') {
                    generated.push(this._createShop(wx, wz, blockSize));
                } else if (type === 'suburbs') {
                    generated.push(this._createHouse(wx, wz, blockSize));
                }
            }
        }
        return generated;
    }

    _createSkyscraper(x, z, width) {
        const height = 20 + Math.random() * 60;
        const mesh = new THREE.Mesh(this.geometries.box, this.materials.downtown);
        mesh.position.set(x, height / 2, z);
        mesh.scale.set(width, height, width);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        return this._makeCollider(mesh);
    }

    _createShop(x, z, width) {
        const height = 6 + Math.random() * 8;
        const mesh = new THREE.Mesh(this.geometries.box, this.materials.commercial);
        // Wider than tall
        const w = width * (0.8 + Math.random() * 0.4);
        const d = width * (0.8 + Math.random() * 0.4);

        mesh.position.set(x, height / 2, z);
        mesh.scale.set(w, height, d);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        return this._makeCollider(mesh);
    }

    _createHouse(x, z, width) {
        // Group for house
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Lawn
        const lawnSize = width;
        const lawn = new THREE.Mesh(this.geometries.box, this.materials.grass);
        lawn.scale.set(lawnSize, 0.2, lawnSize);
        lawn.position.y = 0.1;
        lawn.receiveShadow = true;
        this.scene.add(lawn); // Add lawn directly to scene or group?
        // Note: Colliders usually expect simple meshes.
        // For the collider, we'll just collide with the house structure.

        // House Body
        const hWidth = width * 0.5;
        const hHeight = 4 + Math.random() * 2;
        const body = new THREE.Mesh(this.geometries.box, this.materials.suburbWall);
        body.scale.set(hWidth, hHeight, hWidth);
        body.position.y = hHeight / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Roof
        const roof = new THREE.Mesh(this.geometries.roof, this.materials.suburbRoof);
        roof.scale.set(hWidth * 1.2, hHeight * 0.5, hWidth * 1.2);
        roof.position.y = hHeight + (hHeight * 0.25);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);

        this.scene.add(group);

        // Approximation for collision: Just the body box, maybe slightly taller to cover roof
        // We use the 'body' mesh for collider, as 'group' includes lawn.
        // We need to ensure 'body' world matrix is up to date since it's inside group but group is added to scene?
        // Actually group is added to scene, but body is child.
        // setFromObject(body) will use world coords if world matrix updated.
        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(body);

        // Expand box upwards slightly to cover roof
        box.max.y += hHeight * 0.5;

        return { mesh: group, box };
    }

    _generateRoads() {
        // Just big planes for now to cover the "street" areas beneath the grid
        // 3 Zones * 200 = 600 width.
        const roadPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(600, 200),
            this.materials.road
        );
        roadPlane.rotation.x = -Math.PI / 2;
        roadPlane.position.y = 0.05; // Just above ground
        roadPlane.receiveShadow = true;
        this.scene.add(roadPlane);
    }

    _makeCollider(mesh) {
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        return { mesh, box };
    }
}
