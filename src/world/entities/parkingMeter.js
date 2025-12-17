import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class ParkingMeterEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'parkingMeter';
        this._time = 0;
        this._virtualLight = null;
        this._glowMaterial = null;
        this._lightLocalPos = null;
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Parking Meter'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.poleHeight || 1.25 + Math.random() * 0.1;
        this.params.poleHeight = poleHeight;

        const concreteTex = TextureGenerator.createConcrete();
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x9a9a9a,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.1
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.3, 14), baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12), baseMaterial);
        footing.position.y = base.position.y + 0.21;
        footing.castShadow = true;
        footing.receiveShadow = true;
        group.add(footing);

        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.35,
            metalness: 0.75
        });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, poleHeight, 12), poleMaterial);
        pole.position.y = footing.position.y + poleHeight / 2 + 0.06;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.01, 8, 16), poleMaterial);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = pole.position.y + poleHeight / 2 - 0.1;
        group.add(collar);

        const headGroup = new THREE.Group();
        const headDepth = 0.22;
        headGroup.position.y = pole.position.y + poleHeight / 2 + 0.08;
        group.add(headGroup);

        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.5,
            metalness: 0.6
        });
        const headBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, headDepth), headMaterial);
        headBody.castShadow = true;
        headBody.receiveShadow = true;
        headGroup.add(headBody);

        const visor = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.18, 0.08, 12, 1, true),
            new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.45, metalness: 0.55 })
        );
        visor.rotation.z = Math.PI / 2;
        visor.position.set(0, 0.19, 0);
        headGroup.add(visor);

        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
            poleMaterial
        );
        dome.scale.set(1, 0.6, 1);
        dome.position.y = 0.23;
        dome.castShadow = true;
        dome.receiveShadow = true;
        headGroup.add(dome);

        const screenTexture = TextureGenerator.createBuildingFacade({
            color: '#0d1b22',
            windowColor: '#5fffb4',
            floors: 6,
            cols: 3,
            width: 128,
            height: 128
        });
        const screenMaterial = new THREE.MeshStandardMaterial({
            map: screenTexture,
            color: 0xffffff,
            emissive: new THREE.Color(0x46ffb0),
            emissiveIntensity: 0.8,
            roughness: 0.4,
            metalness: 0.2,
            transparent: true
        });
        this._glowMaterial = screenMaterial;

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.24), screenMaterial);
        screen.position.set(0, 0.02, headDepth / 2 + 0.001);
        screen.castShadow = false;
        headGroup.add(screen);

        const coinSlot = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.02, 0.01),
            new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.3, roughness: 0.6 })
        );
        coinSlot.position.set(0, -0.08, headDepth / 2 + 0.011);
        headGroup.add(coinSlot);

        const handleGeo = new THREE.BoxGeometry(0.04, 0.14, 0.05);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.6, roughness: 0.4 });
        const handleLeft = new THREE.Mesh(handleGeo, handleMat);
        handleLeft.position.set(-0.18, -0.04, 0);
        headGroup.add(handleLeft);

        const handleRight = handleLeft.clone();
        handleRight.position.x = 0.18;
        headGroup.add(handleRight);

        this._lightLocalPos = new THREE.Vector3(0, headGroup.position.y + 0.05, headDepth / 2 + 0.05);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation = this.mesh.rotation.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this._lightLocalPos && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight = lightSystem.register(
                worldPos,
                0x46ffb0,
                this.params.lightIntensity || 1.2,
                10
            );

            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 0.6 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(2.2);
        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x,
                this._baseRotation.y,
                this._baseRotation.z + sway
            );
        }

        if (this._glowMaterial) {
            const flicker = 0.15 + 0.1 * Math.sin(this._time * 3.1) + 0.05 * Math.sin(this._time * 13.3);
            this._glowMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.6 + flicker, 0.6, 1.35);
        }

        if (this._virtualLight) {
            const baseIntensity = this.params.lightIntensity || 1.2;
            const modulation = 0.4 * Math.sin(this._time * 2.5);
            this._virtualLight.intensity = THREE.MathUtils.clamp(
                baseIntensity + modulation,
                baseIntensity * 0.6,
                baseIntensity * 1.4
            );
        }
    }
}

EntityRegistry.register('parkingMeter', ParkingMeterEntity);
