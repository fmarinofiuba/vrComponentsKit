/*

This document explains the portion of the WebXR APIs for managing input across the range of XR hardware
https://immersive-web.github.io/webxr/input-explainer

*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ControllersManager, EventTypes as CMEventTypes } from '../xr/ControllersManager.js';
import { XRTeleportMoveControl } from '../xr/XRTeleportMoveControl.js';

import * as UIL from '../vendor/uil.custom.module.js';

import { getHelixStaircase } from '../utils/helixStaircase.js';
import { getSquareStaircase } from '../utils/squareStaircase.js';

let renderer;
let scene;
let camera;

let clock = new THREE.Clock();
let floor;
let cyl;

let controllersManager;
let xrTeleportMoveControl;
let staircase;

function setupThreejs() {
	// Make a renderer that fills the screen
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.xr.addEventListener('sessionstart', function (event) {
		//baseReferenceSpace = renderer.xr.getReferenceSpace();
	});

	renderer.xr.addEventListener('sessionend', function (event) {});
	renderer.xr.enabled = true;
	renderer.setClearColor(0x000033, 1);

	// Add canvas to the page
	document.body.appendChild(renderer.domElement);

	// Add a button to enter/exit vr to the page
	document.body.appendChild(VRButton.createButton(renderer));

	// Make a new scene
	scene = new THREE.Scene();

	// Make a camera. note that far is set to 100, which is better for realworld sized environments
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
	camera.position.set(-30, 30, 30);
	camera.lookAt(0, 1.6, 0);
	scene.add(camera);

	const controls = new OrbitControls(camera, renderer.domElement);

	// Add some lights
	var light = new THREE.DirectionalLight(0xffffff, 3);
	light.position.set(2, 1, 4).normalize();
	scene.add(light);

	let ambientLight = new THREE.AmbientLight(0xffffff, 1);
	scene.add(ambientLight);

	// Handle browser resize
	window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupXR() {
	// https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace
	renderer.xr.setReferenceSpaceType('local-floor');

	controllersManager = new ControllersManager(renderer.xr, scene);

	controllersManager.addEventListener(CMEventTypes.ON_RAYCAST_STARTED, (event) => {
		console.log('ON_RAYCAST_STARTED', event);
	});

	controllersManager.addEventListener(CMEventTypes.ON_RAYCAST_UPDATED, (event) => {
		console.log('ON_RAYCAST_UPDATED', event);
	});

	controllersManager.addEventListener(CMEventTypes.ON_RAYCAST_ENDED, (event) => {
		console.log('ON_RAYCAST_ENDED', event);
	});

	controllersManager.addEventListener(CMEventTypes.ON_DOUBLE_SQUEEZE_STARTED, (event) => {
		console.log('ON_DOUBLE_SQUEEZE_STARTED', event);
	});

	controllersManager.addEventListener(CMEventTypes.ON_DOUBLE_SQUEEZE_ENDED, (event) => {
		console.log('ON_DOUBLE_SQUEEZE_ENDED', event);
	});

	controllersManager.addEventListener(CMEventTypes.ON_AXIS_RIGHT_CLICK, (event) => {
		console.log('ON_AXIS_RIGHT_CLICK', event);
	});

	xrTeleportMoveControl = new XRTeleportMoveControl(renderer.xr, controllersManager, scene);

	// Obtener las geometrías de los objetos Mesh
	const floorGeometry = floor.geometry.clone();
	const staircaseGeometry = staircase.geometry.clone();
	const boxGeometry = cyl.geometry.clone();

	// we need to update the matrix world of the objects to get the correct geometry
	floor.updateMatrixWorld();
	staircase.updateMatrixWorld();
	cyl.updateMatrixWorld();

	// Aplicar las matrices de transformación a las geometrías
	floorGeometry.applyMatrix4(floor.matrixWorld);
	staircaseGeometry.applyMatrix4(staircase.matrixWorld);
	boxGeometry.applyMatrix4(cyl.matrixWorld);

	// Fusionar las geometrías ya transformadas
	const geo = BufferGeometryUtils.mergeGeometries([floorGeometry, staircaseGeometry, boxGeometry]);

	xrTeleportMoveControl.setTeleportSurfaces(geo);
}

function buildScene() {
	// floor
	let floorTexture = new THREE.TextureLoader().load('../maps/floorPlane.png');

	floor = new THREE.Mesh(
		new THREE.PlaneGeometry(300, 300, 20, 20).rotateX(-Math.PI / 2),
		new THREE.MeshPhongMaterial({
			color: 0x808080,
			transparent: false,
			opacity: 0.95,
			map: floorTexture,
		})
	);
	scene.add(floor);

	// cyl

	const cylGeo = new THREE.CylinderGeometry(10, 10, 10, 32, 2, false, -Math.PI / 2, Math.PI);
	cylGeo.rotateX(-Math.PI / 2);
	cylGeo.translate(0, -2, 0);
	cylGeo.scale(1, 0.6, 1);
	cyl = new THREE.Mesh(cylGeo, new THREE.MeshPhongMaterial({ color: 0xff9900 }));
	cyl.position.set(23, 0, 23);
	scene.add(cyl);

	//buildDome();
	buildColumns();

	staircase = getSquareStaircase();
	staircase.position.set(15, 0, -15);
	//staircase.rotateY(Math.PI / 2);
	scene.add(staircase);

	let marker = new THREE.Mesh(
		new THREE.CylinderGeometry(0, 0.2, 1, 32),
		new THREE.MeshPhongMaterial({ color: 0xff0000 })
	);

	let markerX = marker.clone();
	markerX.position.set(10, 0, 0);
	scene.add(markerX);

	let markerZ = marker.clone();
	markerZ.material = markerX.material.clone();
	markerZ.material.color.set(0x0000ff);
	markerZ.position.set(0, 0, 10);
	scene.add(markerZ);
}

function buildDome() {
	// wireframe sphere background
	const geometry = new THREE.SphereGeometry(50, 24, 12);
	const material = new THREE.MeshBasicMaterial({
		color: 0xcccccc,
		wireframe: true,
	});
	const sphere = new THREE.Mesh(geometry, material);
	scene.add(sphere);
}

function buildColumns() {
	const mat2 = new THREE.MeshPhongMaterial({ color: 0x999999 });
	const geo2 = new THREE.CylinderGeometry(0.5, 1, 100, 32);
	geo2.translate(0, 50, 0);

	let ring = 0;
	const angleSeparation = [20, 15, 10];

	for (let r = 50; r <= 170; r = r + 40) {
		for (let i = 0; i < 360; i = i + angleSeparation[ring]) {
			let a = (i * Math.PI) / 180;
			const cylinder = new THREE.Mesh(geo2, mat2);
			let x = Math.cos(a) * r;
			let z = Math.sin(a) * r;
			cylinder.position.set(x, 0, z);
			scene.add(cylinder);
		}
		ring++;
	}
}

function animate() {
	renderer.setAnimationLoop(render);
}

function render(time) {
	const delta = clock.getDelta();

	controllersManager.update(time, delta);
	xrTeleportMoveControl.update(delta);

	renderer.render(scene, camera);
}

setupThreejs();
buildScene();
setupXR();
animate();
