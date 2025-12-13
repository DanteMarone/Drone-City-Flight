import * as THREE from 'three';
import { TextureGenerator } from '../../utils/textures.js';

export function createEntityResources() {
    const textureLoader = new THREE.TextureLoader();
    const materials = initMaterials();
    const geometries = initGeometries();
    return { textureLoader, materials, geometries };
}

function initMaterials() {
    const mat = {};
    mat.road = new THREE.MeshStandardMaterial({
        map: TextureGenerator.createAsphalt(),
        roughness: 0.9,
        color: 0x555555
    });
    mat.grass = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 1.0 });
    return mat;
}

function initGeometries() {
    const roofPyramid = new THREE.ConeGeometry(1, 1, 4);
    roofPyramid.rotateY(Math.PI / 4);

    const roofGable = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
    roofGable.rotateZ(Math.PI / 2);
    roofGable.rotateX(-Math.PI / 2);

    return {
        box: new THREE.BoxGeometry(1, 1, 1),
        roofPyramid,
        roofGable
    };
}
