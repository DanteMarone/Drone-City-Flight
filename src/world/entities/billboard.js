import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class BillboardEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'billboard';
        this.seed = Math.random() * 1000;
    }

    static get displayName() { return 'Billboard'; }

    createMesh(params) {
        const height = params.height || 12; // Pole height
        const boardW = params.width || 8;
        const boardH = params.boardHeight || 4;

        // Store for serialization
        this.params.height = height;
        this.params.width = boardW;
        this.params.boardHeight = boardH;

        // Use params.seed if available (reloading), else this.seed (new)
        const seed = params.seed || this.seed;
        this.params.seed = seed;

        const group = new THREE.Group();

        // 1. Pole (Monopole)
        const poleGeo = new THREE.CylinderGeometry(0.5, 0.5, height, 8);
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.7,
            metalness: 0.5
        });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = height / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // 2. V-Truss Support behind board
        const trussGeo = new THREE.BoxGeometry(boardW * 0.6, 1, 1);
        const truss = new THREE.Mesh(trussGeo, poleMat);
        truss.position.y = height;
        group.add(truss);

        // 3. The Board Frame
        const frameGeo = new THREE.BoxGeometry(boardW, boardH, 0.5);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = height + boardH / 2;
        frame.position.z = 0.5; // Offset from pole
        frame.castShadow = true;
        group.add(frame);

        // 4. The Ad Face
        const adTex = TextureGenerator.createBillboardAd(seed);
        // Make it slightly emissive so it glows at night
        const adMat = new THREE.MeshStandardMaterial({
            map: adTex,
            emissive: 0xffffff,
            emissiveMap: adTex,
            emissiveIntensity: 0.2,
            roughness: 0.3
        });
        const faceGeo = new THREE.PlaneGeometry(boardW - 0.2, boardH - 0.2);
        const face = new THREE.Mesh(faceGeo, adMat);
        face.position.z = 0.26; // Slightly inside frame
        face.position.y = 0; // Relative to frame
        frame.add(face); // Add to frame so it moves with it

        // 5. Catwalk (Platform)
        const platGeo = new THREE.BoxGeometry(boardW + 1, 0.2, 1.5);
        const platMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const catwalk = new THREE.Mesh(platGeo, platMat);
        catwalk.position.y = height;
        catwalk.position.z = 1.0;
        group.add(catwalk);

        // 6. Lights (Visual only geometries)
        // Two small fixtures at bottom
        const lampGeo = new THREE.BoxGeometry(0.5, 0.2, 0.5);
        const lampMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const l1 = new THREE.Mesh(lampGeo, lampMat);
        l1.position.set(-boardW/3, height + 0.2, 1.5);
        l1.rotation.x = -Math.PI / 4;
        group.add(l1);

        const l2 = new THREE.Mesh(lampGeo, lampMat);
        l2.position.set(boardW/3, height + 0.2, 1.5);
        l2.rotation.x = -Math.PI / 4;
        group.add(l2);

        return group;
    }
}

EntityRegistry.register('billboard', BillboardEntity);
