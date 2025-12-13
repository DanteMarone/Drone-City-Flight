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
        // Pyramid Roof (Hip)
        // Cone(radius, height, segments). Default: Base in XZ, Point +Y.
        // Segments=4 -> Diamond. Rotate Y 45deg to make it Square aligned with axes.
        const roofPyramid = new THREE.ConeGeometry(1, 1, 4);
        roofPyramid.rotateY(Math.PI / 4);

        // Gable Roof (Prism)
        // Cylinder(radiusTop, radiusBottom, height, segments).
        // Use 0.5 radius to give ~1 unit width.
        const roofGable = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
        // Default: Spine along Y. Vertex at +Z (theta=0).
        // 1. Lay spine horizontal along X axis.
        roofGable.rotateZ(Math.PI / 2);
        // 2. Rotate around Spine (X) to point vertex +Z up to +Y.
        // Original +Z needs to go to +Y. Rotate X -90deg.
        roofGable.rotateX(-Math.PI / 2);

        return {
            box: new THREE.BoxGeometry(1, 1, 1),
            roofPyramid,
            roofGable
        };
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
        const rHeight = hHeight * 0.4; // Height of the roof peak

        if (roofType === 'pyramid') {
            roof = new THREE.Mesh(this.geometries.roofPyramid, new THREE.MeshStandardMaterial({ color: roofColor }));

            // Pyramid Geometry is Base 1.414 (Diagonal) -> Side ~1?
            // Actually, we baked RotateY(45).
            // Cone base radius is 1. Diameter 2.
            // Rotated 45deg, the bounding box width is sqrt(2)*Radius*2 = 2.8?
            // Let's think: Cone(r=1, h=1).
            // Base is circle. Segments 4 makes a square inscribed in circle?
            // Radius 1. Vertices at (1,0), (0,1), (-1,0), (0,-1).
            // Distance between vertices (Side Length) = sqrt(1^2+1^2) = 1.414.
            // But we want Side Length to match hWidth.
            // Current Side Length is 1.414.
            // Scale Factor = hWidth / 1.414.
            // Wait, if we rotated it 45 deg...
            // Vertices are now at (0.707, 0.707).
            // The Bounds are X[-0.707, 0.707], Z[-0.707, 0.707].
            // Width is 1.414.
            // So to match hWidth, we scale by hWidth / 1.414.

            const baseScale = hWidth / 1.414;
            roof.scale.set(baseScale, rHeight, baseScale);

            // Pivot is at center of base (Y= -0.5) or center (Y=0)?
            // ConeGeometry origin is at (0, -height/2, 0) usually?
            // Docs: "centered at the origin".
            // So Y goes from -height/2 to +height/2.
            // We want base to be at hHeight.
            // Base is at local Y = -0.5 (since created with height 1).
            // After scaling Y by rHeight, base is at -rHeight/2.
            // We want that point to be at hHeight.
            // So pos.y = hHeight + rHeight/2.

            roof.position.y = hHeight + rHeight / 2;

        } else {
            // Gable (Prism)
            roof = new THREE.Mesh(this.geometries.roofGable, new THREE.MeshStandardMaterial({ color: roofColor }));

            // We baked it: Spine X. Point Up (+Y). Base Flat (-Y).
            // Dimensions:
            // X (Spine/Length) -> Should match hDepth (or hWidth).
            // Y (Height) -> Should match rHeight.
            // Z (Width) -> Should match hWidth.

            // Original Geometry:
            // Cylinder(0.5, 0.5, 1, 3).
            // Rotated.
            // Bounds:
            // Spine (X) length is 1.
            // Width (Z) is approx 0.866 (height of triangle with side 1)?
            // Let's calculate:
            // Inscribed in radius 0.5.
            // Triangle side length s = r * sqrt(3) = 0.5 * 1.732 = 0.866.
            // Triangle Height h_tri = s * sqrt(3)/2 = 0.866 * 0.866 = 0.75.
            // (Or r + r/2 = 0.75).
            // So Height (Y) is 0.75. Width (Z) is 0.866. Length (X) is 1.

            // We want:
            // Length (X) = hDepth * 1.2 (Overhang).
            // Height (Y) = rHeight.
            // Width (Z) = hWidth * 1.2 (Overhang).

            const scaleX = (hDepth * 1.2) / 1.0;
            const scaleY = rHeight / 0.75;
            const scaleZ = (hWidth * 1.0) / 0.866; // Match width exactly or slightly over?

            roof.scale.set(scaleX, scaleY, scaleZ);

            // Orientation:
            // Spine is X. This aligns with House Depth?
            // If House is square, doesn't matter.
            // Let's randomize alignment? 50% rotate Y 90.
            if (Math.random() > 0.5) {
                roof.rotation.y = Math.PI / 2;
            }

            // Position:
            // Origin is Center.
            // Base is at -Y (local).
            // Visual Bottom is at -Height/2 * scaleY?
            // Local Bottom is -0.375? (Since total height is 0.75 centered).
            // Local Y range: [-0.375, +0.375] (approx).
            // Scaled: [-0.375 * scaleY, +0.375 * scaleY].
            // We want Bottom to be at hHeight.
            // So pos.y = hHeight + (0.375 * scaleY).
            // Since scaleY = rHeight / 0.75 -> 0.375 * (rHeight/0.75) = 0.375/0.75 * rHeight = 0.5 * rHeight.
            // So pos.y = hHeight + rHeight/2.

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
