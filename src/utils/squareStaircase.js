import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

export function getSquareStaircase(totalSegments = 10) {
	const stepsPerSide = 10;
	const stepHeight = 0.3;
	const stepWidth = 3;
	const stepDepth = 0.6;
	const zGap = 0.5;

	const stairMaterial = new THREE.MeshPhongMaterial({
		color: 0x997744,
		side: THREE.DoubleSide,
		shininess: 32,
	});

	const stepGeometry = new THREE.BoxGeometry(stepDepth, 0.1, stepWidth);

	const restAreaGeometry = new THREE.BoxGeometry(3, 0.2, stepWidth * 2 + 1 + zGap * 2);

	let parts = [];
	let h = 0.1;

	for (let j = 0; j < totalSegments; j++) {
		const segmentDirection = j % 2 === 0 ? 1 : -1;
		for (let i = 0; i <= stepsPerSide; i++) {
			const x = (-stepsPerSide / 2 + i) * stepDepth * segmentDirection;
			const z = (stepWidth / 2 + zGap) * segmentDirection;
			const y = h;

			let geo = stepGeometry.clone();
			geo.translate(x, y, z);

			parts.push(geo);
			h = h + stepHeight;
		}

		let geo = restAreaGeometry.clone();
		const x = ((stepsPerSide / 2) * stepDepth + 2.5) * segmentDirection;
		const z = 0;
		const y = h;
		geo.translate(x, y, z);
		parts.push(geo);
	}

	let stairGeometry = BufferGeometryUtils.mergeGeometries(parts);
	let stair = new THREE.Mesh(stairGeometry, stairMaterial);
	return stair;
}
