// src/person/camera.js
import * as THREE from 'three';

export class PersonCameraController {
    constructor(camera, person) {
        this.camera = camera;
        this.person = person;
        this.offset = new THREE.Vector3(0, 1.6, 3.5);
        this.smoothing = 6;
    }

    update(dt) {
        const yaw = this.person.yaw;
        const rotatedOffset = this.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const desired = this.person.position.clone().add(rotatedOffset);

        this.camera.position.lerp(desired, Math.min(1, this.smoothing * dt));
        const lookAtPos = this.person.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        this.camera.lookAt(lookAtPos);
    }
}
