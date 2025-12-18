import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class LifeguardTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'lifeguardTower';
        this._time = Math.random() * 100;
        this._baseRotation = this.rotation.clone();
        this._lightHandle = null;
        this._beaconMaterial = null;
        this._lightLocalPos = null;
    }

    static get displayName() { return 'Lifeguard Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const deckHeight = params.deckHeight || 1.6 + Math.random() * 0.3;
        const platformWidth = params.platformWidth || 1.8;
        const platformDepth = params.platformDepth || 1.4;
        this.params.deckHeight = deckHeight;
        this.params.platformWidth = platformWidth;
        this.params.platformDepth = platformDepth;

        const sandTex = TextureGenerator.createSand();
        const sandMaterial = new THREE.MeshStandardMaterial({
            map: sandTex,
            color: 0xf5e6c8,
            roughness: 0.9,
            metalness: 0.05
        });

        const dune = new THREE.Mesh(
            new THREE.CylinderGeometry((platformWidth + platformDepth) / 2.2, (platformWidth + platformDepth) / 2.4, 0.14, 24),
            sandMaterial
        );
        dune.position.y = 0.07;
        dune.receiveShadow = true;
        group.add(dune);

        const woodTex = TextureGenerator.createBuildingFacade({
            color: '#d3b58b',
            windowColor: '#b07d52',
            floors: 6,
            cols: 2,
            width: 128,
            height: 128
        });
        woodTex.wrapS = THREE.RepeatWrapping;
        woodTex.wrapT = THREE.RepeatWrapping;
        woodTex.repeat.set(2, 2);
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0xe3c8a2,
            map: woodTex,
            roughness: 0.65,
            metalness: 0.15
        });

        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0xc79768,
            roughness: 0.7,
            metalness: 0.12
        });

        const legGeo = new THREE.CylinderGeometry(0.08, 0.1, deckHeight + 0.15, 10);
        const legPositions = [
            [platformWidth * 0.45, platformDepth * 0.45],
            [-platformWidth * 0.45, platformDepth * 0.45],
            [platformWidth * 0.45, -platformDepth * 0.45],
            [-platformWidth * 0.45, -platformDepth * 0.45]
        ];
        legPositions.forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeo, pillarMaterial);
            leg.position.set(x, (deckHeight + 0.15) / 2, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        });

        const braceGeo = new THREE.BoxGeometry(platformWidth * 0.92, 0.06, 0.08);
        const braceMaterial = new THREE.MeshStandardMaterial({
            color: 0xba8857,
            roughness: 0.7,
            metalness: 0.08
        });
        const braceYOffset = deckHeight * 0.4;
        const braceFront = new THREE.Mesh(braceGeo, braceMaterial);
        braceFront.position.set(0, braceYOffset, platformDepth * 0.45);
        braceFront.rotation.z = THREE.MathUtils.degToRad(10);
        group.add(braceFront);

        const braceBack = braceFront.clone();
        braceBack.position.z = -platformDepth * 0.45;
        braceBack.rotation.z = -THREE.MathUtils.degToRad(10);
        group.add(braceBack);

        const deck = new THREE.Mesh(
            new THREE.BoxGeometry(platformWidth, 0.18, platformDepth),
            woodMaterial
        );
        deck.position.y = deckHeight;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const railGeo = new THREE.BoxGeometry(platformWidth, 0.06, 0.05);
        const railHeight = deckHeight + 0.4;
        const railFront = new THREE.Mesh(railGeo, pillarMaterial);
        railFront.position.set(0, railHeight, platformDepth * 0.5);
        group.add(railFront);

        const railBack = railFront.clone();
        railBack.position.z = -platformDepth * 0.5;
        group.add(railBack);

        const railSideGeo = new THREE.BoxGeometry(platformDepth, 0.06, 0.05);
        const railLeft = new THREE.Mesh(railSideGeo, pillarMaterial);
        railLeft.rotation.y = Math.PI / 2;
        railLeft.position.set(-platformWidth * 0.5, railHeight, 0);
        group.add(railLeft);

        const railRight = railLeft.clone();
        railRight.position.x = platformWidth * 0.5;
        group.add(railRight);

        const cabinTex = TextureGenerator.createBuildingFacade({
            color: '#f4efe2',
            windowColor: '#2f7abf',
            floors: 2,
            cols: 4,
            width: 256,
            height: 256
        });
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: cabinTex,
            roughness: 0.55,
            metalness: 0.15
        });
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(platformWidth * 0.9, 0.9, platformDepth * 0.65),
            cabinMaterial
        );
        cabin.position.set(0, deckHeight + 0.45, -platformDepth * 0.05);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);

        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x4db6ac,
            roughness: 0.45,
            metalness: 0.08
        });
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(platformWidth * 0.95, 0.14, platformDepth * 0.85),
            roofMaterial
        );
        roof.position.set(0, cabin.position.y + 0.55, -platformDepth * 0.05);
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(platformWidth * 0.9, 0.08, 0.24),
            roofMaterial
        );
        awning.position.set(0, cabin.position.y + 0.3, platformDepth * 0.45);
        awning.castShadow = true;
        group.add(awning);

        const ladderGroup = new THREE.Group();
        const ladderLength = deckHeight + 0.25;
        const railGeometry = new THREE.BoxGeometry(0.05, ladderLength, 0.05);
        const leftRail = new THREE.Mesh(railGeometry, pillarMaterial);
        leftRail.position.set(-0.2, ladderLength / 2, 0);
        leftRail.castShadow = true;
        ladderGroup.add(leftRail);

        const rightRail = leftRail.clone();
        rightRail.position.x = 0.2;
        ladderGroup.add(rightRail);

        const rungGeometry = new THREE.BoxGeometry(0.45, 0.04, 0.05);
        for (let i = 0; i < 6; i++) {
            const rung = new THREE.Mesh(rungGeometry, woodMaterial);
            const y = 0.15 + i * (ladderLength / 6);
            rung.position.set(0, y, 0);
            rung.castShadow = true;
            ladderGroup.add(rung);
        }
        ladderGroup.rotation.z = -THREE.MathUtils.degToRad(22);
        ladderGroup.position.set(platformWidth * 0.58, 0.02, platformDepth * 0.35);
        group.add(ladderGroup);

        const beaconBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.07, 0.14, 12),
            pillarMaterial
        );
        beaconBase.position.set(0, roof.position.y + 0.14, -platformDepth * 0.05);
        beaconBase.castShadow = true;
        group.add(beaconBase);

        const beaconMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff3c4,
            emissive: new THREE.Color(0xffe8a3),
            emissiveIntensity: 1,
            roughness: 0.35,
            metalness: 0.1
        });
        this._beaconMaterial = beaconMaterial;

        const beaconLens = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12),
            beaconMaterial
        );
        beaconLens.position.copy(beaconBase.position).setY(beaconBase.position.y + 0.15);
        beaconLens.castShadow = true;
        group.add(beaconLens);

        const beaconCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
            pillarMaterial
        );
        beaconCap.scale.set(1, 0.6, 1);
        beaconCap.position.copy(beaconLens.position).setY(beaconLens.position.y + 0.12);
        beaconCap.castShadow = true;
        group.add(beaconCap);

        this._lightLocalPos = beaconCap.position.clone();

        const flagPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8),
            pillarMaterial
        );
        flagPole.position.set(-platformWidth * 0.45, roof.position.y + 0.3, -platformDepth * 0.05);
        group.add(flagPole);

        const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.34, 0.18),
            new THREE.MeshStandardMaterial({
                color: 0xff6b6b,
                side: THREE.DoubleSide,
                roughness: 0.4,
                metalness: 0.05
            })
        );
        flag.position.set(0, 0.3, 0);
        flag.rotation.y = Math.PI / 2;
        flagPole.add(flag);

        const buoyRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.14, 0.035, 8, 16),
            new THREE.MeshStandardMaterial({ color: 0xf26b38, roughness: 0.35, metalness: 0.05 })
        );
        buoyRing.position.set(-platformWidth * 0.55, deckHeight + 0.2, -platformDepth * 0.1);
        buoyRing.rotation.x = Math.PI / 2;
        buoyRing.castShadow = true;
        group.add(buoyRing);

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
            this._lightHandle = lightSystem.register(
                worldPos,
                0xffe8a3,
                this.params.lightIntensity || 1.6,
                18
            );

            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const sway = Math.sin(this._time * 0.4 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.3);
        const lean = Math.cos(this._time * 0.6 + 1.2) * THREE.MathUtils.degToRad(0.8);
        this.mesh.rotation.set(
            this._baseRotation.x + lean,
            this._baseRotation.y,
            this._baseRotation.z + sway
        );

        if (this._beaconMaterial) {
            const pulse = 0.5 + 0.5 * Math.sin(this._time * 3.2);
            this._beaconMaterial.emissiveIntensity = 0.9 + pulse * 0.8;
        }

        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity || 1.6;
            const modulation = 0.75 + 0.25 * Math.sin(this._time * 2.6);
            this._lightHandle.intensity = baseIntensity * modulation;
        }
    }
}

EntityRegistry.register('lifeguardTower', LifeguardTowerEntity);
