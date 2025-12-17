import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BusStopEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'busStop';
    }

    static get displayName() { return 'Bus Stop'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.6,
            metalness: 0.8
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xaaccff,
            transparent: true,
            opacity: 0.4,
            roughness: 0.0,
            metalness: 0.5,
            side: THREE.DoubleSide
        });
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9
        });
        const benchMat = new THREE.MeshStandardMaterial({
            color: 0x8B5A2B, // Wood
            roughness: 0.8
        });
        const adMat = new THREE.MeshBasicMaterial({
            color: 0x00FFEE, // Cyan "Light" Ad default
            side: THREE.DoubleSide
        });

        // Procedural Sign Texture
        const signTex = this.createBusSignTexture();
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });

        // Dimensions
        const w = 4;
        const h = 2.4;
        const d = 1.5;

        // 1. Frame Posts (Back corners)
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, h, 8);
        const postL = new THREE.Mesh(postGeo, metalMat);
        postL.position.set(-w/2 + 0.1, h/2, -d/2);
        postL.castShadow = true;
        group.add(postL);

        const postR = new THREE.Mesh(postGeo, metalMat);
        postR.position.set(w/2 - 0.1, h/2, -d/2);
        postR.castShadow = true;
        group.add(postR);

        // 2. Back Glass Panel Structure
        // Top Frame
        const frameTopGeo = new THREE.BoxGeometry(w, 0.1, 0.1);
        const frameTop = new THREE.Mesh(frameTopGeo, metalMat);
        frameTop.position.set(0, h - 0.1, -d/2);
        group.add(frameTop);

        // Bottom Frame
        const frameBotGeo = new THREE.BoxGeometry(w, 0.1, 0.1);
        const frameBot = new THREE.Mesh(frameBotGeo, metalMat);
        frameBot.position.set(0, 0.1, -d/2);
        group.add(frameBot);

        // Glass
        const glassGeo = new THREE.PlaneGeometry(w - 0.2, h - 0.4);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, h/2, -d/2);
        group.add(glass);

        // 3. Side Panel (Left side)
        const sideFrameGeo = new THREE.BoxGeometry(0.1, h, d);
        const sideFrame = new THREE.Mesh(sideFrameGeo, metalMat);
        sideFrame.position.set(-w/2, h/2, 0);
        group.add(sideFrame);

        const sideGlassGeo = new THREE.PlaneGeometry(d - 0.2, h - 0.4);
        const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
        sideGlass.position.set(-w/2, h/2, 0);
        sideGlass.rotation.y = Math.PI / 2;
        group.add(sideGlass);

        // 4. Roof
        const roofGeo = new THREE.BoxGeometry(w + 0.4, 0.1, d + 1);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, h, 0);
        roof.castShadow = true;
        group.add(roof);

        // 5. Bench
        const benchW = w - 1;
        const seatGeo = new THREE.BoxGeometry(benchW, 0.1, 0.4);
        const seat = new THREE.Mesh(seatGeo, benchMat);
        seat.position.set(0.5, 0.5, -d/2 + 0.4);
        seat.castShadow = true;
        group.add(seat);

        const legGeo = new THREE.BoxGeometry(0.05, 0.5, 0.3);
        const leg1 = new THREE.Mesh(legGeo, metalMat);
        leg1.position.set(0.5 - benchW/3, 0.25, -d/2 + 0.4);
        group.add(leg1);
        const leg2 = new THREE.Mesh(legGeo, metalMat);
        leg2.position.set(0.5 + benchW/3, 0.25, -d/2 + 0.4);
        group.add(leg2);

        // 6. Ad Panel Box (Right side)
        const adBoxGeo = new THREE.BoxGeometry(0.2, 2, 1.2);
        const adBox = new THREE.Mesh(adBoxGeo, metalMat);
        adBox.position.set(w/2, 1, 0.8);
        adBox.castShadow = true;
        group.add(adBox);

        // Glowing Ad Face
        const adFaceGeo = new THREE.PlaneGeometry(1, 1.8);
        const adFace = new THREE.Mesh(adFaceGeo, adMat);
        adFace.position.set(w/2 - 0.11, 1, 0.8);
        adFace.rotation.y = -Math.PI / 2;
        group.add(adFace);

        const adFaceOut = new THREE.Mesh(adFaceGeo, adMat);
        adFaceOut.position.set(w/2 + 0.11, 1, 0.8);
        adFaceOut.rotation.y = Math.PI / 2;
        group.add(adFaceOut);

        // 7. Bus Sign Stick
        const stickGeo = new THREE.CylinderGeometry(0.03, 0.03, 3);
        const stick = new THREE.Mesh(stickGeo, metalMat);
        stick.position.set(w/2 + 0.5, 1.5, -d/2);
        group.add(stick);

        const signPlateGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
        const signPlate = new THREE.Mesh(signPlateGeo, signMat);
        signPlate.position.set(w/2 + 0.5, 2.8, -d/2);
        group.add(signPlate);

        return group;
    }

    createBusSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // White bg
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 128, 64);

        // Border
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 128, 64);

        // Text
        ctx.fillStyle = '#0000FF';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BUS', 64, 32);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }
}

EntityRegistry.register('busStop', BusStopEntity);
