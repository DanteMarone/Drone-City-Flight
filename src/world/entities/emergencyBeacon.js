import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const RED_COLOR = new THREE.Color(0xff3b30);
const BLUE_COLOR = new THREE.Color(0x4da3ff);

export class EmergencyBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'emergencyBeacon';
        this._time = Math.random() * Math.PI * 2;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._baseRotation = new THREE.Euler();
        this._lensMaterials = [];
        this._blendColor = new THREE.Color();
    }

    static get displayName() { return 'Emergency Beacon'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 2.6;
        const baseHeight = 0.3;
        const columnHeight = height - baseHeight - 0.55;

        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.wrapS = THREE.RepeatWrapping;
        concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.repeat.set(1.2, 0.8);

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.15
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, baseHeight, 16), baseMat);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.2, 14), baseMat);
        plinth.position.y = base.position.y + baseHeight / 2 + 0.1;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        group.add(plinth);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.45,
            metalness: 0.65
        });
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, columnHeight, 14), columnMat);
        column.position.y = plinth.position.y + columnHeight / 2 + 0.1;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const accentRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 18), new THREE.MeshStandardMaterial({
            color: 0xb91c1c,
            emissive: new THREE.Color(0xb91c1c),
            emissiveIntensity: 0.45,
            roughness: 0.35,
            metalness: 0.55
        }));
        accentRing.rotation.x = Math.PI / 2;
        accentRing.position.y = column.position.y - columnHeight / 2 + 0.08;
        group.add(accentRing);

        const panelGroup = new THREE.Group();
        panelGroup.position.set(0, column.position.y + 0.08, 0.18);
        group.add(panelGroup);

        const panelBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.62, 0.18),
            new THREE.MeshStandardMaterial({ color: 0x232936, roughness: 0.55, metalness: 0.45 })
        );
        panelBody.castShadow = true;
        panelBody.receiveShadow = true;
        panelGroup.add(panelBody);

        const grille = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.12, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.35, metalness: 0.65 })
        );
        grille.position.set(0, 0.16, 0.1);
        panelGroup.add(grille);

        const panelTex = TextureGenerator.createBuildingFacade({
            color: '#0f172a',
            windowColor: '#d1d5db',
            floors: 6,
            cols: 2,
            width: 128,
            height: 128
        });
        const panelScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.26, 0.32),
            new THREE.MeshStandardMaterial({
                map: panelTex,
                emissive: new THREE.Color(0x9ca3af),
                emissiveIntensity: 0.35,
                roughness: 0.4,
                metalness: 0.2
            })
        );
        panelScreen.position.set(0, -0.04, 0.1 + 0.001);
        panelGroup.add(panelScreen);

        const badge = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.2, 0.04),
            new THREE.MeshStandardMaterial({
                color: 0x1d4ed8,
                emissive: new THREE.Color(0x60a5fa),
                emissiveIntensity: 0.6,
                roughness: 0.35,
                metalness: 0.4
            })
        );
        badge.position.set(-0.16, -0.1, 0.09);
        badge.castShadow = true;
        panelGroup.add(badge);

        const speakerConeGeo = new THREE.ConeGeometry(0.08, 0.14, 10, 1, true);
        const speakerMat = new THREE.MeshStandardMaterial({
            color: 0xe5e7eb,
            roughness: 0.4,
            metalness: 0.35,
            side: THREE.DoubleSide
        });
        const speakerLeft = new THREE.Mesh(speakerConeGeo, speakerMat);
        speakerLeft.rotation.z = Math.PI;
        speakerLeft.position.set(-0.16, 0.18, -0.02);
        panelGroup.add(speakerLeft);

        const speakerRight = speakerLeft.clone();
        speakerRight.position.x = 0.16;
        panelGroup.add(speakerRight);

        const headGroup = new THREE.Group();
        headGroup.position.y = column.position.y + columnHeight / 2 + 0.18;
        group.add(headGroup);

        const headBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.16, 16), columnMat);
        headBase.position.y = 0.08;
        headBase.castShadow = true;
        headBase.receiveShadow = true;
        headGroup.add(headBase);

        const cageMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.7 });
        const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12, 1, true), cageMat);
        cage.position.y = 0.16;
        headGroup.add(cage);

        const lensGroup = new THREE.Group();
        lensGroup.position.y = 0.16;
        headGroup.add(lensGroup);

        const lensMatRed = new THREE.MeshStandardMaterial({
            color: RED_COLOR,
            emissive: RED_COLOR.clone(),
            emissiveIntensity: 0.9,
            roughness: 0.15,
            metalness: 0.1,
            transparent: true,
            opacity: 0.75
        });
        const lensMatBlue = new THREE.MeshStandardMaterial({
            color: BLUE_COLOR,
            emissive: BLUE_COLOR.clone(),
            emissiveIntensity: 0.9,
            roughness: 0.15,
            metalness: 0.1,
            transparent: true,
            opacity: 0.75
        });
        this._lensMaterials.push(lensMatRed, lensMatBlue);

        const lensHeight = 0.32;
        const lensGeo = new THREE.BoxGeometry(0.16, lensHeight, 0.32);

        const lensRed = new THREE.Mesh(lensGeo, lensMatRed);
        lensRed.position.set(-0.09, lensHeight / 2, 0);
        lensGroup.add(lensRed);

        const lensBlue = new THREE.Mesh(lensGeo, lensMatBlue);
        lensBlue.position.set(0.09, lensHeight / 2, 0);
        lensGroup.add(lensBlue);

        const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.4,
            metalness: 0.65
        }));
        topCap.position.y = lensHeight + 0.14;
        headGroup.add(topCap);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            roughness: 0.35,
            metalness: 0.7
        }));
        antenna.position.y = topCap.position.y + 0.18;
        headGroup.add(antenna);

        const beaconTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.1
        }));
        beaconTip.position.y = antenna.position.y + 0.16;
        headGroup.add(beaconTip);

        this._lightAnchor.set(0, headGroup.position.y + lensHeight, 0);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation.copy(this.mesh.rotation);
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            const baseIntensity = this.params.lightIntensity || 1.4;
            this._lightHandle = lightSystem.register(worldPos, RED_COLOR, baseIntensity, 16);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const sway = Math.sin(this._time * 0.7 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.5);
        this.mesh.rotation.set(this._baseRotation.x, this._baseRotation.y, this._baseRotation.z + sway);

        const pulse = 0.5 + 0.5 * Math.sin(this._time * 3.2);
        const redStrength = THREE.MathUtils.lerp(1.4, 0.2, pulse);
        const blueStrength = THREE.MathUtils.lerp(0.2, 1.4, pulse);

        if (this._lensMaterials[0]) {
            this._lensMaterials[0].emissiveIntensity = redStrength;
        }
        if (this._lensMaterials[1]) {
            this._lensMaterials[1].emissiveIntensity = blueStrength;
        }

        if (this._lightHandle) {
            this._blendColor.lerpColors(RED_COLOR, BLUE_COLOR, pulse);
            this._lightHandle.color.copy(this._blendColor);
            const baseIntensity = this.params.lightIntensity || 1.4;
            const flash = 0.6 + 0.7 * Math.sin(this._time * 6.4);
            this._lightHandle.intensity = THREE.MathUtils.clamp(baseIntensity + flash, 0.6, 3.0);
        }
    }
}

EntityRegistry.register('emergencyBeacon', EmergencyBeaconEntity);
