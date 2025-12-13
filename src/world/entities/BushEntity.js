import * as THREE from 'three';
import { BaseEntity } from './BaseEntity.js';

export class BushEntity extends BaseEntity {
    static type = 'bush';

    createMesh() {
        const { textureLoader } = this.context.resources;
        const { x = 0, z = 0 } = this.params;

        const group = new THREE.Group();
        group.position.set(x, 0, z);

        let bushMat;
        try {
            const tex = textureLoader.load('/textures/bush.png');
            tex.colorSpace = THREE.SRGBColorSpace;
            bushMat = new THREE.MeshStandardMaterial({
                map: tex,
                color: 0xffffff,
                roughness: 1.0,
                side: THREE.DoubleSide
            });
        } catch (e) {
            bushMat = new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 1.0 });
        }

        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const r = 0.3 + Math.random() * 0.4;
            const geo = new THREE.SphereGeometry(r, 8, 8);
            const mesh = new THREE.Mesh(geo, bushMat);

            const ox = (Math.random() - 0.5) * 1.2;
            const oz = (Math.random() - 0.5) * 1.2;
            const oy = r * 0.8 + Math.random() * 0.5;
            mesh.position.set(ox, oy, oz);

            const s = 0.7 + Math.random() * 0.6;
            mesh.scale.set(s, s, s);

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }

        this.mesh = group;
        return group;
    }

    shouldCreateCollider() {
        return false;
    }
}
