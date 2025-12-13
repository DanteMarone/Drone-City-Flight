// src/world/factory.js
import * as THREE from 'three';
import { TextureGenerator } from '../utils/textures.js';
import { createSedanGeometry } from './carGeometries.js';

export class ObjectFactory {
    constructor(scene) {
        this.scene = scene;
        this.textureLoader = new THREE.TextureLoader();
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
            case 'orangeTree': return this.createOrangeTree(params);
            case 'bird': return this.createBird(params);
            case 'bush': return this.createBush(params);
            default: console.warn('Unknown object type:', type); return null;
        }
    }

    createBird({ x, z }) {
        const group = new THREE.Group();
        group.position.set(x, 5, z); // Start slightly elevated
        group.userData.type = 'bird';
        group.userData.startPos = new THREE.Vector3(x, 5, z);

        // Body: Cone
        const bodyGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
        bodyGeo.rotateX(Math.PI / 2); // Point forward (Z)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Wings: Two thin boxes
        const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.4);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x2255bb, roughness: 0.7 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.y = 0.1;
        wings.castShadow = true;
        group.add(wings);

        // Store reference to wings for animation if we want to grab them later
        group.userData.wings = wings;

        this.scene.add(group);

        // Simple collider (sphere approximation)
        const box = new THREE.Box3().setFromObject(group);
        return { mesh: group, box };
    }

    createBush({ x, z }) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        group.userData.type = 'bush';

        // Cluster of spheres
        const count = 5 + Math.floor(Math.random() * 5);
        const mat = new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 1.0 });

        for (let i = 0; i < count; i++) {
            const r = 0.3 + Math.random() * 0.4;
            const geo = new THREE.SphereGeometry(r, 8, 8);
            const mesh = new THREE.Mesh(geo, mat);

            // Random offset
            const ox = (Math.random() - 0.5) * 1.5;
            const oz = (Math.random() - 0.5) * 1.5;
            const oy = r * 0.8 + Math.random() * 0.5;

            mesh.position.set(ox, oy, oz);
        const tex = this.textureLoader.load('/textures/bush.png');
        tex.colorSpace = THREE.SRGBColorSpace;

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            color: 0xffffff,
            roughness: 1.0,
            side: THREE.DoubleSide
        });

        const geo = new THREE.SphereGeometry(0.5, 7, 7);
        const count = 3 + Math.floor(Math.random() * 3); // 3 to 5 spheres

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            // Random scatter relative to center
            const ox = (Math.random() - 0.5) * 1.2;
            const oz = (Math.random() - 0.5) * 1.2;
            const oy = 0.3 + Math.random() * 0.4;
            mesh.position.set(ox, oy, oz);

            const s = 0.7 + Math.random() * 0.6;
            mesh.scale.set(s, s, s);

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }

        this.scene.add(group);

        // Bushes have no collision for drone
        // No collision box
        return { mesh: group, box: null };
    }

    createOrangeTree({ x, z }) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        group.userData.type = 'orangeTree';

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1; // Center at y=1 (height 2)
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // Leaves (Sphere Top)
        const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16);

        // Load Texture
        const tex = this.textureLoader.load('/textures/orange_tree.png');
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 2);

        const leavesMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.8,
            color: 0xffffff
        });

        const leaves = new THREE.Mesh(sphereGeo, leavesMat);
        leaves.position.y = 2.5; // Top of trunk (2) + radius/intersection
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);

        this.scene.add(group);

        // Collider
        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(group);
        return { mesh: group, box };
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
        const wBase = width || 20; // Default width
        const h = height || (8 + Math.random() * 6);
        const wScale = widthScale || (0.8 + Math.random() * 0.2);
        const dScale = depthScale || (0.8 + Math.random() * 0.2);

        const w = wBase * wScale;
        const d = wBase * dScale;

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
        mesh.userData.params = { width: wBase, height: h, widthScale: wScale, depthScale: dScale };

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
        const w = width || 15; // Default width
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        group.userData.type = 'house';
        group.userData.params = { width: w };

        const wallColors = [0xffffee, 0xeeddaa, 0xddccaa, 0xffeecc];
        const roofColors = [0xaa5544, 0x555555, 0x444466];
        const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

        // Lawn
        const lawn = new THREE.Mesh(this.geometries.box, this.materials.grass);
        lawn.scale.set(w, 0.2, w);
        lawn.position.y = 0.1;
        lawn.receiveShadow = true;
        group.add(lawn);

        // Body
        const hWidth = w * 0.5;
        const hDepth = w * 0.5;
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
        return { mesh, box: null };
    }

    createRiver({ x, z, width, length }) {
        const w = width || 50;
        const l = length || 50;

        const geo = new THREE.PlaneGeometry(w, l);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            roughness: 0.1,
            metalness: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.06, z); // Above road/ground
        mesh.userData = { type: 'river' };
        mesh.userData.params = { width: w, length: l };
        this.scene.add(mesh);
        return { mesh, box: null };
    }

    createCar({ x, z }) {
        const geoData = createSedanGeometry();

        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, metalness: 0.6 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        group.add(body);
        group.add(details);

        group.position.set(x, 0, z);
        group.userData = { type: 'car' };

        this.scene.add(group);

        // Add Collider
        const box = new THREE.Box3().setFromObject(group);
        return { mesh: group, box };
    }

    _makeCollider(mesh) {
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        return { mesh, box };
    }
}
