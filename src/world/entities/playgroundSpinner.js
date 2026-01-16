import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class PlaygroundSpinnerEntity extends BaseEntity {
  static get displayName() { return 'Playground Spinner'; }

  constructor(params) {
    super(params);
    this.type = 'PlaygroundSpinnerEntity';
    this.rotationSpeed = 0.5;
    this.spinnerGroup = null;
  }

  createMesh(params) {
    const root = new THREE.Group();

    // Central Pivot Base (Static part on ground)
    const pivotGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 16);
    const pivotMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const pivotMesh = new THREE.Mesh(pivotGeo, pivotMat);
    pivotMesh.position.y = 0.05;
    pivotMesh.castShadow = true;
    pivotMesh.receiveShadow = true;
    root.add(pivotMesh);

    // Rotating Group
    this.spinnerGroup = new THREE.Group();

    // 1. Base Disk (The platform kids stand on)
    const baseGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.spinnerGroup.add(baseMesh);

    // 2. Center Post
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 16);
    const postMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    const postMesh = new THREE.Mesh(postGeo, postMat);
    postMesh.position.y = 0.95; // Base (0.2) + half height (0.75)
    postMesh.castShadow = true;
    this.spinnerGroup.add(postMesh);

    // 3. Handrail Ring
    const railGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 32);
    const railMat = new THREE.MeshLambertMaterial({ color: 0x4488ff });
    const railMesh = new THREE.Mesh(railGeo, railMat);
    railMesh.rotation.x = -Math.PI / 2;
    railMesh.position.y = 1.0;
    railMesh.castShadow = true;
    this.spinnerGroup.add(railMesh);

    // 4. Cross Bars (Spokes)
    const crossBarGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8);

    const crossBar1 = new THREE.Mesh(crossBarGeo, postMat);
    crossBar1.rotation.z = Math.PI / 2;
    crossBar1.position.y = 1.0;
    crossBar1.castShadow = true;
    this.spinnerGroup.add(crossBar1);

    const crossBar2 = new THREE.Mesh(crossBarGeo, postMat);
    crossBar2.rotation.x = Math.PI / 2;
    crossBar2.position.y = 1.0;
    crossBar2.castShadow = true;
    this.spinnerGroup.add(crossBar2);

    root.add(this.spinnerGroup);

    return root;
  }

  update(dt) {
    if (this.spinnerGroup) {
      this.spinnerGroup.rotation.y += this.rotationSpeed * dt;
    }
  }
}

EntityRegistry.register('PlaygroundSpinnerEntity', PlaygroundSpinnerEntity);
