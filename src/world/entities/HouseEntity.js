import * as THREE from 'three';
import { BuildingEntity } from './BuildingEntity.js';

export class HouseEntity extends BuildingEntity {
    static type = 'house';

    createMesh() {
        const { geometries, materials } = this.context.resources;
        const { x = 0, z = 0, width } = this.params;

        const w = this.clampDimension(width, 15);
        this.params = { ...this.params, width: w };

        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const wallColors = [0xffffee, 0xeeddaa, 0xddccaa, 0xffeecc];
        const roofColors = [0xaa5544, 0x555555, 0x444466];
        const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

        const lawn = new THREE.Mesh(geometries.box, materials.grass);
        lawn.scale.set(w, 0.2, w);
        lawn.position.y = 0.1;
        lawn.receiveShadow = true;
        group.add(lawn);

        const hWidth = w * 0.5;
        const hDepth = w * 0.5;
        const hHeight = 3.5 + Math.random() * 1.5;

        const bodyGeo = new THREE.BoxGeometry(hWidth, hHeight, hDepth);
        bodyGeo.translate(0, hHeight / 2, 0);
        const bodyMat = new THREE.MeshStandardMaterial({ color: wallColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const rHeight = hHeight * 0.4;
        const roofType = Math.random() > 0.5 ? 'pyramid' : 'gable';
        let roof;

        if (roofType === 'pyramid') {
            roof = new THREE.Mesh(geometries.roofPyramid, new THREE.MeshStandardMaterial({ color: roofColor }));
            const baseScale = hWidth / 1.414;
            roof.scale.set(baseScale, rHeight, baseScale);
            roof.position.y = hHeight + rHeight / 2;
        } else {
            roof = new THREE.Mesh(geometries.roofGable, new THREE.MeshStandardMaterial({ color: roofColor }));
            const scaleX = (hDepth * 1.2) / 1.0;
            const scaleY = rHeight / 0.75;
            const scaleZ = (hWidth * 1.0) / 0.866;
            roof.scale.set(scaleX, scaleY, scaleZ);
            if (Math.random() > 0.5) roof.rotation.y = Math.PI / 2;
            roof.position.y = hHeight + rHeight / 2;
        }
        roof.castShadow = true;
        group.add(roof);

        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2.2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x442211 })
        );
        door.position.set(0, 1.1, hDepth / 2 + 0.05);
        group.add(door);

        const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.1 })
        );
        win.position.set(0, 1.8, -hDepth / 2 - 0.05);
        group.add(win);

        this.mesh = group;
        this.boxTarget = body;
        return group;
    }

    createCollider() {
        if (!this.boxTarget) return super.createCollider();
        this.boxTarget.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(this.boxTarget);
        box.max.y += 2;
        box.type = this.type;
        return box;
    }
}
