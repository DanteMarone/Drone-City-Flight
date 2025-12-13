import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;

console.log('--- Checking TransformControls ---');

const controls = new TransformControls(new THREE.PerspectiveCamera(), document.createElement('div'));

console.log('Is Object3D?', controls instanceof THREE.Object3D);
console.log('Is Object3D (property)?', controls.isObject3D);
console.log('Has children?', controls.children.length);
console.log('Has traverse?', typeof controls.traverse);
console.log('Has dispatchEvent?', typeof controls.dispatchEvent);
console.log('Prototype chain:', Object.getPrototypeOf(controls).constructor.name);

if (controls.children.length > 0) {
    console.log('First child type:', controls.children[0].type);
    console.log('First child isObject3D?', controls.children[0].isObject3D);
}
