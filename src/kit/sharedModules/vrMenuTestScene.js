import * as THREE from 'three';

export const createVRMenuTestScene = (scene) => {
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

	let baseColumn = new THREE.Mesh(
		new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16),
		new THREE.MeshPhongMaterial({ color: 0xccccccc })
	);
	baseColumn.position.set(-1, 0.25, -3);
	scene.add(baseColumn);

	let torusKnot = new THREE.Mesh(
		new THREE.TorusKnotGeometry(0.2, 0.05, 100, 16),
		new THREE.MeshPhongMaterial({ color: 0xff9900 })
	);
	torusKnot.position.set(0, 2, 0);

	let baseColumn2 = baseColumn.clone();
	baseColumn2.position.set(1, 0.25, -3);
	scene.add(baseColumn2);

	// create a red cube of 1x1x1
	geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	material = new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 32 });
	const cube = new THREE.Mesh(geometry, material);
	cube.position.set(0, 2, 0);
	cube.rotateX(Math.PI / 4);
	cube.rotateZ(Math.PI / 3);
	scene.add(cube);

	baseColumn.add(torusKnot);
	baseColumn2.add(cube);

	// create a pointlight with a pointlight helper
	const pointLight = new THREE.PointLight(0xffffff, 2);
	pointLight.position.set(0, 1, -2);
	scene.add(pointLight);
	const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.1);
	scene.add(pointLightHelper);

	return {
		torus: torusKnot,
		cube: cube,
		pointLight: pointLight,
	};
};
