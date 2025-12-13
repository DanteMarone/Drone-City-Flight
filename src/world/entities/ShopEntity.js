import * as THREE from 'three';
import { TextureGenerator } from '../../utils/textures.js';
import { BuildingEntity } from './BuildingEntity.js';

export class ShopEntity extends BuildingEntity {
    static type = 'shop';

    createMesh() {
        const { geometries } = this.context.resources;
        const { x = 0, z = 0, width, height, widthScale, depthScale } = this.params;

        const wBase = this.clampDimension(width, 20);
        const h = this.clampDimension(height, 8 + Math.random() * 6);
        const wScale = this.clampDimension(widthScale, 0.8 + Math.random() * 0.2);
        const dScale = this.clampDimension(depthScale, 0.8 + Math.random() * 0.2);

        const w = wBase * wScale;
        const d = wBase * dScale;

        this.params = { ...this.params, width: wBase, height: h, widthScale: wScale, depthScale: dScale };

        const tex = TextureGenerator.createBuildingFacade({
            color: '#aa8866',
            windowColor: '#443322',
            floors: 3,
            cols: Math.floor(w / 4),
            width: 256,
            height: 256
        });

        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
        const mesh = new THREE.Mesh(geometries.box, mat);
        mesh.position.set(x, h / 2, z);
        mesh.scale.set(w, h, d);

        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0xcc4444 })
        );
        awning.scale.set((w + 1) / w, 0.2 / h, 2 / d);
        awning.position.set(0, 3 / h - 0.5, 0.5 + 1 / d);
        awning.rotation.x = Math.PI / 6;
        mesh.add(awning);

        return mesh;
    }
}
