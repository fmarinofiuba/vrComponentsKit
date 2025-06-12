/*
	This example sets up a basic VR scene using THREE.js.
	It includes a rotating red cube, a wireframe sphere background, and a grid. 
	The scene can be viewed in VR or on a regular screen. 
	OrbitControls are added for user interaction with the camera.
	 A button is provided to enter and exit VR mode.
*/

// Import three
import * as THREE from 'three';

// Import the default VRButton
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Import OrbitControls
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer;
let scene;
let camera;
let cube, cube2;
let controls;

function setupThreejs() {
	// Make a renderer that fills the screen
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;

	// Make a new scene
	scene = new THREE.Scene();

	// Make a camera. note that far is set to 100, which is better for realworld sized environments
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.set(0, 2, 5);
	scene.add(camera);

	// Add canvas to the page
	document.body.appendChild(renderer.domElement);

	// Add a button to enter/exit vr to the page
	document.body.appendChild(VRButton.createButton(renderer));

	// Initialize OrbitControls
	controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 1.6, 0);
	controls.update();

	// Handle browser resize
	window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildScene() {
	// Add some lights
	var light = new THREE.DirectionalLight(0xffffff, 0.5);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);
	scene.add(new THREE.AmbientLight(0xffffff, 0.5));

	// Make a red cube

	cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 'red' }));
	cube.position.set(0, 1.5, -3);
	scene.add(cube);

	// wireframe sphere background

	const geometry = new THREE.CylinderGeometry(10, 10, 4, 32, 1, true);
	geometry.translate(0, 2, 0);
	const material = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		wireframe: true,
	});
	const sphere = new THREE.Mesh(geometry, material);
	scene.add(sphere);

	// 20x20 units grid, each cell is 1x1 unit
	const floorGrid = new THREE.GridHelper(20, 20);
	scene.add(floorGrid);

	const plane = new THREE.Mesh(
		new THREE.PlaneGeometry(20, 20),
		new THREE.MeshBasicMaterial({ color: 0x999999, visible: true, opacity: 0.5, transparent: true })
	);
	plane.rotateX(-Math.PI / 2);
	scene.add(plane);

	// axis helper
	const axesHelper = new THREE.AxesHelper(1);
	scene.add(axesHelper);

	// Set animation loop
	renderer.setAnimationLoop(render);
}

function render(time) {
	// Rotate the cube
	cube.rotation.y = time / 1000;

	// Update controls
	controls.update();

	// Draw everything
	renderer.render(scene, camera);
}

setupThreejs();
buildScene();
