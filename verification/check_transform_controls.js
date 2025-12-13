
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

console.log('--- Checking TransformControls ---');

const controls = new TransformControls(new THREE.PerspectiveCamera(), document.createElement('div'));

console.log('Is Object3D?', controls instanceof THREE.Object3D);
console.log('Is Object3D (property)?', controls.isObject3D);
console.log('Has children?', controls.children.length);
console.log('Has traverse?', typeof controls.traverse);
console.log('Has dispatchEvent?', typeof controls.dispatchEvent);
console.log('Prototype chain:', Object.getPrototypeOf(controls).constructor.name);

// Check if it creates a helper
if (controls.children.length > 0) {
    console.log('First child type:', controls.children[0].type);
    console.log('First child isObject3D?', controls.children[0].isObject3D);
}

// Check helper method
if (controls.getHelper) {
    console.log('Has getHelper() method');
} else {
    console.log('No getHelper() method');
}

console.log('--- End Check ---');
