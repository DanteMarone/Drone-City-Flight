import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class PowerTransformerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'powerTransformer';
        this._time = Math.random() * Math.PI * 2;
        this._indicatorMaterial = null;
        this._lightHandle = null;
        this._lightLocalPos = null;
    }

    static get displayName() { return 'Power Transformer'; }

    createMesh(params) {
        const group = new THREE.Group();

        const padSize = params.padSize || { x: 3.6, y: 0.22, z: 2.4 };
        const padTex = TextureGenerator.createConcrete();
        padTex.wrapS = THREE.RepeatWrapping;
        padTex.wrapT = THREE.RepeatWrapping;
        padTex.repeat.set(2.5, 2.5);

        const padMat = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            map: padTex,
            roughness: 0.9,
            metalness: 0.08
        });
        const pad = new THREE.Mesh(
            new THREE.BoxGeometry(padSize.x, padSize.y, padSize.z),
            padMat
        );
        pad.position.y = padSize.y / 2;
        pad.castShadow = true;
        pad.receiveShadow = true;
        group.add(pad);

        const plinthMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.7,
            metalness: 0.2
        });
        const plinth = new THREE.Mesh(
            new THREE.BoxGeometry(padSize.x * 0.9, 0.08, padSize.z * 0.9),
            plinthMat
        );
        plinth.position.y = pad.position.y + 0.05;
        plinth.receiveShadow = true;
        group.add(plinth);

        const createCabinet = (offsetX = 0) => {
            const cabinet = new THREE.Group();
            cabinet.position.x = offsetX;

            const bodyGeo = new THREE.BoxGeometry(1.2, 1.12, 0.92);
            const ventTex = TextureGenerator.createBuildingFacade({
                color: '#5b6470',
                windowColor: '#2f343b',
                floors: 5,
                cols: 4,
                width: 256,
                height: 256
            });
            ventTex.wrapS = THREE.RepeatWrapping;
            ventTex.wrapT = THREE.RepeatWrapping;
            ventTex.repeat.set(1.6, 1.4);

            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0x6b7684,
                map: ventTex,
                roughness: 0.55,
                metalness: 0.28
            });

            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.56;
            body.castShadow = true;
            body.receiveShadow = true;
            cabinet.add(body);

            const cap = new THREE.Mesh(
                new THREE.BoxGeometry(1.25, 0.1, 0.98),
                new THREE.MeshStandardMaterial({
                    color: 0x4b5563,
                    roughness: 0.5,
                    metalness: 0.4
                })
            );
            cap.position.y = body.position.y + bodyGeo.parameters.height / 2 + 0.05;
            cap.castShadow = true;
            cabinet.add(cap);
            const capTop = cap.position.y + cap.geometry.parameters.height / 2;

            const finGeo = new THREE.BoxGeometry(0.04, 0.9, 0.84);
            const finMat = new THREE.MeshStandardMaterial({
                color: 0x3f4752,
                roughness: 0.65,
                metalness: 0.15
            });
            for (let i = -2; i <= 2; i++) {
                const fin = new THREE.Mesh(finGeo, finMat);
                fin.position.set((i / 3) * bodyGeo.parameters.width * 0.82, body.position.y, bodyGeo.parameters.depth / 2 + 0.02);
                fin.castShadow = true;
                cabinet.add(fin);

                const finBack = fin.clone();
                finBack.position.z = -bodyGeo.parameters.depth / 2 - 0.02;
                cabinet.add(finBack);
            }

            const bushingMat = new THREE.MeshStandardMaterial({
                color: 0xd9d9d6,
                roughness: 0.35,
                metalness: 0.2
            });
            for (let i = -1; i <= 1; i++) {
                const insulator = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.08, 0.1, 0.22, 12),
                    bushingMat
                );
                insulator.position.set(i * 0.3, cap.position.y + 0.18, 0);
                insulator.castShadow = true;
                cabinet.add(insulator);

                const terminal = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08, 12, 12),
                    new THREE.MeshStandardMaterial({
                        color: 0xf1c40f,
                        roughness: 0.35,
                        metalness: 0.5
                    })
                );
                terminal.position.copy(insulator.position).setY(insulator.position.y + 0.16);
                terminal.castShadow = true;
                cabinet.add(terminal);
            }

            const cautionPlate = new THREE.Mesh(
                new THREE.BoxGeometry(0.32, 0.16, 0.02),
                new THREE.MeshStandardMaterial({
                    color: 0xf59e0b,
                    emissive: new THREE.Color(0xfbbf24),
                    emissiveIntensity: 0.25,
                    roughness: 0.4,
                    metalness: 0.25
                })
            );
            cautionPlate.position.set(0, 0.46, bodyGeo.parameters.depth / 2 + 0.03);
            cautionPlate.castShadow = false;
            cabinet.add(cautionPlate);

            const handle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.28, 10),
                new THREE.MeshStandardMaterial({
                    color: 0xcfd4da,
                    roughness: 0.35,
                    metalness: 0.65
                })
            );
            handle.rotation.z = Math.PI / 2;
            handle.position.set(0.36, 0.34, bodyGeo.parameters.depth / 2 + 0.04);
            cabinet.add(handle);

            return { group: cabinet, topY: capTop };
        };

        const spacing = params.cabinetSpacing || 1.4;
        const leftCabinet = createCabinet(-spacing / 2);
        const rightCabinet = createCabinet(spacing / 2);
        group.add(leftCabinet.group);
        group.add(rightCabinet.group);

        const busMat = new THREE.MeshStandardMaterial({
            color: 0x8d99ae,
            roughness: 0.6,
            metalness: 0.5
        });
        const bus = new THREE.Mesh(new THREE.BoxGeometry(spacing + 0.4, 0.08, 0.12), busMat);
        const busHeight = Math.max(leftCabinet.topY, rightCabinet.topY) + 0.08;
        bus.position.set(0, busHeight, 0.2);
        bus.castShadow = true;
        group.add(bus);

        const guardRail = new THREE.Mesh(
            new THREE.BoxGeometry(spacing + 2.4, 0.12, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8, metalness: 0.15 })
        );
        guardRail.position.set(0, 0.34, -(padSize.z / 2) + 0.12);
        guardRail.castShadow = true;
        group.add(guardRail);

        const indicatorColor = params.lightColor || 0x7ed9ff;
        const beaconStand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.45, 10),
            new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.65, metalness: 0.25 })
        );
        beaconStand.position.set(0, 0.68, 0.62);
        beaconStand.castShadow = true;
        group.add(beaconStand);

        this._indicatorMaterial = new THREE.MeshStandardMaterial({
            color: indicatorColor,
            emissive: new THREE.Color(indicatorColor),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.7
        });
        const beacon = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.16, 6, 12), this._indicatorMaterial);
        beacon.position.copy(beaconStand.position).setY(beaconStand.position.y + 0.35);
        beacon.castShadow = false;
        group.add(beacon);

        this._lightLocalPos = beacon.position.clone();

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this._lightLocalPos && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(
                worldPos,
                this.params.lightColor || 0x7ed9ff,
                this.params.lightIntensity || 1.4,
                14
            );

            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.4 + 0.25 * Math.sin(this._time * 2.6) + 0.15 * Math.sin(this._time * 9.1);

        if (this._indicatorMaterial) {
            this._indicatorMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.7 + pulse, 0.7, 1.6);
        }

        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity || 1.4;
            const modulated = THREE.MathUtils.clamp(baseIntensity * (0.9 + pulse * 0.5), baseIntensity * 0.6, baseIntensity * 1.7);
            this._lightHandle.intensity = modulated;
        }
    }
}

EntityRegistry.register('powerTransformer', PowerTransformerEntity);
