import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class SolarPanelEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'solarPanel';
    }

    static get displayName() { return 'Solar Panel'; }
    static get category() { return 'Infrastructure/Energy'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Concrete Base
        const baseGeo = new THREE.BoxGeometry(1.2, 0.2, 1.2);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1; // Sit on ground
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Metal Pole
        const poleHeight = 1.5;
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, poleHeight, 8);
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.4,
            metalness: 0.6
        });
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.y = 0.1 + (poleHeight / 2);
        pole.castShadow = true;
        group.add(pole);

        // 3. Pivot Group (The part that moves)
        const pivotGroup = new THREE.Group();
        pivotGroup.name = 'pivotGroup';
        pivotGroup.position.y = 0.1 + poleHeight; // Top of pole
        group.add(pivotGroup);

        // 4. Hinge (Visual)
        const hingeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
        hingeGeo.rotateZ(Math.PI / 2); // Horizontal
        const hinge = new THREE.Mesh(hingeGeo, metalMat);
        pivotGroup.add(hinge);

        // 5. Panel
        // 2m wide, 3m tall (approx)
        const panelWidth = 2.0;
        const panelHeight = 3.0;
        const panelThick = 0.1;
        const panelGeo = new THREE.BoxGeometry(panelWidth, panelHeight, panelThick);

        // IMPORTANT: Rotate geometry so the "Face" (initially +Z or +Y depending on orientation) points +Z.
        // BoxGeometry is centered. Face is usually Front (+Z).
        // Let's verify: Box w,h,d. +Z face is w*h.
        // So yes, the large face is +Z.
        // But we want it to lay flat initially? No, we want it to point +Z so lookAt works.
        // So no rotation needed if we want it to face +Z.
        // Wait, "Face the sun". Sun is usually overhead.
        // If lookAt(sun) happens, +Z points to sun.
        // So the "Face" of the solar panel should be +Z.
        // So Box(w, h, d) -> Front face is +Z. Correct.

        // Solar Texture
        const solarMat = new THREE.MeshStandardMaterial({
            map: this._createSolarTexture(),
            roughness: 0.2,
            metalness: 0.5,
            color: 0xffffff,
            emissive: 0x000044, // Slight glow
            emissiveIntensity: 0.2
        });

        // Frame Material (Back/Sides)
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

        // Multi-material: 0=px, 1=nx, 2=py, 3=ny, 4=pz (Front), 5=nz (Back)
        const materials = [
            frameMat, frameMat, frameMat, frameMat,
            solarMat, // Front
            frameMat
        ];

        const panel = new THREE.Mesh(panelGeo, materials);
        panel.castShadow = true;
        // Offset panel so pivot is at the back-center
        // Current pivot is (0,0,0) of pivotGroup.
        // Panel is centered at (0,0,0).
        // We want pivot to be behind the panel.
        panel.position.z = panelThick / 2;
        pivotGroup.add(panel);

        return group;
    }

    _createSolarTexture() {
        if (SolarPanelEntity.sharedTexture) return SolarPanelEntity.sharedTexture;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 384; // 2:3 aspect ratio roughly
        const ctx = canvas.getContext('2d');

        // Dark Blue Background
        ctx.fillStyle = '#001133';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cells
        const cols = 4;
        const rows = 6;
        const pad = 4;
        const cellW = (canvas.width - pad * (cols + 1)) / cols;
        const cellH = (canvas.height - pad * (rows + 1)) / rows;

        ctx.fillStyle = '#002266'; // Slightly lighter cell

        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                const px = pad + x * (cellW + pad);
                const py = pad + y * (cellH + pad);
                ctx.fillRect(px, py, cellW, cellH);

                // Add faint conductor lines
                ctx.strokeStyle = '#445588';
                ctx.lineWidth = 1;
                ctx.beginPath();
                // Vertical lines
                for (let i = 1; i < 4; i++) {
                    const lx = px + (cellW * i / 4);
                    ctx.moveTo(lx, py);
                    ctx.lineTo(lx, py + cellH);
                }
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        SolarPanelEntity.sharedTexture = tex;
        return tex;
    }

    update(dt) {
        if (!this.mesh) return;

        // Access global sun position
        const app = window.app;
        if (!app || !app.world || !app.world.timeCycle) return;

        const sunPosWorld = app.world.timeCycle.sunPosition; // Vector3 relative to origin (0,0,0)

        // Find the pivot group
        const pivotGroup = this.mesh.getObjectByName('pivotGroup');
        if (!pivotGroup) return;

        // Convert Sun World Position to Local Space of the Entity (this.mesh)
        // Note: The Entity might be rotated.
        // The PivotGroup is a child of Entity.
        // We want PivotGroup's +Z to point at Sun.

        // 1. Get Sun position in Entity's local space
        const localSun = this.mesh.worldToLocal(sunPosWorld.clone());

        // 2. Point PivotGroup at localSun
        // lookAt works in parent's space.
        // PivotGroup's parent is this.mesh.
        // So localSun is the correct target point.
        pivotGroup.lookAt(localSun);

        // Optional: Clamp rotation if needed (e.g., don't point underground)
        // But since sun goes underground at night, the panel will flip.
        // Real solar panels might stow or stop.
        // For visual effect, tracking 24/7 is fine and shows off the cycle.
    }
}

EntityRegistry.register('solarPanel', SolarPanelEntity);
