import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

class OwlPerchLightEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'owlPerchLight';
        this._time = 0;
        this._head = null;
        this._lightHandle = null;
        this._eyeMaterial = null;
        this._baseLightIntensity = 1.1;
    }

    static get displayName() { return 'Owl Perch Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        const barkTexture = TextureGenerator.createSand();
        barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
        barkTexture.repeat.set(2, 2);

        const barkMat = new THREE.MeshStandardMaterial({
            map: barkTexture,
            color: 0x7a5a3a,
            roughness: 0.8,
            metalness: 0.05
        });
        const perchMat = new THREE.MeshStandardMaterial({
            color: 0x5b3d26,
            roughness: 0.7,
            metalness: 0.05
        });
        const featherMat = new THREE.MeshStandardMaterial({
            color: 0xc3a77a,
            roughness: 0.65,
            metalness: 0.05
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x8b6b43,
            roughness: 0.55,
            metalness: 0.08
        });
        this._eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d2d2d,
            emissive: new THREE.Color(0xf3d37a),
            emissiveIntensity: 1.4,
            metalness: 0.2,
            roughness: 0.3
        });

        // Base stump
        const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 12);
        const base = new THREE.Mesh(baseGeo, barkMat);
        base.position.y = 0.17;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Perch pole
        const poleGeo = new THREE.CylinderGeometry(0.15, 0.18, 1.4, 10);
        const pole = new THREE.Mesh(poleGeo, perchMat);
        pole.position.y = 1.05;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const crossGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8);
        const cross = new THREE.Mesh(crossGeo, perchMat);
        cross.rotation.z = Math.PI / 2;
        cross.position.set(0, 1.6, 0);
        cross.castShadow = true;
        cross.receiveShadow = true;
        group.add(cross);

        // Owl body
        const bodyGeo = new THREE.SphereGeometry(0.35, 16, 12);
        const body = new THREE.Mesh(bodyGeo, featherMat);
        body.scale.set(1, 1.2, 1);
        body.position.set(0, 1.85, 0.05);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const bellyGeo = new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.7);
        const belly = new THREE.Mesh(bellyGeo, accentMat);
        belly.scale.set(1, 0.95, 1);
        belly.position.set(0, 1.82, 0.2);
        belly.rotation.x = Math.PI * 0.1;
        belly.castShadow = true;
        group.add(belly);

        // Wings
        const wingGeo = new THREE.BoxGeometry(0.14, 0.55, 0.32);
        const wingLeft = new THREE.Mesh(wingGeo, accentMat);
        wingLeft.position.set(-0.3, 1.85, 0.02);
        wingLeft.rotation.z = Math.PI * 0.08;
        group.add(wingLeft);

        const wingRight = wingLeft.clone();
        wingRight.position.x *= -1;
        wingRight.rotation.z *= -1;
        group.add(wingRight);

        // Head
        const headGeo = new THREE.SphereGeometry(0.28, 16, 12);
        const head = new THREE.Mesh(headGeo, featherMat);
        head.position.set(0, 2.25, 0.08);
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        this._head = head;

        // Eye mask
        const maskGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.18, 16);
        const mask = new THREE.Mesh(maskGeo, accentMat);
        mask.position.set(0, 2.25, 0.27);
        group.add(mask);

        // Eyes
        const eyeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
        const leftEye = new THREE.Mesh(eyeGeo, this._eyeMaterial);
        leftEye.rotation.x = Math.PI / 2;
        leftEye.position.set(-0.1, 2.25, 0.31);
        group.add(leftEye);

        const rightEye = leftEye.clone();
        rightEye.position.x = 0.1;
        group.add(rightEye);

        // Beak
        const beakGeo = new THREE.ConeGeometry(0.06, 0.16, 10);
        const beak = new THREE.Mesh(beakGeo, new THREE.MeshStandardMaterial({
            color: 0xf2c94c,
            roughness: 0.4,
            metalness: 0.2
        }));
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 2.18, 0.35);
        group.add(beak);

        // Ear tufts
        const tuftGeo = new THREE.ConeGeometry(0.05, 0.12, 8);
        const leftTuft = new THREE.Mesh(tuftGeo, featherMat);
        leftTuft.position.set(-0.12, 2.4, 0.0);
        leftTuft.rotation.z = Math.PI * 0.12;
        group.add(leftTuft);

        const rightTuft = leftTuft.clone();
        rightTuft.position.x = 0.12;
        rightTuft.rotation.z *= -1;
        group.add(rightTuft);

        // Talons
        const talonGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8);
        const talonMat = new THREE.MeshStandardMaterial({
            color: 0xd4a65a,
            roughness: 0.5,
            metalness: 0.1
        });
        const leftTalon = new THREE.Mesh(talonGeo, talonMat);
        leftTalon.position.set(-0.08, 1.62, 0.22);
        group.add(leftTalon);

        const rightTalon = leftTalon.clone();
        rightTalon.position.x = 0.08;
        group.add(rightTalon);

        // Soft halo pad on perch
        const padGeo = new THREE.TorusGeometry(0.16, 0.02, 10, 18);
        const pad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({
            color: 0x3f2a1e,
            roughness: 0.9,
            metalness: 0.02
        }));
        pad.rotation.x = Math.PI / 2;
        pad.position.set(0, 1.62, 0.12);
        group.add(pad);

        if (params?.lightSystem) {
            const worldLightPos = new THREE.Vector3(0, 2.25, 0.35);
            this._lightHandle = params.lightSystem.register({
                position: worldLightPos,
                color: 0xf3d37a,
                intensity: this._baseLightIntensity,
                range: 10
            });
            if (this._lightHandle) {
                this._lightHandle.parentMesh = group;
            }
        }

        return group;
    }

    update(dt) {
        this._time += dt;
        const sway = Math.sin(this._time * 1.2) * 0.04;
        const tilt = Math.sin(this._time * 0.9 + Math.PI / 4) * 0.12;

        if (this.mesh) {
            this.mesh.rotation.y = sway;
        }
        if (this._head) {
            this._head.rotation.y = tilt;
            this._head.rotation.x = Math.sin(this._time * 1.5) * 0.05;
        }

        const pulse = 1 + Math.sin(this._time * 3.3) * 0.15;
        if (this._eyeMaterial) {
            this._eyeMaterial.emissiveIntensity = 1.1 * pulse;
        }
        if (this._lightHandle) {
            this._lightHandle.intensity = this._baseLightIntensity * (0.9 + pulse * 0.15);
        }
    }
}

EntityRegistry.register('owlPerchLight', OwlPerchLightEntity);
