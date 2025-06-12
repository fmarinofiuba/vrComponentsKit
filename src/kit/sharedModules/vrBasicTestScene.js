import * as THREE from 'three';

export const createVRBasicScene = (scene) => {
	// Add some lights
	let light = new THREE.DirectionalLight(0xffffff, 0.3);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);

	scene.add(new THREE.AmbientLight(0xffffff, 0.2));

	// wireframe sphere background
	let geometry = new THREE.SphereGeometry(50, 32, 16);
	let material = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		wireframe: true,
		opacity: 0.5,
		transparent: true,
	});
	const sphere = new THREE.Mesh(geometry, material);
	scene.add(sphere);

	let floor = new THREE.Mesh(
		new THREE.PlaneGeometry(300, 300, 20, 20).rotateX(-Math.PI / 2),
		new THREE.MeshPhongMaterial({
			color: 0x808080,
		})
	);
	scene.add(floor);

	const axesHelper = new THREE.AxesHelper(1);
	scene.add(axesHelper);

	// grid
	const grid = new THREE.GridHelper(10, 10, 0x0000ff, 0x808080);
	grid.material.opacity = 0.5;
	grid.material.transparent = true;
	scene.add(grid);

	return {
		floor,
	};
};
