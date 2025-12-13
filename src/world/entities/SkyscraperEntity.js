import * as THREE from 'three';
import { TextureGenerator } from '../../utils/textures.js';
import { BuildingEntity } from './BuildingEntity.js';

export class SkyscraperEntity extends BuildingEntity {
    static type = 'skyscraper';

    createMesh() {
        const { geometries } = this.context.resources;
        const { x = 0, z = 0, width, height, isGlass: _isGlass, baseColor: _baseColor, winColor: _winColor } = this.params;

        const h = this.clampDimension(height, 30 + Math.random() * 70);
        const w = this.clampDimension(width, 20);

        const isGlass = _isGlass ?? (Math.random() > 0.5);
        const baseColor = _baseColor || (isGlass ? '#445566' : (Math.random() > 0.5 ? '#999999' : '#bbbbbb'));
        const winColor = _winColor || (isGlass ? '#88aacc' : '#112233');

        this.params = { ...this.params, width: w, height: h, isGlass, baseColor, winColor };

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

        const mesh = new THREE.Mesh(geometries.box, mat);
        mesh.position.set(x, h / 2, z);
        mesh.scale.set(w, h, w);

        const roofRim = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        roofRim.scale.set((w + 0.5) / w, 1 / h, (w + 0.5) / w);
        roofRim.position.set(0, 0.5 + 0.5 / h, 0);
        mesh.add(roofRim);

        return mesh;
    }
}
