import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class PorchSwingEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'porch_swing';
        this._swingPivot = null;
        this._porchLight = null;
        this._time = Math.random() * Math.PI * 2;
        this._swingSpeed = params.swingSpeed || 0.9 + Math.random() * 0.6;
        this._swingAmplitude = params.swingAmplitude || 0.12 + Math.random() * 0.08;
    }

    static get displayName() { return 'Porch Swing'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 4.6;
        const depth = params.depth || 3.2;
        const deckHeight = 0.2;
        const postHeight = 2.4;
        const roofThickness = 0.2;
        const roofPitch = 0.18;

        this.params.width = width;
        this.params.depth = depth;

        const woodHue = 0.07 + Math.random() * 0.04;
        const woodColor = new THREE.Color().setHSL(woodHue, 0.45, 0.35 + Math.random() * 0.1);
        const trimColor = new THREE.Color().setHSL(woodHue, 0.35, 0.22);
        const metalColor = new THREE.Color().setHSL(0.6, 0.1, 0.35);
        const cushionColor = new THREE.Color().setHSL(0.02 + Math.random() * 0.1, 0.55, 0.55);

        const woodMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.8, metalness: 0.05 });
        const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.85, metalness: 0.05 });
        const metalMat = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.35, metalness: 0.65 });
        const cushionMat = new THREE.MeshStandardMaterial({ color: cushionColor, roughness: 0.9, metalness: 0.05 });

        const deckPlanks = 7;
        const plankDepth = (depth - 0.3) / deckPlanks;
        for (let i = 0; i < deckPlanks; i++) {
            const plank = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), woodMat);
            plank.scale.set(width, deckHeight, plankDepth * 0.92);
            plank.position.set(0, deckHeight / 2, -depth / 2 + 0.15 + i * plankDepth);
            plank.castShadow = true;
            plank.receiveShadow = true;
            group.add(plank);
        }

        const step = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), trimMat);
        step.scale.set(width * 0.5, deckHeight * 0.6, depth * 0.22);
        step.position.set(0, step.scale.y / 2, depth / 2 + step.scale.z / 2 - 0.1);
        step.castShadow = true;
        step.receiveShadow = true;
        group.add(step);

        const postGeo = new THREE.BoxGeometry(0.18, 1, 0.18);
        const postPositions = [
            [-width / 2 + 0.2, postHeight / 2 + deckHeight, -depth / 2 + 0.2],
            [width / 2 - 0.2, postHeight / 2 + deckHeight, -depth / 2 + 0.2],
            [-width / 2 + 0.2, postHeight / 2 + deckHeight, depth / 2 - 0.2],
            [width / 2 - 0.2, postHeight / 2 + deckHeight, depth / 2 - 0.2]
        ];
        postPositions.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(postGeo, trimMat);
            post.scale.y = postHeight;
            post.position.set(x, y, z);
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);
        });

        const roof = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), woodMat);
        roof.scale.set(width + 0.6, roofThickness, depth + 0.6);
        roof.position.set(0, deckHeight + postHeight + roofThickness, 0);
        roof.rotation.x = roofPitch;
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        const ridge = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), trimMat);
        ridge.scale.set(width + 0.4, roofThickness * 0.6, 0.12);
        ridge.position.set(0, deckHeight + postHeight + roofThickness + 0.05, 0);
        ridge.castShadow = true;
        ridge.receiveShadow = true;
        group.add(ridge);

        const beam = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), metalMat);
        beam.scale.set(width * 0.75, 0.08, 0.08);
        beam.position.set(0, deckHeight + postHeight - 0.1, depth * 0.15);
        beam.castShadow = true;
        beam.receiveShadow = true;
        group.add(beam);

        const swingPivot = new THREE.Group();
        swingPivot.position.copy(beam.position);
        group.add(swingPivot);
        this._swingPivot = swingPivot;

        const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
        const seatGeo = new THREE.BoxGeometry(1.4, 0.12, 0.5);
        const backGeo = new THREE.BoxGeometry(1.4, 0.6, 0.08);
        const armGeo = new THREE.BoxGeometry(0.18, 0.1, 0.5);

        [-0.55, 0.55].forEach((xOffset) => {
            const rope = new THREE.Mesh(ropeGeo, metalMat);
            rope.position.set(xOffset, -0.7, 0);
            rope.castShadow = true;
            rope.receiveShadow = true;
            swingPivot.add(rope);
        });

        const seat = new THREE.Mesh(seatGeo, woodMat);
        seat.position.set(0, -1.35, 0);
        seat.castShadow = true;
        seat.receiveShadow = true;
        swingPivot.add(seat);

        const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.4), cushionMat);
        cushion.position.set(0, -1.25, 0);
        cushion.castShadow = true;
        cushion.receiveShadow = true;
        swingPivot.add(cushion);

        const backrest = new THREE.Mesh(backGeo, woodMat);
        backrest.position.set(0, -1.05, -0.2);
        backrest.castShadow = true;
        backrest.receiveShadow = true;
        swingPivot.add(backrest);

        [-0.7, 0.7].forEach((xOffset) => {
            const arm = new THREE.Mesh(armGeo, woodMat);
            arm.position.set(xOffset, -1.15, 0);
            arm.castShadow = true;
            arm.receiveShadow = true;
            swingPivot.add(arm);
        });

        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xfff1cc,
            emissive: 0xffd27a,
            emissiveIntensity: 0.85,
            roughness: 0.4,
            metalness: 0.1
        });
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), lightMat);
        light.position.set(0, deckHeight + postHeight - 0.05, 0);
        light.castShadow = false;
        light.receiveShadow = false;
        group.add(light);
        this._porchLight = light;

        const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 10), metalMat);
        lanternBase.position.set(0, deckHeight + postHeight + 0.08, 0);
        group.add(lanternBase);

        return group;
    }

    update(dt) {
        if (!this.mesh || !this._swingPivot) return;

        this._time += dt * this._swingSpeed;
        const swing = Math.sin(this._time) * this._swingAmplitude;
        this._swingPivot.rotation.z = swing;

        if (this._porchLight?.material) {
            const pulse = 0.75 + Math.sin(this._time * 2.4) * 0.1;
            this._porchLight.material.emissiveIntensity = pulse;
        }
    }
}

EntityRegistry.register('porch_swing', PorchSwingEntity);
