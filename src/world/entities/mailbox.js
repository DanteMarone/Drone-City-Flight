import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class MailboxEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mailbox';
        this._time = Math.random() * Math.PI * 2;
        this._lightHandle = null;
        this._glowMaterial = null;
        this._lightLocal = null;
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Mailbox'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 0.72;
        const depth = params.depth || 0.62;
        const bodyHeight = params.bodyHeight || 0.9;
        const archRadius = width * 0.52;
        this.params.width = width;
        this.params.depth = depth;
        this.params.bodyHeight = bodyHeight;

        const concreteTex = TextureGenerator.createConcrete();
        const metalTex = TextureGenerator.createConcrete();
        metalTex.wrapS = THREE.RepeatWrapping;
        metalTex.wrapT = THREE.RepeatWrapping;
        metalTex.repeat.set(2, 2);

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x5c6b73,
            map: concreteTex,
            roughness: 0.9,
            metalness: 0.1
        });

        const bodyMat = new THREE.MeshStandardMaterial({
            color: params.bodyColor || 0x1f4b99,
            map: metalTex,
            roughness: 0.38,
            metalness: 0.65
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: params.accentColor || 0xd7263d,
            roughness: 0.35,
            metalness: 0.55
        });

        const trimMat = new THREE.MeshStandardMaterial({
            color: 0x0c203d,
            roughness: 0.4,
            metalness: 0.4
        });

        const slab = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, 0.1, depth * 1.05), baseMat);
        slab.position.y = 0.05;
        slab.receiveShadow = true;
        group.add(slab);

        // Feet for stability
        const footGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 12);
        [-1, 1].forEach(ix => {
            [-1, 1].forEach(iz => {
                const foot = new THREE.Mesh(footGeo, baseMat);
                foot.position.set((width / 2 - 0.1) * ix, 0.11, (depth / 2 - 0.1) * iz);
                foot.castShadow = true;
                foot.receiveShadow = true;
                group.add(foot);
            });
        });

        // Main body
        const shell = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, depth), bodyMat);
        shell.position.y = bodyHeight / 2 + 0.1;
        shell.castShadow = true;
        shell.receiveShadow = true;
        group.add(shell);

        // Arched top
        const archGeo = new THREE.SphereGeometry(archRadius, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const arch = new THREE.Mesh(archGeo, bodyMat);
        arch.scale.set(1, 0.72, depth / width);
        arch.position.set(0, shell.position.y + bodyHeight / 2, 0);
        arch.castShadow = true;
        arch.receiveShadow = true;
        group.add(arch);

        // Front inset panel
        const panelGeo = new THREE.BoxGeometry(width * 0.78, bodyHeight * 0.58, 0.02);
        const panel = new THREE.Mesh(panelGeo, trimMat);
        panel.position.set(0, shell.position.y + 0.08, depth / 2 + 0.011);
        panel.castShadow = false;
        group.add(panel);

        // Mail slot with glow
        const slotGeo = new THREE.BoxGeometry(width * 0.55, 0.06, 0.05);
        const glowMat = new THREE.MeshStandardMaterial({
            color: 0xffe8a3,
            emissive: new THREE.Color(0xffc67f),
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.2
        });
        this._glowMaterial = glowMat;
        const slot = new THREE.Mesh(slotGeo, glowMat);
        slot.position.set(0, panel.position.y + 0.04, depth / 2 + 0.036);
        slot.castShadow = false;
        group.add(slot);

        // Handle and hinges
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, width * 0.4, 8), accentMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, panel.position.y - 0.08, depth / 2 + 0.03);
        handle.castShadow = true;
        group.add(handle);

        const hingeGeo = new THREE.CylinderGeometry(0.012, 0.012, bodyHeight * 0.55, 6);
        [-1, 1].forEach(side => {
            const hinge = new THREE.Mesh(hingeGeo, trimMat);
            hinge.rotation.z = Math.PI / 2;
            hinge.position.set((width / 2 + 0.01) * side, panel.position.y, depth / 2 - 0.005);
            group.add(hinge);
        });

        // Side flag assembly
        const flagPost = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8), trimMat);
        flagPost.position.set(width / 2 + 0.025, shell.position.y + bodyHeight * 0.25, 0);
        flagPost.castShadow = true;
        group.add(flagPost);

        const flagArm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.05), accentMat);
        flagArm.position.set(flagPost.position.x + 0.13, flagPost.position.y + 0.08, 0);
        flagArm.castShadow = true;
        group.add(flagArm);

        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.02), accentMat);
        flag.position.set(flagArm.position.x + 0.18, flagArm.position.y + 0.04, 0);
        flag.castShadow = true;
        group.add(flag);

        // Wrap band for visual contrast
        const strap = new THREE.Mesh(new THREE.BoxGeometry(width * 1.02, 0.06, depth * 1.02), accentMat);
        strap.position.set(0, shell.position.y + bodyHeight * 0.2, 0);
        strap.castShadow = true;
        strap.receiveShadow = true;
        group.add(strap);

        // Determine local light anchor near the slot
        this._lightLocal = new THREE.Vector3(0, slot.position.y, depth / 2 + 0.08);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation.copy(this.mesh.rotation);
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocal) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocal.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 1.6;
            this._lightHandle = lightSystem.register(worldPos, this.params.lightColor || 0xffc67f, intensity, 10);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 0.8 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.5);
        this.mesh.rotation.set(this._baseRotation.x, this._baseRotation.y + sway * 0.2, this._baseRotation.z + sway);

        if (this._glowMaterial) {
            const pulse = 0.2 + 0.15 * Math.sin(this._time * 3.3) + 0.05 * Math.sin(this._time * 11.7);
            this._glowMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.7 + pulse, 0.7, 1.4);
        }

        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity || 1.6;
            const modulation = 0.3 * Math.sin(this._time * 2.8);
            this._lightHandle.intensity = THREE.MathUtils.clamp(baseIntensity + modulation, baseIntensity * 0.6, baseIntensity * 1.3);
        }
    }
}

EntityRegistry.register('mailbox', MailboxEntity);
