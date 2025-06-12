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
import { createVRBasicScene } from './sharedModules/vrBasicTestScene';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { VrConsole } from '../xr/VrConsole.js';
import { VrVarsWatcher } from '../xr/VrVarsWatcher.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { GrabbableVrObject, defaultOptions as GrDefaultOptions } from './../xr/GrabbableVrObject';

let renderer;
let scene;
let camera;

let clock = new THREE.Clock();

let controllersManager;
let xrTeleportMoveControl;
let sceneElements;

let vrConsole;
let vrVarsWatcher;
let time = 0;
let teapot;
let teapotBBoxHelper;

let grababbles = [];
let table;

const colors = [
	0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0x999999, 0x666666, 0xcccccc, 0xff9999, 0x99ff99,
	0x9999ff, 0xffff99, 0xff99ff, 0x99ffff, 0x000000,
];

function setupThreejs() {
	// Make a renderer that fills the screen
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.xr.addEventListener('sessionstart', function (event) {});

	renderer.xr.addEventListener('sessionend', function (event) {
		onWindowResize();
	});
	renderer.xr.enabled = true;

	document.body.appendChild(renderer.domElement);
	document.body.appendChild(VRButton.createButton(renderer));

	scene = new THREE.Scene();

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
	xrTeleportMoveControl = new XRTeleportMoveControl(renderer.xr, controllersManager, scene);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildScene() {
	sceneElements = createVRBasicScene(scene);

	let vrConsole = new VrConsole(document.body, scene, controllersManager, { debugLevel: 1, size: 4 });
	vrConsole.createMap();
	let vrConsoleMesh = vrConsole.mesh;
	vrConsoleMesh.position.set(4, 1, -3);
	vrConsoleMesh.rotation.y = -Math.PI / 4;
	//scene.add(vrConsoleMesh);

	vrVarsWatcher = new VrVarsWatcher(scene, controllersManager, { size: 2 });

	let watcherMesh = vrVarsWatcher.mesh;
	watcherMesh.position.set(0, 1, -5);
	//scene.add(watcherMesh);
	vrVarsWatcher.createMap();

	xrTeleportMoveControl.setTeleportSurfaces(sceneElements.floor.geometry);
	createGrabbableObjects();
}

// create grabbable objects

function createGrabbableObjects() {
	// teapot
	let colorNumber = 0;
	const teapotGeometry = new TeapotGeometry(0.2);
	teapotGeometry.translate(0, 0.25, 0);
	const teapotMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, opacity: 1 });
	let teapot = new THREE.Mesh(teapotGeometry, teapotMaterial);

	// cilinder table
	const tableGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32);
	const tableMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
	table = new THREE.Mesh(tableGeometry, tableMaterial);
	table.position.set(-2, 0.75, -2);
	scene.add(table);
	let teapotNumber = 0;

	for (let a = 0; a < Math.PI * 2; a = a + Math.PI / 4) {
		let t = teapot.clone();
		t.material = teapot.material.clone();
		t.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
		t.name = 'teapot' + teapotNumber;
		t.position.set(Math.cos(a), 0, Math.sin(a));
		t.rotateY(a);
		table.add(t);
		const options = Object.assign({}, GrDefaultOptions, { remoteGrabbing: { enabled: false } });
		let grabController = new GrabbableVrObject(t, scene, options);
		grabController.addEventListener('onGrabStart', onGrabStart);
		grabController.addEventListener('onGrabEnd', onGrabEnd);
		grababbles.push(t);
		teapotNumber++;
	}

	for (let x = 0; x < 4; x++) {
		for (let z = 0; z < 4; z++) {
			let t = teapot.clone();
			t.material = teapot.material.clone();
			t.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
			t.name = 'teapot' + teapotNumber;
			t.position.set(3 + x, 0, -2 - z);
			let s = 0.5 + Math.random() * 0.5;
			t.scale.set(s, s, s);
			t.rotation.y = Math.PI * 2 * Math.random();
			scene.add(t);

			let grabController = new GrabbableVrObject(t, scene);
			grabController.addEventListener('onGrabStart', onGrabStart);
			grabController.addEventListener('onGrabEnd', onGrabEnd);
			grababbles.push(t);
			teapotNumber++;
		}
	}
	/*
	

	teapot.position.set(0, 0.5, -0.5);
	teapot.rotation.z = Math.PI / 4;

	// teapotGroup
	const teapotGroup = new THREE.Group();
	teapotGroup.position.set(0, 1, 0);
	teapotGroup.rotation.x = Math.PI / 8;
	teapotGroup.add(teapot);
	// axes helper
	teapotGroup.add(new THREE.AxesHelper(0.5));
	scene.add(teapotGroup);

	let teapotGrabControl = new GrabbableVrObject(teapot, controllersManager);
	teapotGrabControl.addEventListener('onGrabStart', function (e) {
		//console.log('Teapot grabbed');
		teapot.material.color.set(0xff0000);
	});
	teapotGrabControl.addEventListener('onGrabEnd', function (e) {
		//console.log('Teapot released');
		teapot.material.color.set(0x00ff00);
	});

	teapot.parent.updateMatrixWorld();
	vrVarsWatcher.add('distance', () => teapotGrabControl.distanceToRightController);

	const ref5 = vrVarsWatcher.add('Distance', () => getRightControllerPos());
	*/
}

function onGrabStart(e) {
	e.object.material.emissive.setHex(0x999999);
}

function onGrabEnd(e) {
	e.object.material.emissive.setHex(0x000000);
}

function getRightControllerPos() {
	return controllersManager?.right?.controller?.getWorldPosition(new THREE.Vector3());
}

function animate() {
	renderer.setAnimationLoop(render);
}

function render(time) {
	const delta = clock.getDelta();
	controllersManager.update(time, delta);
	xrTeleportMoveControl.update(delta);
	vrVarsWatcher.update(time, delta);
	//buildTestBox(time);
	renderer.render(scene, camera);
	if (teapotBBoxHelper) {
		scene.remove(teapotBBoxHelper);
	}
	//const bbox = new THREE.Box3().setFromObject(teapot, true);
	//teapotBBoxHelper = new THREE.Box3Helper(bbox, 0xffff00);
	//scene.add(teapotBBoxHelper);
	table.rotation.y += delta;
	time += delta;
}

function buildTestBox(time) {
	if (boxGroup) {
		scene.remove(boxGroup);
		scene.remove(helper);
	}
	const geometry = new THREE.BoxGeometry(0.1, 0.3, 0.2);
	const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
	const box = new THREE.Mesh(geometry, mat);

	box.position.set(0, 0.2, 0);
	//box.rotation.set(0.2, 0, 0.3);

	// group
	boxGroup = new THREE.Group();
	boxGroup.position.set(-1, 1, 0);
	boxGroup.rotation.set(0, 1, time / 1000);

	//boxGroup.rotation.x = Math.PI / 8;
	boxGroup.add(box);
	// axes helper
	boxGroup.add(new THREE.AxesHelper(0.5));
	scene.add(boxGroup);

	box.updateMatrixWorld();
	boxGroup.updateMatrixWorld();

	const bbox = new THREE.Box3();
	bbox.setFromObject(box, true);

	//console.log(bbox.min);
	//console.log(bbox.max);

	helper = new THREE.Box3Helper(bbox, 0xffff00);
	scene.add(helper);
}

setupThreejs();
setupXR();
buildScene();

animate();
