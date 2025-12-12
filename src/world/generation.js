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
            roofPyramid: new THREE.ConeGeometry(0.75, 0.5, 4), // Pyramid
            roofGable: new THREE.CylinderGeometry(0, 0.75, 1, 3) // Prism (Triangle)
        };
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
        const isGlass = Math.random() > 0.5;
        const baseColor = isGlass ? '#445566' : (Math.random() > 0.5 ? '#999999' : '#bbbbbb');
        const winColor = isGlass ? '#88aacc' : '#112233';

        const tex = TextureGenerator.createBuildingFacade({
            color: baseColor,
            windowColor: winColor,
            floors: Math.floor(height / 3),
            cols: Math.floor(width / 3),
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

        // Roof detail
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

        // Body
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

        // Roof
        const roofType = Math.random() > 0.5 ? 'pyramid' : 'gable';
        let roof;

        if (roofType === 'pyramid') {
            roof = new THREE.Mesh(this.geometries.roofPyramid, new THREE.MeshStandardMaterial({ color: roofColor }));
            // Scale: width, height, depth.
            // Cone height is 0.5.
            const rHeight = hHeight * 0.5; // Desired visual height
            const scaleY = rHeight / 0.5; // Scale factor

            roof.scale.set(hWidth * 1.2, scaleY, hDepth * 1.2);

            // Pos Y: Top of wall + Half Roof Height (since Cone origin is center)
            roof.position.y = hHeight + (rHeight / 2);

            // Align square base (Diamond -> Square)
            roof.rotation.y = Math.PI / 4;
        } else {
            // Gable (Prism)
            roof = new THREE.Mesh(this.geometries.roofGable, new THREE.MeshStandardMaterial({ color: roofColor }));

            // Prism is Cylinder(3). Height 1. Radius 0.75.
            // Upright. Triangle base on XZ plane? No, Cylinder base is XZ.
            // Cylinder is along Y.
            // We want the "Length" of the prism to be along X or Z.
            // And the "Triangle" face to be vertical.

            // Rotate Prism to lie down: Rotate Z 90.
            // Now Length is along World X. Triangle face is in YZ plane.
            // We want Triangle face to be Front/Back? Or Side/Side?
            // Usually Gable runs along the long axis or short axis.
            // Here house is square (hWidth == hDepth).

            // Length should match house Width (or Depth).
            // Triangle Height should match desired roof height.
            // Triangle Base Width should match house Depth.

            const rHeight = hHeight * 0.5;

            // Geometry: Radius 0.75. Height 1.
            // Radius 0.75 -> Triangle Height?
            // Equilateral triangle inscribed in circle.
            // This is tricky to scale exactly.
            // Simplification: Scale blindly.

            // If we rotate X=90. Length along Z.
            // Triangle face in XY plane.
            // Point up?
            // Cylinder(3) vertices: Top one at (0, r, ?).
            // Default rotation usually has a flat side or a point up.

            roof.rotation.z = Math.PI / 2; // Lie along X axis.
            roof.rotation.y = Math.PI / 2; // Rotate so flat bottom is down?

            // Actually, Cylinder(3) is weird.
            // Better to rotate manually to find "Flat Down".
            // Or just use Cone(4) as Pyramid for all for stability if Prism is hard?
            // No, user specifically noted skew.

            // Let's rely on Cone(4) as "Pyramid" working.
            // For Gable, let's use a Box and taper it? Or just use a Wedge?
            // Let's use `CylinderGeometry` but we need to align rotation.
            // Cylinder(3) creates a prism.
            // If we rotate on X 90deg, it lies on Z.
            // Vertices need checking.

            // Trial: Rotate X -90.
            // Triangle points Y?
            // Let's assume standard Cylinder.

            // Just use a simpler shape: Scaled Box? No.
            // Let's stick to Pyramid but elongated for "Hip Roof" if Gable is hard?
            // User wants variety.

            // Let's try the Prism again.
            // Rotate Z = 90.
            // We need to rotate X to make the flat side down.
            // Cylinder(3) with rot Y = PI (180)?
            // It creates a triangle pointing specific way.
            // Let's just fix the rotation: `rotation.z = Math.PI / 2`.
            // And `rotation.x = -Math.PI / 2`?
            // Let's set it to 0,0,0 and scale.

            roof.rotation.set(Math.PI / 2, Math.PI, 0); // Experimentally standard for prism on side?

            // Dimensions
            // Length (now Y local -> Z world?) = hDepth * 1.2
            // Width/Height (Circle radius) -> hWidth / 2 and rHeight

            roof.scale.set(hWidth * 0.8, hDepth * 1.3, hWidth * 0.8);
            roof.position.y = hHeight + (rHeight * 0.4);
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

        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(body);
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
