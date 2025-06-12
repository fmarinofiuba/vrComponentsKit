/*

This document explains the portion of the WebXR APIs for managing input across the range of XR hardware
https://immersive-web.github.io/webxr/input-explainer

*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ControllersManager, EventTypes as CMEventTypes } from '../xr/ControllersManager.js';
import { XRTeleportMoveControl } from '../xr/XRTeleportMoveControl.js';
import { UILVrMenu } from '../xr/UILVrMenu.js';
import * as UIL from '../vendor/uil.custom.module.js';
import { createVRMenuTestScene } from './sharedModules/vrMenuTestScene.js';

let renderer;
let scene;
let camera;

let clock = new THREE.Clock();
let floor;

let controllersManager;
let xrTeleportMoveControl;

let vrMenu;

let sceneElements;

let params = {
	torusSpeed: 1,
	cubeSpeed: 1,
	lightHUE: 0.25,
};

window.params = params;

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
	camera.position.set(1, 3, 5);

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
		if (e.button == 'ButtonX') {
			vrMenu.toggleVisibility();
			// cancel the event propagation
			return false;
		} else {
			return true;
		}
	});

	//xrTeleportMoveControl = new XRTeleportMoveControl(renderer.xr, controllersManager, scene);
	//xrTeleportMoveControl.setTeleportSurfaces(floor.geometry);
	vrMenu = new UILVrMenu(scene, controllersManager, { mode: 'panel', debugLevel: 1 });
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildScene() {
	sceneElements = createVRMenuTestScene(scene);
}

function buildUI() {
	let ui = vrMenu.ui;

	ui.add(params, 'torusSpeed', { min: 0, max: 10 });
	ui.add(params, 'cubeSpeed', { min: 0, max: 10 });

	let g1 = ui.add('group', { name: 'Light', bg: '#442222' });
	g1.add(sceneElements.pointLight, 'intensity', { min: 0, max: 5 });
	g1.add(params, 'lightHUE', { name: ' light HUE', min: 0, max: 1 });

	g1.open();
	vrMenu.createMap();
}

function animate() {
	renderer.setAnimationLoop(render);
}

function render(time) {
	const delta = clock.getDelta();

	controllersManager.update(time, delta);
	//xrTeleportMoveControl.update(delta);

	renderer.render(scene, camera);

	if (sceneElements) {
		sceneElements.torus.rotation.y += params.torusSpeed / 100;
		sceneElements.cube.rotation.y -= params.cubeSpeed / 100;
		sceneElements.pointLight.color.setHSL(params.lightHUE, 1, 0.5);
	}
}

setupThreejs();
buildScene();
setupXR();
buildUI();

animate();
