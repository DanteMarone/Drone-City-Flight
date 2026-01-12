import * as THREE from 'three';
import { BaseEntity } from './base.js';

export class TubeManEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'tubeMan';
        this.time = Math.random() * 100; // Random start time
        this.segments = []; // Store segment meshes for animation
        this.speed = params.speed || 3.0;
        this.color = params.color ? new THREE.Color(params.color) : new THREE.Color(Math.random() * 0xffffff);

        // Ensure bright colors for tube men
        if (this.color.getHSL({}).l < 0.3) {
             this.color.setHSL(Math.random(), 1.0, 0.6);
        }
    }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. The Fan Base (Industrial looking)
        const fanGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.4, 16);
        const fanMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
        const fanBase = new THREE.Mesh(fanGeo, fanMat);
        fanBase.position.y = 0.2;
        fanBase.castShadow = true;
        fanBase.receiveShadow = true;
        group.add(fanBase);

        // 2. The Body (Segmented for wiggling)
        const segmentCount = 6;
        const segmentHeight = 0.6;
        const radius = 0.25;

        const fabricMat = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.4,
            side: THREE.DoubleSide
        });

        // We need a hierarchy for the wiggle to propagate: Base -> Seg1 -> Seg2 ...
        // But for a tube man, it's more like a chain where each bone rotates.
        // We will build a parent-child chain.

        let parent = group; // Start attached to the group (conceptually on top of the fan)
        let currentY = 0.4; // Top of fan

        this.segments = [];

        for (let i = 0; i < segmentCount; i++) {
            // Pivot Group (This handles the rotation)
            const pivot = new THREE.Group();
            pivot.position.y = (i === 0) ? currentY : segmentHeight; // First one is at fan height, others relative to parent

            // The Mesh (Visual)
            // Center the mesh in the pivot so the pivot is at the bottom
            const geo = new THREE.CylinderGeometry(radius, radius, segmentHeight, 16, 1, true); // Open ends for continuous look
            geo.translate(0, segmentHeight / 2, 0); // Move cylinder up so origin is at bottom

            const mesh = new THREE.Mesh(geo, fabricMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            pivot.add(mesh);
            parent.add(pivot);

            this.segments.push(pivot);
            parent = pivot; // Next segment is child of this pivot
        }

        // 3. Head (Top of the last segment)
        // Parent is now the last pivot
        const headRadius = radius;
        const headHeight = 0.5;
        const headGeo = new THREE.CylinderGeometry(headRadius, headRadius, headHeight, 16);
        headGeo.translate(0, headHeight / 2, 0); // Origin at bottom

        // Face Texture
        const faceTexture = this._createFaceTexture();
        const headMat = new THREE.MeshStandardMaterial({
            color: this.color,
            map: faceTexture,
            roughness: 0.4
        });

        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = segmentHeight; // On top of the last segment
        head.castShadow = true;
        head.receiveShadow = true;

        // Add waving arms to the head/chest area?
        // Real tube men have arms usually on the top segment or second to last.
        // Let's add them to the segment below the head (last segment in the loop was parent)
        // Wait, 'parent' is the last segment's pivot.

        parent.add(head);

        // 4. Arms (Attached to the second to last segment, or top segment)
        // Let's attach to the top segment (the one just before the head).
        // Since 'parent' is the last segment's pivot, let's add arms there.

        const armMat = fabricMat; // Same material
        const armLength = 1.2;
        const armRadius = 0.1;

        // Left Arm
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-radius, segmentHeight * 0.8, 0);
        leftArmGroup.rotation.z = Math.PI / 3; // Stick out

        const leftArmGeo = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
        leftArmGeo.translate(0, armLength / 2, 0); // Pivot at shoulder
        const leftArm = new THREE.Mesh(leftArmGeo, armMat);
        leftArmGroup.add(leftArm);
        parent.add(leftArmGroup);
        this.leftArm = leftArmGroup; // Store for animation

        // Right Arm
        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(radius, segmentHeight * 0.8, 0);
        rightArmGroup.rotation.z = -Math.PI / 3;

        const rightArmGeo = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
        rightArmGeo.translate(0, armLength / 2, 0);
        const rightArm = new THREE.Mesh(rightArmGeo, armMat);
        rightArmGroup.add(rightArm);
        parent.add(rightArmGroup);
        this.rightArm = rightArmGroup; // Store for animation

        return group;
    }

    _createFaceTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128; // Cylinder wrap
        const ctx = canvas.getContext('2d');

        // Background (transparent to let base color show, or fill with base color?)
        // Standard material map multiplies color. If we want white eyes on red body, we need the texture to be white/black?
        // Actually, if we use a map, the map color replaces the base color * texture color.
        // If we want the body color to show through, we should use a transparent texture and alphaTest, or just paint the background white and multiply?
        // Let's paint the background white (which means "full color") and draw the features.
        // But wait, if we apply this to the head, and the head has `this.color`, white pixels = `this.color`.
        // Black pixels = Black.
        // So we can draw black eyes and mouth.

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 256, 128);

        ctx.fillStyle = '#000000';
        ctx.beginPath();

        // Eyes (spaced out)
        // Texture maps around the cylinder. Center of face should be around x=128? or x=64?
        // Let's assume standard UV mapping wraps 0-1.

        const eyeY = 50;
        const eyeRadius = 15;

        // Left Eye
        ctx.arc(80, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();

        // Right Eye
        ctx.arc(176, eyeY, eyeRadius + 5, 0, Math.PI * 2); // One eye bigger (derpy)
        ctx.fill();
        ctx.beginPath();

        // Mouth (Open scream)
        ctx.ellipse(128, 90, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt) {
        this.time += dt * this.speed;

        // Animate Segments (Wave motion)
        // Base segments move less, top segments move more.
        this.segments.forEach((segment, i) => {
            // Z-axis rotation (Side to side)
            // Phase shift based on index to create wave
            const intensity = 0.1 + (i * 0.05); // Top moves more
            const noise = Math.sin(this.time + i * 0.5);
            const noise2 = Math.cos(this.time * 0.7 + i * 0.3);

            segment.rotation.z = noise * intensity;
            segment.rotation.x = noise2 * intensity * 0.5; // Little bit of forward/back
        });

        // Animate Arms (Flailing)
        if (this.leftArm) {
            this.leftArm.rotation.z = (Math.PI / 3) + Math.sin(this.time * 1.5) * 1.0;
            this.leftArm.rotation.x = Math.cos(this.time * 2.0) * 0.5;
        }
        if (this.rightArm) {
            this.rightArm.rotation.z = (-Math.PI / 3) - Math.sin(this.time * 1.3) * 1.0;
            this.rightArm.rotation.x = Math.sin(this.time * 1.8) * 0.5;
        }
    }

    static get displayName() {
        return 'Inflatable Tube Man';
    }
}
