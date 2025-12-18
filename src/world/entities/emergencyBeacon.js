import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class EmergencyBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'emergencyBeacon';
        this._time = 0;
        this._redLightHandle = null;
        this._blueLightHandle = null;
        this._redLens = null;
        this._blueLens = null;
        this._spinner = null;
        this._redLightOffset = null;
        this._blueLightOffset = null;
    }

    static get displayName() { return 'Emergency Beacon'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseTex = TextureGenerator.createConcrete();
        baseTex.wrapS = THREE.RepeatWrapping;
        baseTex.wrapT = THREE.RepeatWrapping;
        baseTex.repeat.set(1, 1);

        const baseMat = new THREE.MeshStandardMaterial({
            map: baseTex,
            color: 0xb5b5b5,
            roughness: 0.85,
            metalness: 0.05
        });

        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x323a45,
            roughness: 0.35,
            metalness: 0.85
        });

        // Concrete footing
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.35, 16);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.175;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Metal pole
        const poleHeight = params.poleHeight || 2.2;
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.14, poleHeight, 16);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = base.position.y + baseGeo.parameters.height / 2 + poleHeight / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Accent ring near the top of the pole
        const ringGeo = new THREE.TorusGeometry(0.16, 0.03, 8, 16);
        const ring = new THREE.Mesh(ringGeo, poleMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = pole.position.y + poleHeight / 2 - 0.15;
        ring.castShadow = true;
        ring.receiveShadow = true;
        group.add(ring);

        // Speaker box with hazard striping
        const boxHeight = 0.7;
        const boxGeo = new THREE.BoxGeometry(0.55, boxHeight, 0.4);
        const stripeTex = TextureGenerator.createBuildingFacade({
            color: '#1d1f23',
            windowColor: '#f6c343',
            floors: 4,
            cols: 2,
            width: 256,
            height: 256
        });
        stripeTex.repeat.set(1, 1);
        const boxMat = new THREE.MeshStandardMaterial({
            map: stripeTex,
            color: 0x1b1d21,
            roughness: 0.5,
            metalness: 0.3
        });
        const speakerBox = new THREE.Mesh(boxGeo, boxMat);
        speakerBox.position.set(0, pole.position.y + poleHeight / 2 + boxHeight / 2, 0);
        speakerBox.castShadow = true;
        speakerBox.receiveShadow = true;
        group.add(speakerBox);

        // Top beacon housing
        const housingHeight = 0.6;
        const housingGeo = new THREE.BoxGeometry(0.9, housingHeight, 0.9);
        const housingMat = new THREE.MeshStandardMaterial({
            color: 0x101218,
            roughness: 0.35,
            metalness: 0.7
        });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.y = speakerBox.position.y + boxHeight / 2 + housingHeight / 2 + 0.05;
        housing.castShadow = true;
        housing.receiveShadow = true;
        group.add(housing);

        // Spinner base
        const spinnerBaseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12);
        this._spinner = new THREE.Mesh(spinnerBaseGeo, poleMat);
        this._spinner.position.y = housing.position.y + housingHeight / 2 + 0.12;
        this._spinner.castShadow = true;
        group.add(this._spinner);

        // Lenses for red/blue lights
        const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.18, 12);
        this._redLens = new THREE.Mesh(lensGeo, new THREE.MeshStandardMaterial({
            color: 0x7f1d1d,
            emissive: new THREE.Color(0xff3b30),
            emissiveIntensity: 0.2,
            roughness: 0.1,
            metalness: 0.15,
            transparent: true,
            opacity: 0.9
        }));
        this._redLens.rotation.z = Math.PI / 2;
        this._redLens.position.set(0.28, housing.position.y + 0.05, 0.18);
        this._redLens.castShadow = true;
        group.add(this._redLens);

        this._blueLens = new THREE.Mesh(lensGeo, new THREE.MeshStandardMaterial({
            color: 0x102a56,
            emissive: new THREE.Color(0x2e7bff),
            emissiveIntensity: 0.2,
            roughness: 0.1,
            metalness: 0.15,
            transparent: true,
            opacity: 0.9
        }));
        this._blueLens.rotation.z = Math.PI / 2;
        this._blueLens.position.set(-0.28, housing.position.y + 0.05, -0.18);
        this._blueLens.castShadow = true;
        group.add(this._blueLens);

        // Store local offsets for virtual lights
        this._redLightOffset = this._redLens.position.clone();
        this._blueLightOffset = this._blueLens.position.clone();

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._redLightOffset && this._blueLightOffset) {
            this.mesh.updateMatrixWorld(true);

            const redWorld = this._redLightOffset.clone().applyMatrix4(this.mesh.matrixWorld);
            const blueWorld = this._blueLightOffset.clone().applyMatrix4(this.mesh.matrixWorld);

            const redIntensity = this.params.redIntensity || 2.5;
            const blueIntensity = this.params.blueIntensity || 2.5;

            this._redLightHandle = lightSystem.register(redWorld, 0xff3b30, redIntensity, 18);
            this._blueLightHandle = lightSystem.register(blueWorld, 0x2e7bff, blueIntensity, 18);

            if (this._redLightHandle) this._redLightHandle.parentMesh = this.mesh;
            if (this._blueLightHandle) this._blueLightHandle.parentMesh = this.mesh;
        }
    }

    update(dt) {
        this._time += dt;

        const phase = this._time * 6.0;
        const redPulse = Math.max(0, Math.sin(phase));
        const bluePulse = Math.max(0, Math.sin(phase + Math.PI));

        if (this._spinner) {
            this._spinner.rotation.y += dt * 3.0;
        }

        if (this._redLens) {
            this._redLens.material.emissiveIntensity = 0.3 + redPulse * 1.2;
            this._redLens.scale.setScalar(0.95 + redPulse * 0.08);
        }

        if (this._blueLens) {
            this._blueLens.material.emissiveIntensity = 0.3 + bluePulse * 1.2;
            this._blueLens.scale.setScalar(0.95 + bluePulse * 0.08);
        }

        if (this._redLightHandle) {
            const base = this.params.redIntensity || 2.5;
            this._redLightHandle.intensity = base * (0.4 + redPulse * 0.9);
        }

        if (this._blueLightHandle) {
            const base = this.params.blueIntensity || 2.5;
            this._blueLightHandle.intensity = base * (0.4 + bluePulse * 0.9);
        }
    }
}

EntityRegistry.register('emergencyBeacon', EmergencyBeaconEntity);
