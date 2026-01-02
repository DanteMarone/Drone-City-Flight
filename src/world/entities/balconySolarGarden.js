import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 10);
const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);

export class BalconySolarGardenEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'balconySolarGarden';
        this.spinTime = 0;
        this.spinnerGroup = null;
        this.panelPivot = null;
        this.bulbs = [];
        this.panelTilt = params.panelTilt ?? (0.2 + Math.random() * 0.2);
        this.planterTint = params.planterTint ?? (Math.random() > 0.5 ? 0x7a4f32 : 0x6d3e2a);
    }

    static get displayName() { return 'Solar Garden Balcony'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width ?? 6;
        const depth = params.depth ?? 3.2;
        const height = params.height ?? 3.1;
        const railingHeight = params.railingHeight ?? 1.1;

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.railingHeight = railingHeight;
        this.params.panelTilt = this.panelTilt;
        this.params.planterTint = this.planterTint;

        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.repeat.set(1, 1);
        const baseMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xc8c4bd });
        const wallMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xb9bcc4 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x2f3439, metalness: 0.35, roughness: 0.55 });
        const planterMat = new THREE.MeshStandardMaterial({ color: this.planterTint, roughness: 0.7 });
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x2e261f, roughness: 0.95 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4d8b52, roughness: 0.75 });

        const base = new THREE.Mesh(boxGeo, baseMat);
        base.scale.set(width, 0.3, depth);
        base.position.set(0, 0.15, 0);
        base.receiveShadow = true;
        group.add(base);

        const backWall = new THREE.Mesh(boxGeo, wallMat);
        backWall.scale.set(width * 0.98, height, 0.25);
        backWall.position.set(0, height / 2 + 0.3, -depth / 2 + 0.12);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        group.add(backWall);

        const railTop = new THREE.Mesh(boxGeo, railMat);
        railTop.scale.set(width, 0.1, 0.14);
        railTop.position.set(0, railingHeight + 0.3, depth / 2 - 0.2);
        group.add(railTop);

        const railBottom = new THREE.Mesh(boxGeo, railMat);
        railBottom.scale.set(width, 0.08, 0.08);
        railBottom.position.set(0, 0.5, depth / 2 - 0.22);
        group.add(railBottom);

        const barCount = Math.max(4, Math.round(width));
        for (let i = 0; i <= barCount; i++) {
            const bar = new THREE.Mesh(cylGeo, railMat);
            bar.scale.set(1, railingHeight, 1);
            const x = -width / 2 + (width / barCount) * i;
            bar.position.set(x, railingHeight / 2 + 0.3, depth / 2 - 0.2);
            group.add(bar);
        }

        const sideRailLeft = new THREE.Mesh(boxGeo, railMat);
        sideRailLeft.scale.set(0.1, railingHeight, depth * 0.82);
        sideRailLeft.position.set(-width / 2 + 0.05, railingHeight / 2 + 0.3, 0);
        group.add(sideRailLeft);

        const sideRailRight = new THREE.Mesh(boxGeo, railMat);
        sideRailRight.scale.set(0.1, railingHeight, depth * 0.82);
        sideRailRight.position.set(width / 2 - 0.05, railingHeight / 2 + 0.3, 0);
        group.add(sideRailRight);

        const solarFrameMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, metalness: 0.4, roughness: 0.5 });
        const solarPanelMat = new THREE.MeshStandardMaterial({
            color: 0x173248,
            emissive: 0x1a4b6e,
            emissiveIntensity: 0.6,
            roughness: 0.35,
            metalness: 0.1
        });

        const panelPivot = new THREE.Group();
        panelPivot.position.set(width * 0.15, height * 0.72, -depth * 0.18);

        const panelFrame = new THREE.Mesh(boxGeo, solarFrameMat);
        panelFrame.scale.set(width * 0.5, 0.08, depth * 0.35);
        panelFrame.position.set(0, 0, 0);
        panelPivot.add(panelFrame);

        const panel = new THREE.Mesh(boxGeo, solarPanelMat);
        panel.scale.set(width * 0.46, 0.05, depth * 0.3);
        panel.position.set(0, 0.05, 0);
        panelPivot.add(panel);

        const panelStand = new THREE.Mesh(boxGeo, solarFrameMat);
        panelStand.scale.set(0.15, height * 0.4, 0.15);
        panelStand.position.set(-width * 0.05, -height * 0.18, -depth * 0.05);
        panelPivot.add(panelStand);

        panelPivot.rotation.x = -this.panelTilt;
        this.panelPivot = panelPivot;
        group.add(panelPivot);

        const planterPositions = [-width * 0.25, 0, width * 0.25];
        planterPositions.forEach((xPos, index) => {
            const planter = new THREE.Mesh(boxGeo, planterMat);
            planter.scale.set(width * 0.22, 0.35, depth * 0.3);
            planter.position.set(xPos, 0.48, depth * 0.1);
            planter.castShadow = true;
            group.add(planter);

            const soil = new THREE.Mesh(boxGeo, soilMat);
            soil.scale.set(width * 0.2, 0.12, depth * 0.26);
            soil.position.set(xPos, 0.62, depth * 0.1);
            group.add(soil);

            for (let i = 0; i < 4; i++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), leafMat);
                leaf.position.set(
                    xPos + (Math.random() - 0.5) * width * 0.12,
                    0.72 + Math.random() * 0.25,
                    depth * 0.1 + (Math.random() - 0.5) * depth * 0.12
                );
                if (index % 2 === 0) {
                    leaf.scale.set(1, 1.3, 1);
                }
                group.add(leaf);
            }
        });

        const spinnerGroup = new THREE.Group();
        spinnerGroup.position.set(-width * 0.3, railingHeight + 0.45, depth * 0.18);

        const spinnerPole = new THREE.Mesh(cylGeo, railMat);
        spinnerPole.scale.set(1, 0.6, 1);
        spinnerPole.position.set(0, -0.3, 0);
        spinnerGroup.add(spinnerPole);

        const spinnerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), railMat);
        spinnerHub.rotation.z = Math.PI / 2;
        spinnerGroup.add(spinnerHub);

        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffb347, metalness: 0.2, roughness: 0.6 });
        for (let i = 0; i < 6; i++) {
            const blade = new THREE.Mesh(boxGeo, bladeMat);
            blade.scale.set(0.6, 0.06, 0.18);
            blade.position.set(0.3, 0, 0);
            blade.rotation.z = Math.PI / 12;
            const bladeHolder = new THREE.Group();
            bladeHolder.rotation.y = (Math.PI * 2 / 6) * i;
            bladeHolder.add(blade);
            spinnerGroup.add(bladeHolder);
        }

        this.spinnerGroup = spinnerGroup;
        group.add(spinnerGroup);

        const cable = new THREE.Mesh(cylGeo, railMat);
        cable.scale.set(1, width * 0.75, 1);
        cable.rotation.z = Math.PI / 2;
        cable.position.set(0, height * 0.85, depth * 0.2);
        group.add(cable);

        const bulbMat = new THREE.MeshStandardMaterial({
            color: 0xffe5b0,
            emissive: 0xffc17a,
            emissiveIntensity: 0.5
        });

        for (let i = 0; i < 5; i++) {
            const bulb = new THREE.Mesh(sphereGeo, bulbMat.clone());
            bulb.position.set(-width * 0.3 + i * width * 0.15, height * 0.82, depth * 0.2);
            this.bulbs.push(bulb);
            group.add(bulb);
        }

        return group;
    }

    update(dt) {
        this.spinTime += dt;

        if (this.spinnerGroup) {
            this.spinnerGroup.rotation.y += dt * 1.6;
        }

        if (this.panelPivot) {
            this.panelPivot.rotation.x = -this.panelTilt + Math.sin(this.spinTime * 0.6) * 0.1;
        }

        this.bulbs.forEach((bulb, index) => {
            const flicker = 0.4 + Math.sin(this.spinTime * 2.2 + index) * 0.2;
            bulb.material.emissiveIntensity = 0.4 + flicker;
        });
    }
}

EntityRegistry.register('balconySolarGarden', BalconySolarGardenEntity);
