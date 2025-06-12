/*

This document explains the portion of the WebXR APIs for managing input across the range of XR hardware
https://immersive-web.github.io/webxr/input-explainer

*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ControllersManager, EventTypes as CMEventTypes } from '../xr/ControllersManager.js';
import { XRTeleportMoveControl } from '../xr/XRTeleportMoveControl.js';
import { HtmlVrMenu } from '../xr/HtmlVrMenu.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createVRBasicScene } from './sharedModules/vrBasicTestScene.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { VrConsole } from '../xr/VrConsole.js';
import { VrVarsWatcher } from '../xr/VrVarsWatcher.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';

let renderer;
let scene;
let camera;

let clock = new THREE.Clock();

let controllersManager;
let xrTeleportMoveControl;
let sceneElements;

let vrMenu;
let vrConsole;
let vrVarsWatcher;
let teapot;
let params = {
	state: 'initial',
};

const states = ['initial', 'running', 'paused', 'stopped', 'finished'];

function setupThreejs() {
	// Make a renderer that fills the screen
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.xr.addEventListener('sessionstart', function (event) {});

	renderer.xr.addEventListener('sessionend', function (event) {});
	renderer.xr.enabled = true;

	// Add canvas to the page
	document.body.appendChild(renderer.domElement);

	// Add a button to enter/exit vr to the page
	document.body.appendChild(VRButton.createButton(renderer));

	// Make a new scene
	scene = new THREE.Scene();

	// Make a camera. note that far is set to 100, which is better for realworld sized environments
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
	camera.position.set(0, 3, 5);

	scene.add(camera);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 1, 0);
	controls.update();

	// Handle browser resize
	window.addEventListener('resize', onWindowResize, false);
}

function setupXR() {
	controllersManager = new ControllersManager(renderer.xr, scene);

	controllersManager.addEventListener(CMEventTypes.ON_BUTTON_UP, (e) => {
		//console.log('Button up:', e.type, e, e.button);
	});

	controllersManager.addEventListener(CMEventTypes.ON_BUTTON_DOWN, (e) => {
		//console.log('Button down:', e.type, e.button);
	});

	xrTeleportMoveControl = new XRTeleportMoveControl(renderer.xr, controllersManager, scene);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildScene() {
	// create teapot
	const geometry = new TeapotGeometry(0.5);
	const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
	teapot = new THREE.Mesh(geometry, material);
	teapot.position.set(0, 1, -3);
	scene.add(teapot);

	sceneElements = createVRBasicScene(scene);

	xrTeleportMoveControl.setTeleportSurfaces(sceneElements.floor.geometry);

	let vrConsole = new VrConsole(document.body, scene, controllersManager, { debugLevel: 1, size: 4 });
	// Ejemplos de uso de console, ahora capturados por la consola personalizada
	console.log('Consola personalizada iniciada usando Clase ES6 y Módulo.');
	console.warn('Esto es una advertencia desde la clase ES6.');
	console.error('¡Esto es un error generado desde la clase!');
	console.info('Información relevante usando ES6.');
	console.debug('Mensaje de debug con módulo.');
	console.trace('Rastreo de pila desde el módulo ES6:');

	// Ejemplo de uso de estilos con %c
	console.log('%cHola Mundo %ccon estilos desde la clase!', 'color: green; font-size: 18px;', 'color: purple;');

	// Ejemplo con un objeto
	console.log({ objetoEjemploES6: { nombre: 'Ejemplo Clase ES6', valor: 456 } });

	// Más mensajes de prueba
	console.log('Mensaje adicional desde el script principal.');
	console.warn('Otra advertencia para verificar el módulo.');
	console.error('Un error más para probar la clase ES6.');

	for (let i = 0; i < 30; i++) {
		console.log('Mensaje de prueba número:', i);
	}

	setInterval(() => {
		// log current time
		//console.log('Current time:', new Date());
	}, 1000);

	vrConsole.createMap();
	let vrConsoleMesh = vrConsole.mesh;
	vrConsoleMesh.position.set(4, 1, -3);
	vrConsoleMesh.rotation.y = -Math.PI / 4;
	scene.add(vrConsoleMesh);

	// VrVarsWatcher
	vrVarsWatcher = new VrVarsWatcher(scene, controllersManager, { size: 4 });

	let watcherMesh = vrVarsWatcher.mesh;

	watcherMesh.position.set(-4, 1, -3);
	watcherMesh.rotation.y = Math.PI / 4;

	scene.add(watcherMesh);

	// Add some variables to watch
	const pos = new THREE.Vector3(1, 2, 3);
	const rot = new THREE.Vector3(9, 7, 8);

	// Add variables with different types
	const ref1 = vrVarsWatcher.add('teapot pos', teapot.position);
	const ref2 = vrVarsWatcher.add('teapot rot', teapot.rotation);
	const ref3 = vrVarsWatcher.add('teapot scale', teapot.scale);
	const ref5 = vrVarsWatcher.add('Distance', () => camera.position.distanceTo(teapot.position));
	const ref6 = vrVarsWatcher.add('state', params.state);

	vrVarsWatcher.createMap();
}

function animate() {
	renderer.setAnimationLoop(render);
}

let count = 0;
function render(time) {
	const delta = clock.getDelta();

	controllersManager.update(time, delta);

	//xrTeleportMoveControl.update(delta);

	teapot.rotation.y += 0.01;
	teapot.position.y = 2 + Math.sin(time / 1000);
	renderer.render(scene, camera);
	vrVarsWatcher.update(time, delta);

	if (count % (1 * 60) == 0) {
		params.state = states[Math.floor(Math.random() * states.length)];
	}
	count++;
}

setupThreejs();

setupXR();
buildScene();

animate();
