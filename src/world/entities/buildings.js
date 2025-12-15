import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

// Shared Geometries
const roofPyramid = new THREE.ConeGeometry(1, 1, 4);
roofPyramid.rotateY(Math.PI / 4);

const roofGable = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
roofGable.rotateZ(Math.PI / 2);
roofGable.rotateX(-Math.PI / 2);

const boxGeo = new THREE.BoxGeometry(1, 1, 1);

export class SkyscraperEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'skyscraper';
    }

    static get displayName() { return 'Skyscraper'; }

    createMesh(params) {
        const h = params.height || (30 + Math.random() * 70);
        const w = params.width || 20;

        const isGlass = params.isGlass !== undefined ? params.isGlass : (Math.random() > 0.5);
        const baseColor = params.baseColor || (isGlass ? '#445566' : (Math.random() > 0.5 ? '#999999' : '#bbbbbb'));
        const winColor = params.winColor || (isGlass ? '#88aacc' : '#112233');

        // Store resolved params
        this.params.height = h;
        this.params.width = w;
        this.params.isGlass = isGlass;
        this.params.baseColor = baseColor;
        this.params.winColor = winColor;

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

        const mesh = new THREE.Mesh(boxGeo, mat);
        // Position handles Y offset because pivot of box is center.
        // But BaseEntity.init sets position from params.
        // We need to bake the height offset or use a child?
        // Original logic: mesh.position.set(x, h/2, z).
        // BaseEntity.init does: mesh.position.copy(this.position) -> (x,0,z).
        // So we should translate geometry or use child.
        // Using child is cleaner but extra draw call overhead? No, hierarchy overhead.
        // Let's modify the mesh position in `postInit` or override position logic?
        // Or just create a Group as root.

        // If we return `mesh`, BaseEntity sets its position to (x,0,z).
        // We want the visual box to be at (0, h/2, 0) relative to that.

        // So:
        const group = new THREE.Group();
        mesh.scale.set(w, h, w);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        // Roof detail
        const roofRim = new THREE.Mesh(
            boxGeo,
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        roofRim.scale.set(w + 0.5, 1, w + 0.5);
        roofRim.position.y = h + 0.5;
        group.add(roofRim);

        return group;
    }
}

export class ShopEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'shop';
    }

    static get displayName() { return 'Shop'; }

    createMesh(params) {
        const wBase = params.width || 20;
        const h = params.height || (8 + Math.random() * 6);
        const wScale = params.widthScale || (0.8 + Math.random() * 0.2);
        const dScale = params.depthScale || (0.8 + Math.random() * 0.2);

        const w = wBase * wScale;
        const d = wBase * dScale;

        this.params.width = wBase;
        this.params.height = h;
        this.params.widthScale = wScale;
        this.params.depthScale = dScale;

        const tex = TextureGenerator.createBuildingFacade({
            color: '#aa8866',
            windowColor: '#443322',
            floors: 3,
            cols: Math.floor(w / 4),
            width: 256,
            height: 256
        });

        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });

        const group = new THREE.Group();
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.scale.set(w, h, d);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        const awning = new THREE.Mesh(
            boxGeo,
            new THREE.MeshStandardMaterial({ color: 0xcc4444 })
        );
        awning.scale.set(w + 1, 0.2, 2);
        awning.position.set(0, 3, d / 2 + 1);
        awning.rotation.x = Math.PI / 6;
        group.add(awning);

        return group;
    }
}

export class HouseEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'house';
    }

    static get displayName() { return 'House'; }

    createMesh(params) {
        const w = params.width || 15;
        this.params.width = w;

        const group = new THREE.Group();

        const wallColors = [0xffffee, 0xeeddaa, 0xddccaa, 0xffeecc];
        const roofColors = [0xaa5544, 0x555555, 0x444466];
        const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

        // Lawn
        const lawn = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 1.0 }));
        lawn.scale.set(w, 0.2, w);
        lawn.position.y = 0.1;
        lawn.receiveShadow = true;
        group.add(lawn);

        // Body
        const hWidth = w * 0.5;
        const hDepth = w * 0.5;
        const hHeight = 3.5 + Math.random() * 1.5;

        // Use a new geometry for body to pivot at bottom?
        // Or just scale/pos boxGeo.
        // ObjectFactory used BoxGeometry with translate(0, hHeight/2, 0).
        // Here we can just position the mesh.
        const bodyMat = new THREE.MeshStandardMaterial({ color: wallColor });
        const body = new THREE.Mesh(boxGeo, bodyMat);
        body.scale.set(hWidth, hHeight, hDepth);
        body.position.y = hHeight / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Roof
        const rHeight = hHeight * 0.4;
        const roofType = Math.random() > 0.5 ? 'pyramid' : 'gable';
        let roof;

        if (roofType === 'pyramid') {
            roof = new THREE.Mesh(roofPyramid, new THREE.MeshStandardMaterial({ color: roofColor }));
            const baseScale = hWidth / 1.414;
            roof.scale.set(baseScale, rHeight, baseScale);
            roof.position.y = hHeight + rHeight / 2;
        } else {
            roof = new THREE.Mesh(roofGable, new THREE.MeshStandardMaterial({ color: roofColor }));
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
            boxGeo,
            new THREE.MeshStandardMaterial({ color: 0x442211 })
        );
        door.scale.set(1.2, 2.2, 0.1);
        door.position.set(0, 1.1, hDepth / 2 + 0.05);
        group.add(door);

        const win = new THREE.Mesh(
            boxGeo,
            new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.1 })
        );
        win.scale.set(1.5, 1.2, 0.1);
        win.position.set(0, 1.8, -hDepth / 2 - 0.05);
        group.add(win);

        return group;
    }

    createCollider() {
        if (!this.mesh) return null;
        // Specific collider logic for house (body + roof height)
        this.mesh.updateMatrixWorld(true);
        // Find the body mesh to get bounds?
        // Or just use bounding box of group?
        // ObjectFactory used: box from 'body', then box.max.y += 2.

        // Let's compute box from whole group
        const box = new THREE.Box3().setFromObject(this.mesh);
        // Maybe shrink it if lawn makes it too wide?
        // The lawn is `w` wide. The house body is `w * 0.5`.
        // Collision should probably be the body, not the lawn.

        // Let's reproduce ObjectFactory logic:
        // Body is the 2nd child (index 1).
        const body = this.mesh.children[1];
        if (body) {
            const b = new THREE.Box3().setFromObject(body);
            b.max.y += 2; // Extend up for roof
            return b;
        }
        return box;
    }
}

// Register
EntityRegistry.register('skyscraper', SkyscraperEntity);
EntityRegistry.register('shop', ShopEntity);
EntityRegistry.register('house', HouseEntity);
