import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createDeckTexture(primary = '#2f3136', stripe = '#3f434a', accent = '#4fc0f5') {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = stripe;
    const stripeWidth = 14;
    for (let i = 0; i < size; i += stripeWidth * 2) {
        ctx.fillRect(0, i, size, stripeWidth);
    }

    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(size * 0.1, size * 0.75);
    ctx.lineTo(size * 0.9, size * 0.75);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class ScooterDockEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'scooterDock';
        this._blinkTime = 0;
        this._headlights = [];
        this._scooterData = [];
    }

    static get displayName() { return 'Scooter Dock'; }

    createMesh(params) {
        const group = new THREE.Group();

        const dockLength = 3 + Math.random() * 1.4;
        const dockWidth = 1.1;
        const dockHeight = 0.14;

        const deckTexture = createDeckTexture();
        const deckMat = new THREE.MeshStandardMaterial({
            map: deckTexture,
            roughness: 0.85,
            metalness: 0.05
        });
        const deckGeo = new THREE.BoxGeometry(dockLength, dockHeight, dockWidth);
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.y = dockHeight / 2;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const metalMat = new THREE.MeshStandardMaterial({ color: 0xaeb8c2, roughness: 0.35, metalness: 0.8 });
        const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1e1f23, roughness: 0.9, metalness: 0.05 });

        const anchorGeo = new THREE.CylinderGeometry(0.06, 0.08, dockHeight * 3.5, 14);
        const anchorLeft = new THREE.Mesh(anchorGeo, metalMat);
        anchorLeft.position.set(-dockLength / 2 + 0.15, anchorGeo.parameters.height / 2, -dockWidth * 0.3);
        anchorLeft.castShadow = true;
        anchorLeft.receiveShadow = true;
        group.add(anchorLeft);

        const anchorRight = anchorLeft.clone();
        anchorRight.position.x *= -1;
        group.add(anchorRight);

        const railGeo = new THREE.CylinderGeometry(0.05, 0.05, dockLength * 0.9, 16);
        const rail = new THREE.Mesh(railGeo, metalMat);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, anchorGeo.parameters.height * 0.7, -dockWidth * 0.3);
        rail.castShadow = true;
        rail.receiveShadow = true;
        group.add(rail);

        const bumperGeo = new THREE.BoxGeometry(dockLength, dockHeight * 0.5, dockWidth * 0.12);
        const bumper = new THREE.Mesh(bumperGeo, rubberMat);
        bumper.position.set(0, dockHeight * 0.75, dockWidth * 0.47);
        bumper.castShadow = true;
        bumper.receiveShadow = true;
        group.add(bumper);

        const scooterCount = Math.max(3, Math.min(5, Math.floor(3 + Math.random() * 3)));
        const spacing = dockLength / scooterCount;
        for (let i = 0; i < scooterCount; i++) {
            const hue = Math.random() * 0.15 + 0.5; // blues/purples
            const bodyColor = new THREE.Color().setHSL(hue, 0.55, 0.55 + (Math.random() - 0.5) * 0.08);
            const accentColor = new THREE.Color().setHSL(hue + 0.08, 0.75, 0.6 + (Math.random() - 0.5) * 0.1);
            const scooter = this._createScooter(bodyColor, accentColor, metalMat, rubberMat);
            const baseLean = (Math.random() - 0.5) * 0.14;
            const swayOffset = Math.random() * Math.PI * 2;
            scooter.position.set(-dockLength / 2 + spacing * (i + 0.5), dockHeight, 0);
            scooter.rotation.y = (Math.random() - 0.5) * 0.08;
            this._scooterData.push({ group: scooter, baseLean, swayOffset });
            group.add(scooter);
        }

        return group;
    }

    _createScooter(bodyColor, accentColor, metalMat, rubberMat) {
        const scooter = new THREE.Group();

        const deckGeo = new THREE.BoxGeometry(0.32, 0.05, 1.1);
        const deckMat = new THREE.MeshStandardMaterial({ color: bodyColor.clone().offsetHSL(0, 0, -0.08), roughness: 0.75, metalness: 0.2 });
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.y = deckGeo.parameters.height / 2;
        deck.castShadow = true;
        deck.receiveShadow = true;
        scooter.add(deck);

        const wheelGeo = new THREE.TorusGeometry(0.13, 0.04, 12, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.05 });
        const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
        frontWheel.rotation.x = Math.PI / 2;
        frontWheel.position.set(0, 0.13, deckGeo.parameters.depth / 2 - 0.1);
        frontWheel.castShadow = true;
        frontWheel.receiveShadow = true;
        scooter.add(frontWheel);

        const rearWheel = frontWheel.clone();
        rearWheel.position.z = -deckGeo.parameters.depth / 2 + 0.12;
        scooter.add(rearWheel);

        const stemHeight = 1.1 + Math.random() * 0.15;
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, stemHeight, 12);
        const stemMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.45, metalness: 0.65 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.set(0, stemHeight / 2 + deckGeo.parameters.height, deckGeo.parameters.depth / 2 - 0.2);
        stem.castShadow = true;
        stem.receiveShadow = true;
        scooter.add(stem);

        const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.55, 12);
        const handleMat = new THREE.MeshStandardMaterial({ color: metalMat.color.clone(), roughness: 0.4, metalness: 0.85 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, stem.position.y + stemHeight / 2 - 0.1, stem.position.z);
        handle.castShadow = true;
        handle.receiveShadow = true;
        scooter.add(handle);

        const gripGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.16, 8);
        const gripMat = new THREE.MeshStandardMaterial({ color: rubberMat.color.clone(), roughness: 0.9, metalness: 0.05 });
        const leftGrip = new THREE.Mesh(gripGeo, gripMat);
        leftGrip.rotation.z = Math.PI / 2;
        leftGrip.position.copy(handle.position).add(new THREE.Vector3(-0.35, 0, 0));
        leftGrip.castShadow = true;
        leftGrip.receiveShadow = true;
        scooter.add(leftGrip);

        const rightGrip = leftGrip.clone();
        rightGrip.position.x *= -1;
        scooter.add(rightGrip);

        const headlightGeo = new THREE.SphereGeometry(0.06, 12, 8);
        const headlightMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor.clone().offsetHSL(0, 0, 0.25),
            emissiveIntensity: 0.9,
            roughness: 0.3,
            metalness: 0.35
        });
        const headlight = new THREE.Mesh(headlightGeo, headlightMat);
        headlight.position.copy(stem.position).add(new THREE.Vector3(0, stemHeight / 2 - 0.18, stemGeo.parameters.radiusTop + 0.06));
        headlight.castShadow = true;
        scooter.add(headlight);
        this._headlights.push(headlight);

        const kickstandGeo = new THREE.BoxGeometry(0.04, 0.18, 0.1);
        const kickstand = new THREE.Mesh(kickstandGeo, metalMat);
        kickstand.position.set(-deckGeo.parameters.width / 2, kickstandGeo.parameters.height / 2, -0.1);
        kickstand.rotation.z = -Math.PI / 8;
        kickstand.castShadow = true;
        kickstand.receiveShadow = true;
        scooter.add(kickstand);

        const accentPanelGeo = new THREE.BoxGeometry(deckGeo.parameters.width * 0.8, deckGeo.parameters.height * 0.7, deckGeo.parameters.depth * 0.7);
        const accentPanelMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6, metalness: 0.35 });
        const accentPanel = new THREE.Mesh(accentPanelGeo, accentPanelMat);
        accentPanel.position.set(0, deckGeo.parameters.height + accentPanelGeo.parameters.height / 2, -0.05);
        accentPanel.castShadow = true;
        accentPanel.receiveShadow = true;
        scooter.add(accentPanel);

        return scooter;
    }

    update(dt) {
        this._blinkTime += dt;
        const pulse = (Math.sin(this._blinkTime * 3) + 1) / 2; // 0..1

        this._headlights.forEach(light => {
            light.material.emissiveIntensity = 0.7 + pulse * 0.9;
            const scale = 0.95 + pulse * 0.08;
            light.scale.setScalar(scale);
        });

        this._scooterData.forEach(({ group, baseLean, swayOffset }) => {
            const sway = Math.sin(this._blinkTime * 1.3 + swayOffset) * 0.04;
            group.rotation.z = baseLean + sway;
        });
    }
}

EntityRegistry.register('scooterDock', ScooterDockEntity);
