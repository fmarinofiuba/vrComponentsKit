import { defaultOptions } from '../xr/XRTeleportMoveControl';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
export function buildStaircase(totalCycles = 4) {
	const stairMaterial = new THREE.MeshPhongMaterial({
		color: 0x665544,
		side: THREE.DoubleSide,
		shininess: 32,
	});

	let steps = [];
	for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
		const origin = new THREE.Vector3();
		origin.x = Math.cos(angle) * 5;
		origin.y = angle * 10;
		origin.z = Math.sin(angle) * 5;
		let segments = buildSegmentGeo(origin, angle, 10, 1, 1, 6, 2);
		steps = steps.concat(segments);
	}

	let stairGeometry = BufferGeometryUtils.mergeGeometries(steps);
	let stair = new THREE.Mesh(stairGeometry, stairMaterial);
	return stair;
}

function buildSegmentGeo(origin, angle, numSteps, rise, run, width, height) {
	let steps = [];
	for (let i = 0; i < numSteps; i++) {
		const stepGeometry = new THREE.BoxGeometry(run, rise / 8, width);
		const x = origin.x + run * i;
		const y = origin.y + rise * i;
		const z = origin.z;
		let geo = stepGeometry.clone();
		geo.translate(x, y, z);
		geo.rotateY(-angle);
	}
	return steps;
}
