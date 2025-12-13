// src/world/factory.js
import * as THREE from 'three';
import { TextureGenerator } from '../utils/textures.js';

export class ObjectFactory {
    constructor(scene) {
        this.scene = scene;
        this.materials = this._initMaterials();
        this.geometries = this._initGeometries();
    }

    _initMaterials() {
        const mat = {};
        mat.road = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createAsphalt(),
            roughness: 0.9,
            color: 0x555555
        });
        mat.grass = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 1.0 });
        return mat;
    }

    _initGeometries() {
        const roofPyramid = new THREE.ConeGeometry(1, 1, 4);
        roofPyramid.rotateY(Math.PI / 4);

        const roofGable = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
        roofGable.rotateZ(Math.PI / 2);
        roofGable.rotateX(-Math.PI / 2);

        return {
            box: new THREE.BoxGeometry(1, 1, 1),
            roofPyramid,
            roofGable
        };
    }

    createObject(type, params) {
        switch (type) {
            case 'skyscraper': return this.createSkyscraper(params);
            case 'shop': return this.createShop(params);
            case 'house': return this.createHouse(params);
            case 'road': return this.createRoad(params);
            default: console.warn('Unknown object type:', type); return null;
        }
    }

    createSkyscraper({ x, z, width, height, seed, isGlass: _isGlass, baseColor: _baseColor, winColor: _winColor }) {
        // Handle optional params or random if not provided
        // Use seed for deterministic variation if needed (simplified here)
        const h = height || (30 + Math.random() * 70);
        const w = width || 20;

        const isGlass = _isGlass !== undefined ? _isGlass : (Math.random() > 0.5);
        const baseColor = _baseColor || (isGlass ? '#445566' : (Math.random() > 0.5 ? '#999999' : '#bbbbbb'));
        const winColor = _winColor || (isGlass ? '#88aacc' : '#112233');

        const tex = TextureGenerator.createBuildingFacade({
            color: baseColor,
            windowColor: winColor,
            floors: Math.floor(h / 3),
            cols: Math.floor(w / 3),
            width: 256,
            height: 512
        });

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: isGlass ? 0.2 : 0.7,
            metalness: isGlass ? 0.8 : 0.1
        });

        const mesh = new THREE.Mesh(this.geometries.box, mat);
        mesh.position.set(x, h / 2, z);
        mesh.scale.set(w, h, w);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.type = 'skyscraper';
        mesh.userData.params = { width: w, height: h, isGlass, baseColor, winColor }; // Store for save

        // Roof detail (child)
        const roofRim = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        // Position relative to parent or separate?
        // Original code added separate mesh to scene.
        // Better to add as child for easier movement/serialization.
        roofRim.scale.set(1.02, 1.0/h, 1.02); // Relative scale
        roofRim.position.y = 0.5 + 0.5/h;
        // Wait, box geometry is 1,1,1 centered.
        // Mesh Y is h/2. Top is h.
        // If we add child:
        // Child pos (0, 0.5 + small, 0).
        // Let's keep it simple: Just add to scene like original,
        // BUT for Dev Mode Moving, we want a single Group or Parent.
        // Let's return a Group? Or attached children.

        // Revised approach: Return the main mesh, add details as children.
        mesh.add(roofRim);
        // Adjust roofRim local transform to match world intent
        // Parent scale is (w, h, w).
        // We want roofRim to be (w+0.5, 1, w+0.5).
        // Local scale = (w+0.5)/w, 1/h, (w+0.5)/w.
        roofRim.scale.set((w+0.5)/w, 1/h, (w+0.5)/w);
        roofRim.position.set(0, 0.5 + 0.5/h, 0);

        this.scene.add(mesh);
        return this._makeCollider(mesh);
    }

    createShop({ x, z, width, height, widthScale, depthScale }) {
        const h = height || (8 + Math.random() * 6);
        const wScale = widthScale || (0.8 + Math.random() * 0.2);
        const dScale = depthScale || (0.8 + Math.random() * 0.2);

        const w = width * wScale;
        const d = width * dScale;

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
        mesh.position.set(x, h / 2, z);
        mesh.scale.set(w, h, d);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.type = 'shop';
        mesh.userData.params = { width, height: h, widthScale: wScale, depthScale: dScale };

        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0xcc4444 })
        );
        // Original: set(x, 3, z + d/2 + 1), rot X PI/6. w+1, 0.2, 2.
        // Parent scale: w, h, d.
        // Awning world size: w+1, 0.2, 2.
        // Local scale: (w+1)/w, 0.2/h, 2/d.
        awning.scale.set((w+1)/w, 0.2/h, 2/d);
        // World pos Y=3. Local Y = (3 - h/2) / h = 3/h - 0.5.
        // World pos Z = d/2 + 1. Local Z = (d/2 + 1) / d = 0.5 + 1/d.
        awning.position.set(0, 3/h - 0.5, 0.5 + 1/d);
        awning.rotation.x = Math.PI / 6;

        mesh.add(awning);

        this.scene.add(mesh);
        return this._makeCollider(mesh);
    }

    createHouse({ x, z, width }) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        group.userData.type = 'house';
        group.userData.params = { width };

        const wallColors = [0xffffee, 0xeeddaa, 0xddccaa, 0xffeecc];
        const roofColors = [0xaa5544, 0x555555, 0x444466];
        const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

        // Lawn
        const lawn = new THREE.Mesh(this.geometries.box, this.materials.grass);
        lawn.scale.set(width, 0.2, width);
        lawn.position.y = 0.1;
        lawn.receiveShadow = true;
        group.add(lawn);

        // Body
        const hWidth = width * 0.5;
        const hDepth = width * 0.5;
        const hHeight = 3.5 + Math.random() * 1.5;

        const bodyGeo = new THREE.BoxGeometry(hWidth, hHeight, hDepth);
        bodyGeo.translate(0, hHeight/2, 0); // Pivot at bottom
        const bodyMat = new THREE.MeshStandardMaterial({ color: wallColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        // Body is strictly visual + collider source?
        // In original code, 'box' is from 'body'.
        group.add(body);

        // Roof logic (copied and adapted)
        const rHeight = hHeight * 0.4;
        const roofType = Math.random() > 0.5 ? 'pyramid' : 'gable';
        let roof;

        if (roofType === 'pyramid') {
            roof = new THREE.Mesh(this.geometries.roofPyramid, new THREE.MeshStandardMaterial({ color: roofColor }));
            const baseScale = hWidth / 1.414;
            roof.scale.set(baseScale, rHeight, baseScale);
            roof.position.y = hHeight + rHeight / 2;
        } else {
            roof = new THREE.Mesh(this.geometries.roofGable, new THREE.MeshStandardMaterial({ color: roofColor }));
            const scaleX = (hDepth * 1.2) / 1.0;
            const scaleY = rHeight / 0.75;
            const scaleZ = (hWidth * 1.0) / 0.866;
            roof.scale.set(scaleX, scaleY, scaleZ);
            if (Math.random() > 0.5) roof.rotation.y = Math.PI / 2;
            roof.position.y = hHeight + rHeight / 2;
        }
        roof.castShadow = true;
        group.add(roof);

        // Details
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2.2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x442211 })
        );
        door.position.set(0, 1.1, hDepth/2 + 0.05);
        group.add(door);

        const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.1 })
        );
        win.position.set(0, 1.8, -hDepth/2 - 0.05);
        group.add(win);

        this.scene.add(group);

        // For houses, the collider is just the body box extended up
        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(body);
        // Transform box to world space? setFromObject does that.
        box.max.y += 2;

        return { mesh: group, box };
    }

    createRoad({ x, z, width, length }) {
        // Just a segment
        const w = width || 10;
        const l = length || 10;

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, l),
            this.materials.road
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.05, z);
        mesh.receiveShadow = true;
        mesh.userData.type = 'road';
        mesh.userData.params = { width: w, length: l };

        this.scene.add(mesh);
        return { mesh, box: null }; // Roads don't have vertical collision usually? Or do they?
        // Original code: _generateRoads just added one giant plane.
        // Here we might want individual segments.
        // For collisions, we rely on the ground plane?
        // Or if we want cars to drive on them, we need waypoints, not just meshes.
        // For MVP visuals: Mesh is enough.
    }

    _makeCollider(mesh) {
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        return { mesh, box };
    }
}
