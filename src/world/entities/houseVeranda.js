import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
coneGeo.rotateY(Math.PI / 4);

export class HouseVerandaEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'house_veranda';
        this.fan = null;
    }

    static get displayName() { return 'House Veranda'; }

    createMesh(params) {
        const group = new THREE.Group();
        const w = params.width || 11;
        const h = params.height || 6;
        const d = params.depth || 9;
        const porchDepth = d * 0.45;

        this.params.width = w;
        this.params.height = h;
        this.params.depth = d;

        const brickTone = Math.random() > 0.5 ? '#b66a4c' : '#9b5a3d';
        const brickTex = TextureGenerator.createBrick({
            color: brickTone,
            mortar: '#d7d2c4',
            rows: 12,
            cols: 6
        });
        const wallMat = new THREE.MeshStandardMaterial({ map: brickTex });

        const body = new THREE.Mesh(boxGeo, wallMat);
        body.scale.set(w, h, d);
        body.position.set(0, h / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const roofH = h * 0.75;
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e });
        const roof = new THREE.Mesh(coneGeo, roofMat);
        roof.scale.set(w * 0.9, roofH, d * 0.9);
        roof.position.set(0, h + roofH / 2, 0);
        roof.castShadow = true;
        group.add(roof);

        const concreteTex = TextureGenerator.createConcrete();
        const porchMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xdedede });
        const porch = new THREE.Mesh(boxGeo, porchMat);
        porch.scale.set(w * 0.7, 0.6, porchDepth);
        porch.position.set(0, 0.3, d / 2 + porchDepth / 2);
        porch.receiveShadow = true;
        group.add(porch);

        const step = new THREE.Mesh(boxGeo, porchMat);
        step.scale.set(w * 0.3, 0.25, porchDepth * 0.4);
        step.position.set(0, 0.125, d / 2 + porchDepth + 0.2);
        group.add(step);

        const postMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e6 });
        const postHeight = h * 0.6;
        const postOffsetX = w * 0.3;
        const postOffsetZ = d / 2 + porchDepth * 0.2;
        for (const x of [-postOffsetX, postOffsetX]) {
            const post = new THREE.Mesh(cylinderGeo, postMat);
            post.scale.set(0.25, postHeight, 0.25);
            post.position.set(x, postHeight / 2, postOffsetZ);
            group.add(post);
        }

        const awning = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x7a4b3a }));
        awning.scale.set(w * 0.75, 0.3, porchDepth * 0.9);
        awning.position.set(0, postHeight + 0.15, d / 2 + porchDepth * 0.3);
        awning.rotation.x = -0.08;
        group.add(awning);

        const door = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x3f2a1c }));
        door.scale.set(1.5, 2.8, 0.2);
        door.position.set(-w * 0.15, 1.4, d / 2 + 0.1);
        group.add(door);

        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x6fb0d8,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x1a2a3a,
            emissiveIntensity: 0.5
        });
        const window = new THREE.Mesh(boxGeo, windowMat);
        window.scale.set(0.2, 2.2, 2.2);
        window.position.set(w * 0.32, 3.2, d / 2 + 0.1);
        group.add(window);

        const planterMat = new THREE.MeshStandardMaterial({ color: 0x6a4b2a });
        const planter = new THREE.Mesh(boxGeo, planterMat);
        planter.scale.set(2.4, 0.5, 0.7);
        planter.position.set(w * 0.28, 0.5, d / 2 + porchDepth + 0.55);
        group.add(planter);

        const planterGreen = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x3f7a2a }));
        planterGreen.scale.set(2.2, 0.4, 0.6);
        planterGreen.position.set(w * 0.28, 0.8, d / 2 + porchDepth + 0.55);
        group.add(planterGreen);

        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x4b5b68 });
        const barrel = new THREE.Mesh(cylinderGeo, barrelMat);
        barrel.scale.set(0.8, 1.4, 0.8);
        barrel.position.set(-w * 0.38, 0.7, -d * 0.3);
        group.add(barrel);

        const trellis = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0xb0895a }));
        trellis.scale.set(0.15, 2.8, 2);
        trellis.position.set(w * 0.52, 1.4, 0);
        group.add(trellis);

        const fanGroup = new THREE.Group();
        const fanHub = new THREE.Mesh(cylinderGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        fanHub.scale.set(0.2, 0.1, 0.2);
        fanHub.rotation.x = Math.PI / 2;
        fanGroup.add(fanHub);

        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2e });
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(boxGeo, bladeMat);
            blade.scale.set(0.15, 0.02, 1.1);
            blade.position.set(0, 0, 0.55);
            blade.rotation.y = (Math.PI / 2) * i;
            fanGroup.add(blade);
        }
        fanGroup.position.set(0, postHeight - 0.2, d / 2 + porchDepth * 0.25);
        group.add(fanGroup);
        this.fan = fanGroup;

        return group;
    }

    update(dt) {
        if (this.fan) {
            this.fan.rotation.y += dt * 1.6;
        }
    }
}

EntityRegistry.register('house_veranda', HouseVerandaEntity);
