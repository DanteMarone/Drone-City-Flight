// src/world/generation.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { TextureGenerator } from '../utils/textures.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class DistrictGenerator {
    constructor(scene, colliderSystem) {
        this.scene = scene;
        this.colliderSystem = colliderSystem;

        this.materials = this._initMaterials();
        this.geometries = {
            box: new THREE.BoxGeometry(1, 1, 1),
            roof: new THREE.ConeGeometry(0.75, 0.5, 4)
        };
    }

    _initMaterials() {
        // Base materials
        const mat = {};

        // Road
        const roadTex = TextureGenerator.createAsphalt();
        mat.road = new THREE.MeshStandardMaterial({
            map: roadTex,
            roughness: 0.9,
            color: 0x555555
        });

        // Grass
        mat.grass = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 1.0 });

        // Building Textures are generated on demand to allow variety
        return mat;
    }

    generateCityLayout() {
        const colliders = [];

        // 1. Downtown (Grid of skyscrapers)
        colliders.push(...this._generateDistrict(0, 0, 'downtown'));

        // 2. Commercial (Warehouses/Shops)
        colliders.push(...this._generateDistrict(1, 0, 'commercial'));

        // 3. Suburbs (Houses)
        colliders.push(...this._generateDistrict(-1, 0, 'suburbs'));

        // 4. Roads
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
        const height = 30 + Math.random() * 70;

        // Style: Glass vs Concrete
        const isGlass = Math.random() > 0.5;
        const baseColor = isGlass ? '#445566' : (Math.random() > 0.5 ? '#999999' : '#bbbbbb');
        const winColor = isGlass ? '#88aacc' : '#112233';
        const cols = Math.floor(width / 3);
        const floors = Math.floor(height / 3);

        const tex = TextureGenerator.createBuildingFacade({
            color: baseColor,
            windowColor: winColor,
            floors: floors,
            cols: cols,
            width: 256,
            height: 512
        });

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: isGlass ? 0.2 : 0.7,
            metalness: isGlass ? 0.8 : 0.1
        });

        const mesh = new THREE.Mesh(this.geometries.box, mat);
        mesh.position.set(x, height / 2, z);
        mesh.scale.set(width, height, width);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Roof detail (AC units, rim)
        const roofRim = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.5, 1, width + 0.5),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        roofRim.position.set(x, height + 0.5, z);
        this.scene.add(roofRim);

        this.scene.add(mesh);
        return this._makeCollider(mesh);
    }

    _createShop(x, z, width) {
        const height = 8 + Math.random() * 6;
        const w = width * (0.8 + Math.random() * 0.2);
        const d = width * (0.8 + Math.random() * 0.2);

        // Storefront texture (fewer floors, big windows at bottom)
        const tex = TextureGenerator.createBuildingFacade({
            color: '#aa8866',
            windowColor: '#443322',
            floors: 3,
            cols: Math.floor(w / 4),
            width: 256,
            height: 256
        });

        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });

        const mesh = new THREE.Mesh(this.geometries.box, mat);
        mesh.position.set(x, height / 2, z);
        mesh.scale.set(w, height, d);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Awning?
        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(w + 1, 0.2, 2),
            new THREE.MeshStandardMaterial({ color: 0xcc4444 })
        );
        awning.position.set(x, 3, z + d/2 + 1);
        awning.rotation.x = Math.PI / 6;
        this.scene.add(awning);

        this.scene.add(mesh);
        return this._makeCollider(mesh);
    }

    _createHouse(x, z, width) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Colors
        const wallColors = [0xffffee, 0xeeddaa, 0xddccaa, 0xffeecc];
        const roofColors = [0xaa5544, 0x555555, 0x444466];
        const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

        // Lawn
        const lawn = new THREE.Mesh(this.geometries.box, this.materials.grass);
        lawn.scale.set(width, 0.2, width);
        lawn.position.y = 0.1;
        lawn.receiveShadow = true;
        this.scene.add(lawn);

        // House Body
        const hWidth = width * 0.5;
        const hDepth = width * 0.5;
        const hHeight = 3.5 + Math.random() * 1.5;

        const bodyGeo = new THREE.BoxGeometry(hWidth, hHeight, hDepth);
        bodyGeo.translate(0, hHeight/2, 0);
        const bodyMat = new THREE.MeshStandardMaterial({ color: wallColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Roof Type: Pyramid vs Gable
        const roofType = Math.random() > 0.5 ? 'pyramid' : 'gable';
        let roof;

        if (roofType === 'pyramid') {
            roof = new THREE.Mesh(this.geometries.roof, new THREE.MeshStandardMaterial({ color: roofColor }));
            roof.scale.set(hWidth * 1.2, hHeight * 0.6, hDepth * 1.2);
            roof.position.y = hHeight + (hHeight * 0.3); // Center of cone is mid-height
            roof.rotation.y = Math.PI / 4;
        } else {
            // Gable (Prism)
            const rGeo = new THREE.ConeGeometry(0.75, 0.5, 4); // Re-use cone but scale/rotate differently? No, Prism is cylinder 3 sides.
            // Or simple rotated box.
            // Let's use a Cylinder 3 sides (Prism)
            const prism = new THREE.CylinderGeometry(0, hWidth * 0.8, hDepth * 0.8, 3);
            // Need to rotate to align flat side down.
            // Default Cylinder is upright.
            // Not perfect. Let's just use Cone (Pyramid) for MVP or craft a prism.
            // Keeping it simple: Pyramid is fine, maybe scaled.
            // Or use BufferGeometryUtils to make a prism.

            // Just vary the pyramid scale to be flatter/wider
            roof = new THREE.Mesh(this.geometries.roof, new THREE.MeshStandardMaterial({ color: roofColor }));
            roof.scale.set(hWidth * 1.3, hHeight * 0.5, hDepth * 1.3);
            roof.position.y = hHeight + (hHeight * 0.25);
            roof.rotation.y = 0; // Aligned
        }

        roof.castShadow = true;
        group.add(roof);

        // Door
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2.2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x442211 })
        );
        door.position.set(0, 1.1, hDepth/2 + 0.05);
        group.add(door);

        // Window
        const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.1 })
        );
        win.position.set(0, 1.8, -hDepth/2 - 0.05);
        group.add(win);

        this.scene.add(group);

        // Collider: Just the main body box
        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(body);
        // Expand for roof
        box.max.y += 2;

        return { mesh: group, box };
    }

    _generateRoads() {
        const roadPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(600, 200),
            this.materials.road
        );
        roadPlane.rotation.x = -Math.PI / 2;
        roadPlane.position.y = 0.05;
        roadPlane.receiveShadow = true;
        this.scene.add(roadPlane);
    }

    _makeCollider(mesh) {
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        return { mesh, box };
    }
}
