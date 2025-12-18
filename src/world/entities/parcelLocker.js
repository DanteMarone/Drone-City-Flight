import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [0x5ac8fa, 0xffc857, 0x8be0a4];

export class ParcelLockerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'parcelLocker';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._accentMaterial = null;
        this._virtualLight = null;
        this._lightLocalPos = null;
    }

    static get displayName() { return 'Parcel Locker'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 2.4;
        const height = params.height || 1.75;
        const depth = params.depth || 0.72;
        const accentColor = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        const baseHeight = 0.14;
        const plinthGeo = new THREE.BoxGeometry(width * 1.04, baseHeight, depth * 1.08);
        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.wrapS = THREE.RepeatWrapping;
        concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.repeat.set(1.4, 0.8);
        const plinthMat = new THREE.MeshStandardMaterial({
            color: 0xb1b6bf,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.08
        });
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.y = baseHeight / 2;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        group.add(plinth);

        const shellGeo = new THREE.BoxGeometry(width, height, depth);
        const shellMat = new THREE.MeshStandardMaterial({
            color: 0xe5e9f0,
            roughness: 0.6,
            metalness: 0.25,
            map: concreteTex
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.y = baseHeight + height / 2;
        shell.castShadow = true;
        shell.receiveShadow = true;
        group.add(shell);

        const roofGeo = new THREE.BoxGeometry(width * 1.06, 0.1, depth * 1.1);
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0xd3d7de,
            roughness: 0.5,
            metalness: 0.28
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, shell.position.y + height / 2 + 0.05, 0);
        roof.rotation.x = THREE.MathUtils.degToRad(2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        const lockersTex = TextureGenerator.createBuildingFacade({
            color: '#f3f4f6',
            windowColor: '#c7ccd6',
            floors: 4,
            cols: 9,
            width: 512,
            height: 256
        });
        lockersTex.wrapS = THREE.RepeatWrapping;
        lockersTex.wrapT = THREE.RepeatWrapping;
        lockersTex.repeat.set(1, 1);
        const lockersMat = new THREE.MeshStandardMaterial({
            map: lockersTex,
            color: 0xffffff,
            roughness: 0.45,
            metalness: 0.2
        });
        const lockersPanel = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.92, height * 0.88), lockersMat);
        lockersPanel.position.set(0, shell.position.y, depth / 2 + 0.005);
        group.add(lockersPanel);

        const consoleGroup = new THREE.Group();
        const consoleHeight = height * 0.9;
        const consoleGeo = new THREE.BoxGeometry(width * 0.38, consoleHeight, depth * 0.2);
        const consoleMat = new THREE.MeshStandardMaterial({
            color: 0x212733,
            roughness: 0.55,
            metalness: 0.65
        });
        const console = new THREE.Mesh(consoleGeo, consoleMat);
        console.position.set(width * 0.18 - width / 2, consoleHeight / 2 + baseHeight + 0.02, depth / 2 + consoleGeo.parameters.depth / 2);
        console.castShadow = true;
        console.receiveShadow = true;
        consoleGroup.add(console);

        const screenGeo = new THREE.PlaneGeometry(consoleGeo.parameters.width * 0.9, consoleHeight * 0.32);
        this._screenMaterial = new THREE.MeshStandardMaterial({
            color: 0xa6f0ff,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.15,
            transparent: true,
            opacity: 0.95
        });
        const screen = new THREE.Mesh(screenGeo, this._screenMaterial);
        screen.position.set(console.position.x, console.position.y + consoleHeight * 0.08, console.position.z + consoleGeo.parameters.depth / 2 + 0.001);
        consoleGroup.add(screen);

        const keypad = new THREE.Mesh(new THREE.BoxGeometry(consoleGeo.parameters.width * 0.45, 0.06, 0.04), new THREE.MeshStandardMaterial({
            color: 0x11151f,
            metalness: 0.4,
            roughness: 0.4
        }));
        keypad.position.set(console.position.x, console.position.y - consoleHeight * 0.18, console.position.z + consoleGeo.parameters.depth / 2 + 0.012);
        consoleGroup.add(keypad);

        const accentMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.4,
            roughness: 0.35,
            metalness: 0.55
        });
        this._accentMaterial = accentMat;

        const accentStrip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.1, consoleHeight * 0.92, 0.03), accentMat);
        accentStrip.position.set(console.position.x + consoleGeo.parameters.width * 0.35, console.position.y, console.position.z + consoleGeo.parameters.depth / 2 + 0.02);
        consoleGroup.add(accentStrip);

        const mailSlot = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, 0.05, 0.04), new THREE.MeshStandardMaterial({
            color: 0x151a24,
            metalness: 0.45,
            roughness: 0.4
        }));
        mailSlot.position.set(console.position.x - consoleGeo.parameters.width * 0.05, console.position.y + consoleHeight * 0.24, console.position.z + consoleGeo.parameters.depth / 2 + 0.015);
        consoleGroup.add(mailSlot);

        const indicatorGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 10);
        const indicator = new THREE.Mesh(indicatorGeo, accentMat);
        indicator.rotation.z = Math.PI / 2;
        indicator.position.set(console.position.x - consoleGeo.parameters.width * 0.42, console.position.y + consoleHeight * 0.35, console.position.z + consoleGeo.parameters.depth / 2 + 0.01);
        consoleGroup.add(indicator);

        this._lightLocalPos = new THREE.Vector3(
            indicator.position.x,
            indicator.position.y + 0.05,
            indicator.position.z + 0.15
        );

        group.add(consoleGroup);

        const feetMat = new THREE.MeshStandardMaterial({ color: 0x7a7f88, roughness: 0.5, metalness: 0.4 });
        for (const offset of [-width * 0.38, width * 0.38]) {
            const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, baseHeight * 0.8, 10), feetMat);
            foot.position.set(offset, baseHeight * 0.4, -depth * 0.22);
            foot.castShadow = true;
            foot.receiveShadow = true;
            group.add(foot);
        }

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 1.6;
            this._virtualLight = lightSystem.register(worldPos, this._accentMaterial?.color?.getHex() ?? 0x5ac8fa, intensity, 10);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.4 + 0.25 * Math.sin(this._time * 3.1) + 0.1 * Math.sin(this._time * 7.3);
        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.7 + pulse * 0.5, 0.6, 1.4);
        }
        if (this._accentMaterial) {
            this._accentMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.35 + pulse * 0.4, 0.35, 1.1);
        }
        if (this._virtualLight) {
            const baseIntensity = this.params.lightIntensity || 1.6;
            this._virtualLight.intensity = THREE.MathUtils.clamp(baseIntensity + pulse * 0.8, baseIntensity * 0.7, baseIntensity * 1.6);
        }
    }
}

EntityRegistry.register('parcelLocker', ParcelLockerEntity);
