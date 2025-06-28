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
import { SelectableVrObject, defaultOptions as SlDefaultOptions } from './../xr/SelectableVrObject';

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

let geometries = [];
let materials = [];
let selectables = [];
let table;

let currentMaterialIndex = 0;
let currentGeometryIndex = 0;

let podiumObject = null;
const selectors = [];

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

function createGeometriesAndMaterials() {
	// geometries

	let geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	geometries.push(geo);

	//a sphere
	geo = new THREE.SphereGeometry(0.4, 32, 32);
	geometries.push(geo);

	//a torus
	geo = new THREE.TorusGeometry(0.35, 0.05, 48, 32);
	geometries.push(geo);

	// a cylinder
	geo = new THREE.CylinderGeometry(0, 0.5, 0.7);
	geometries.push(geo);

	// a torus knot
	geo = new THREE.TorusKnotGeometry(0.2, 0.071, 64, 32);
	geometries.push(geo);

	//materials

	// glossy shinny red
	let mat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.1 });
	materials.push(mat);

	// blue plastic
	mat = new THREE.MeshStandardMaterial({ color: 0x0000ff, metalness: 0.1, roughness: 0.5 });
	materials.push(mat);

	// transparent green shinny glass
	mat = new THREE.MeshStandardMaterial({
		color: 0x00ff00,
		metalness: 0.5,
		roughness: 0.1,
		transparent: true,
		opacity: 0.5,
	});
	materials.push(mat);

	// silver metal
	mat = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.3 });
	materials.push(mat);

	// rough yellow plastic
	mat = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.5, roughness: 0.9 });
	materials.push(mat);
}

function buildScene() {
	sceneElements = createVRBasicScene(scene);

	// box
	let geo = new THREE.BoxGeometry(1, 1, 1);
	let mat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
	let cube = new THREE.Mesh(geo, mat);

	let c = cube.clone();
	scene.add(c);
	c.visible = false;
	selectors.push(c);

	c = cube.clone();
	scene.add(c);
	c.visible = false;
	selectors.push(c);

	xrTeleportMoveControl.setTeleportSurfaces(sceneElements.floor.geometry);
	createSelectableObjects();
}

// create grabbable objects

function createSelectableObjects() {
	// plane
	const planeGeometry = new THREE.PlaneGeometry(8, 5);

	const planeMaterial = new THREE.MeshPhongMaterial({ color: 'white', side: THREE.DoubleSide });
	const plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.position.set(0, 2, -4);
	scene.add(plane);

	// cilinder table
	const tableGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
	tableGeometry.translate(0, 0.1, 0);
	const tableMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
	table = new THREE.Mesh(tableGeometry, tableMaterial);
	table.position.set(0, 0.0, -2);
	scene.add(table);

	// grey material
	const greyMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
	let geometriesGroup = new THREE.Group();

	for (let i = 0; i < geometries.length; i++) {
		let mesh = new THREE.Mesh(geometries[i], greyMat.clone());
		mesh.name = 'geometry' + i;
		mesh.userData.geometryIndex = i;
		mesh.position.set(i - (geometries.length - 1) / 2, 0, 0);
		geometriesGroup.add(mesh);

		let selectionController = new SelectableVrObject(mesh, scene);
		selectionController.addEventListener('onRayOver', onRayOver);
		selectionController.addEventListener('onRayOut', onRayOut);
		selectionController.addEventListener('onSelected', onSelected);
	}

	//geometriesGroup.rotation.y = Math.PI / 2;
	geometriesGroup.position.set(0, 2, -3);
	scene.add(geometriesGroup);

	const SphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
	const materialsGroup = new THREE.Group();

	for (let i = 0; i < materials.length; i++) {
		let mesh = new THREE.Mesh(SphereGeometry, materials[i]);
		mesh.name = 'material' + i;
		mesh.userData.materialIndex = i;
		mesh.position.set(i - (geometries.length - 1) / 2, 0, 0);
		materialsGroup.add(mesh);

		let selectionController = new SelectableVrObject(mesh, scene);

		selectionController.addEventListener('onRayOver', onRayOver);
		selectionController.addEventListener('onRayOut', onRayOut);
		selectionController.addEventListener('onSelected', onSelected);
	}

	materialsGroup.position.set(0, 3, -3);
	scene.add(materialsGroup);
}

function onRayOver(e) {
	console.log('onRayOver', e);
	e.object.material.emissive.setHex(0x999999);
}

function onRayOut(e) {
	console.log('onRayOut', e);
	e.object.material.emissive.setHex(0x000000);
}

function onSelected(e) {
	//e.object.material.emissive.setHex(0x000000);
	console.log('onSelected userData', e.object.userData);
	let udata = e.object.userData;

	if (udata.hasOwnProperty('geometryIndex')) {
		currentGeometryIndex = udata.geometryIndex;
		selectors[0].position.copy(e.object.localToWorld(new THREE.Vector3(0, 0, 0)));
		selectors[0].visible = true;
	}
	if (udata.hasOwnProperty('materialIndex')) {
		currentMaterialIndex = udata.materialIndex;
		selectors[1].position.copy(e.object.localToWorld(new THREE.Vector3(0, 0, 0)));
		selectors[1].visible = true;
	}

	updatePodiumObject();
}

function updatePodiumObject() {
	if (podiumObject) scene.remove(podiumObject);
	podiumObject = new THREE.Mesh(geometries[currentGeometryIndex], materials[currentMaterialIndex].clone());
	podiumObject.material.emissive.setHex(0x000000);
	podiumObject.position.set(0, 1, -2);
	podiumObject.scale.set(2, 2, 2);
	scene.add(podiumObject);
}

function animate() {
	renderer.setAnimationLoop(render);
}

function render(time) {
	const delta = clock.getDelta();
	controllersManager.update(time, delta);
	xrTeleportMoveControl.update(delta);
	SelectableVrObject.testRays(controllersManager);

	renderer.render(scene, camera);

	if (podiumObject) podiumObject.rotation.y += delta;
	time += delta;
}

setupThreejs();
setupXR();
createGeometriesAndMaterials();
buildScene();
updatePodiumObject();

animate();
