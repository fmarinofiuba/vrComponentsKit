import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

export function getHelixStaircase() {
	const totalSteps = 30;
	const stepHeight = 1;
	const helixRadius = 5;

	const stairMaterial = new THREE.MeshPhongMaterial({
		color: 0x665544,
		side: THREE.DoubleSide,
		shininess: 32,
	});
	const stepGeometry = new THREE.BoxGeometry(6, 2, 0.2);
	stepGeometry.rotateX((0.5 - 0.05) * Math.PI);

	let steps = [];
	for (let i = 0; i < totalSteps; i++) {
		const angle = (i * Math.PI) / 8;
		const x = Math.cos(angle) * helixRadius;
		const y = i * stepHeight + 0.3;
		const z = Math.sin(angle) * helixRadius;

		let geo = stepGeometry.clone();
		geo.rotateY(-angle);
		geo.translate(x, y, z);

		steps.push(geo);
	}

	let stairGeometry = BufferGeometryUtils.mergeGeometries(steps);
	let stair = new THREE.Mesh(stairGeometry, stairMaterial);
	return stair;
}
