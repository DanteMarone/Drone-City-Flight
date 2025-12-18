import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class LifeguardTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'lifeguardTower';
        this._time = 0;
        this._flagCloth = null;
        this._lightHandle = null;
        this._lightLocalPos = null;
        this._windowMaterial = null;
        this._baseRotation = this.rotation.clone();
        this._seed = params.seed || Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Lifeguard Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const platformHeight = params.platformHeight || 2.3;
        const deckSize = { width: 4.4, depth: 3.2 };

        const stiltMaterial = new THREE.MeshStandardMaterial({
            color: 0xb4b4b4,
            roughness: 0.7,
            metalness: 0.15,
            map: TextureGenerator.createConcrete()
        });

        const stiltGeo = new THREE.CylinderGeometry(0.16, 0.18, platformHeight + 0.4, 10);
        const stiltPositions = [
            [-deckSize.width / 2 + 0.4, -deckSize.depth / 2 + 0.4],
            [deckSize.width / 2 - 0.4, -deckSize.depth / 2 + 0.4],
            [-deckSize.width / 2 + 0.4, deckSize.depth / 2 - 0.4],
            [deckSize.width / 2 - 0.4, deckSize.depth / 2 - 0.4]
        ];
        stiltPositions.forEach(([x, z]) => {
            const stilt = new THREE.Mesh(stiltGeo, stiltMaterial);
            stilt.position.set(x, (platformHeight + 0.4) / 2, z);
            stilt.castShadow = true;
            stilt.receiveShadow = true;
            group.add(stilt);
        });

        const braceMaterial = new THREE.MeshStandardMaterial({ color: 0x9c9c9c, roughness: 0.55, metalness: 0.25 });
        const braceGeo = new THREE.BoxGeometry(deckSize.width - 0.8, 0.12, 0.3);
        const brace1 = new THREE.Mesh(braceGeo, braceMaterial);
        brace1.position.y = 0.45;
        group.add(brace1);
        const brace2 = brace1.clone();
        brace2.position.y = platformHeight - 0.35;
        group.add(brace2);

        const deckTexture = TextureGenerator.createSand();
        deckTexture.repeat.set(2, 2);
        const deckMaterial = new THREE.MeshStandardMaterial({
            color: 0xdfc59a,
            map: deckTexture,
            roughness: 0.55,
            metalness: 0.05
        });

        const deck = new THREE.Mesh(new THREE.BoxGeometry(deckSize.width, 0.22, deckSize.depth), deckMaterial);
        deck.position.y = platformHeight;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const railingMaterial = new THREE.MeshStandardMaterial({ color: 0xd8e2ec, roughness: 0.35, metalness: 0.1 });
        const railGeo = new THREE.CylinderGeometry(0.06, 0.06, deckSize.width - 0.4, 8);
        const railsY = platformHeight + 0.65;
        const railFront = new THREE.Mesh(railGeo, railingMaterial);
        railFront.rotation.z = Math.PI / 2;
        railFront.position.set(0, railsY, deckSize.depth / 2 - 0.12);
        group.add(railFront);
        const railBack = railFront.clone();
        railBack.position.z = -deckSize.depth / 2 + 0.12;
        group.add(railBack);

        const sideRailGeo = new THREE.CylinderGeometry(0.06, 0.06, deckSize.depth - 0.4, 8);
        const railLeft = new THREE.Mesh(sideRailGeo, railingMaterial);
        railLeft.rotation.x = Math.PI / 2;
        railLeft.position.set(-deckSize.width / 2 + 0.12, railsY, 0);
        group.add(railLeft);
        const railRight = railLeft.clone();
        railRight.position.x = deckSize.width / 2 - 0.12;
        group.add(railRight);

        const wallTexture = TextureGenerator.createBuildingFacade({
            color: '#e5f5ff',
            windowColor: '#b4f0ff',
            floors: 3,
            cols: 3,
            width: 256,
            height: 256
        });
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: wallTexture,
            roughness: 0.5,
            metalness: 0.1,
            emissive: new THREE.Color(0x9ddcff),
            emissiveIntensity: 0.35
        });
        this._windowMaterial = wallMaterial;

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.7, 2.1), wallMaterial);
        cabin.position.set(0, platformHeight + 0.85, 0);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);

        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x1c7fa6, roughness: 0.35, metalness: 0.25 });
        const roof = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.24, 2.5), roofMaterial);
        roof.position.set(0, platformHeight + 1.7, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        const awning = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.8), new THREE.MeshStandardMaterial({
            color: 0xfff3c4,
            roughness: 0.4,
            metalness: 0.05
        }));
        awning.position.set(0, platformHeight + 1.2, deckSize.depth / 2 - 0.2);
        awning.castShadow = true;
        awning.receiveShadow = true;
        group.add(awning);

        const stairGroup = new THREE.Group();
        const steps = 6;
        const stepDepth = 0.45;
        const stepRise = platformHeight / (steps + 2);
        for (let i = 0; i < steps; i++) {
            const step = new THREE.Mesh(
                new THREE.BoxGeometry(1.4, 0.12, stepDepth),
                deckMaterial
            );
            step.position.set(0, 0.06 + i * stepRise, deckSize.depth / 2 + 0.2 + i * (stepDepth - 0.05));
            step.castShadow = true;
            step.receiveShadow = true;
            stairGroup.add(step);
        }
        stairGroup.position.y = 0;
        group.add(stairGroup);

        const stairRailGeo = new THREE.CylinderGeometry(0.05, 0.05, steps * stepRise + 0.6, 6);
        const stairRailMat = new THREE.MeshStandardMaterial({ color: 0xeaf2f8, roughness: 0.4, metalness: 0.12 });
        const leftRail = new THREE.Mesh(stairRailGeo, stairRailMat);
        leftRail.rotation.z = Math.PI / 2.2;
        leftRail.position.set(-0.75, platformHeight / 2, deckSize.depth / 2 + steps * 0.35);
        stairGroup.add(leftRail);
        const rightRail = leftRail.clone();
        rightRail.position.x = 0.75;
        stairGroup.add(rightRail);

        const rescueBoard = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 1.5, 0.12),
            new THREE.MeshStandardMaterial({ color: 0xff5f57, roughness: 0.3, metalness: 0.25 })
        );
        rescueBoard.position.set(deckSize.width / 2 - 0.4, platformHeight + 0.75, -deckSize.depth / 2 + 0.3);
        rescueBoard.rotation.z = Math.PI / 12;
        rescueBoard.rotation.x = Math.PI / 2;
        group.add(rescueBoard);

        const flagPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.6 })
        );
        flagPole.position.set(-deckSize.width / 2 + 0.3, platformHeight + 1.1, deckSize.depth / 2 - 0.3);
        flagPole.castShadow = true;
        group.add(flagPole);

        const flagGroup = new THREE.Group();
        flagGroup.position.set(flagPole.position.x, platformHeight + 2.1, flagPole.position.z);
        const flagCloth = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.5),
            new THREE.MeshStandardMaterial({
                color: 0xffc857,
                emissive: new THREE.Color(0xffb347),
                emissiveIntensity: 0.2,
                side: THREE.DoubleSide,
                roughness: 0.35,
                metalness: 0.05
            })
        );
        flagCloth.position.x = 0.45;
        flagGroup.add(flagCloth);
        this._flagCloth = flagCloth;
        group.add(flagGroup);

        this._lightLocalPos = new THREE.Vector3(0, platformHeight + 1.1, deckSize.depth / 2 - 0.05);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation = this.mesh.rotation.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, 0xffd8a8, this.params.lightIntensity || 2.4, 18);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 0.5 + this._seed) * THREE.MathUtils.degToRad(1.4);
        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x + sway * 0.25,
                this._baseRotation.y,
                this._baseRotation.z + sway * 0.6
            );
        }

        if (this._flagCloth) {
            this._flagCloth.rotation.y = Math.sin(this._time * 3.3 + this._seed) * 0.35;
            this._flagCloth.position.y = Math.sin(this._time * 2.8 + this._seed) * 0.05;
        }

        if (this._windowMaterial) {
            const glow = 0.3 + 0.1 * Math.sin(this._time * 1.8 + this._seed);
            this._windowMaterial.emissiveIntensity = glow;
        }

        if (this._lightHandle) {
            const base = this.params.lightIntensity || 2.4;
            const pulse = 0.25 * Math.sin(this._time * 2.4 + this._seed);
            this._lightHandle.intensity = THREE.MathUtils.clamp(base + pulse, base * 0.7, base * 1.3);
        }
    }
}

EntityRegistry.register('lifeguardTower', LifeguardTowerEntity);
