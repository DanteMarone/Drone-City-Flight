import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createRackTexture(baseColor, accentColor) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    for (let i = -size; i < size * 2; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let i = 0; i < 70; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 2.5 + 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class BikeRackEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'bikeRack';
        this._blinkTime = Math.random() * Math.PI * 2;
        this._statusLights = [];
    }

    static get displayName() { return 'Bike Rack'; }

    createMesh(params) {
        const group = new THREE.Group();

        const rackLength = params.length || 3 + Math.random() * 1.2;
        const rackWidth = params.width || 1.2;
        const rackHeight = params.height || 1.1 + Math.random() * 0.3;
        const railRadius = 0.06;

        const concreteColor = new THREE.Color().setHSL(0.58, 0.08, 0.35 + Math.random() * 0.1);
        const stripeColor = new THREE.Color().setHSL(0.1, 0.6, 0.55);
        const deckTexture = createRackTexture(`#${concreteColor.getHexString()}`, `#${stripeColor.getHexString()}`);
        const baseMat = new THREE.MeshStandardMaterial({
            map: deckTexture,
            roughness: 0.85,
            metalness: 0.05
        });
        const baseGeo = new THREE.BoxGeometry(rackLength, 0.12, rackWidth);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = baseGeo.parameters.height / 2;
        base.receiveShadow = true;
        group.add(base);

        const metalColor = new THREE.Color().setHSL(0.6 + Math.random() * 0.05, 0.18, 0.52);
        const metalMat = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.35, metalness: 0.8 });
        const accentColor = new THREE.Color().setHSL(0.52 + Math.random() * 0.08, 0.7, 0.6);
        const accentMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor.clone().offsetHSL(0, 0, 0.2),
            emissiveIntensity: 0.6,
            roughness: 0.35,
            metalness: 0.2
        });

        const hoopCount = Math.max(3, Math.min(5, Math.floor(rackLength / 0.8)));
        const spacing = rackLength / (hoopCount + 1);

        for (let i = 0; i < hoopCount; i++) {
            const hoopGroup = new THREE.Group();
            const xPos = -rackLength / 2 + spacing * (i + 1);

            const legGeo = new THREE.CylinderGeometry(railRadius, railRadius, rackHeight * 0.85, 16);
            const leftLeg = new THREE.Mesh(legGeo, metalMat);
            leftLeg.position.set(-rackWidth * 0.25, legGeo.parameters.height / 2, xPos);
            leftLeg.castShadow = true;
            leftLeg.receiveShadow = true;
            hoopGroup.add(leftLeg);

            const rightLeg = leftLeg.clone();
            rightLeg.position.x = rackWidth * 0.25;
            hoopGroup.add(rightLeg);

            const archGeo = new THREE.TorusGeometry(rackWidth * 0.25, railRadius, 14, 24, Math.PI);
            const arch = new THREE.Mesh(archGeo, metalMat);
            arch.rotation.z = Math.PI / 2;
            arch.position.set(0, rackHeight * 0.85, xPos);
            arch.castShadow = true;
            arch.receiveShadow = true;
            hoopGroup.add(arch);

            group.add(hoopGroup);
        }

        const topRailGeo = new THREE.CylinderGeometry(railRadius * 0.8, railRadius * 0.8, rackLength * 0.92, 16);
        const topRail = new THREE.Mesh(topRailGeo, metalMat);
        topRail.rotation.z = Math.PI / 2;
        topRail.position.set(0, rackHeight * 0.78, 0);
        topRail.castShadow = true;
        topRail.receiveShadow = true;
        group.add(topRail);

        const lockingBarGeo = new THREE.BoxGeometry(rackLength * 0.75, 0.1, rackWidth * 0.08);
        const lockingBar = new THREE.Mesh(lockingBarGeo, metalMat);
        lockingBar.position.set(0, rackHeight * 0.45, 0);
        lockingBar.castShadow = true;
        lockingBar.receiveShadow = true;
        group.add(lockingBar);

        const controlGeo = new THREE.BoxGeometry(0.2, 0.35, 0.18);
        const controlHousing = new THREE.Mesh(controlGeo, metalMat);
        controlHousing.position.set(rackLength * 0.45, controlGeo.parameters.height / 2 + 0.08, 0);
        controlHousing.castShadow = true;
        controlHousing.receiveShadow = true;
        group.add(controlHousing);

        const statusGeo = new THREE.SphereGeometry(0.07, 12, 10);
        const statusLight = new THREE.Mesh(statusGeo, accentMat.clone());
        statusLight.position.set(controlHousing.position.x + 0.14, controlHousing.position.y + 0.05, 0);
        statusLight.castShadow = true;
        group.add(statusLight);
        this._statusLights.push(statusLight);

        const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 12);
        const antenna = new THREE.Mesh(antennaGeo, metalMat);
        antenna.position.set(controlHousing.position.x, controlHousing.position.y + controlGeo.parameters.height / 2 + antennaGeo.parameters.height / 2, 0);
        antenna.castShadow = true;
        antenna.receiveShadow = true;
        group.add(antenna);

        return group;
    }

    update(dt) {
        this._blinkTime += dt * 2.2;
        const intensity = 0.4 + (Math.sin(this._blinkTime) + 1) * 0.35;
        this._statusLights.forEach((light) => {
            if (light.material) {
                light.material.emissiveIntensity = intensity;
            }
        });
    }
}

EntityRegistry.register('bikeRack', BikeRackEntity);
