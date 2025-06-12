import * as THREE from 'three';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// color Mode 1: RGB, colorMode 2: CMY
const colorModes = [
	{
		x: 0xff0000,
		y: 0x0ff00,
		z: 0x0000ff,
	},
	{
		x: 0x00ffff,
		y: 0xff00ff,
		z: 0xffff00,
	},
];

export class BoxAxesHelper extends THREE.Mesh {
	constructor(size = 1, thickness = 0.1, colorMode = 0) {
		// Crea un buffer de geometrías vacío
		const geometries = [];

		// Eje X - color rojo
		const xGeometry = new THREE.BoxGeometry(size, thickness, thickness);
		xGeometry.translate(size / 2, 0, 0); // Traslada la geometría para que parta del origen
		geometries.push(xGeometry);

		// Eje Y - color verde
		const yGeometry = new THREE.BoxGeometry(thickness, size, thickness);
		yGeometry.translate(0, size / 2, 0); // Traslada la geometría para que parta del origen
		geometries.push(yGeometry);

		// Eje Z - color azul
		const zGeometry = new THREE.BoxGeometry(thickness, thickness, size);
		zGeometry.translate(0, 0, size / 2); // Traslada la geometría para que parta del origen
		geometries.push(zGeometry);

		// Combina las geometrías en una sola
		const combinedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

		// Materiales para cada eje
		const materials = [
			new THREE.MeshPhongMaterial({ color: colorModes[colorMode].x }), // Rojo para X
			new THREE.MeshPhongMaterial({ color: colorModes[colorMode].y }), // Verde para Y
			new THREE.MeshPhongMaterial({ color: colorModes[colorMode].z }), // Azul para Z
		];

		// Asigna los grupos de materiales a la geometría para que cada parte tenga su color
		combinedGeometry.groups = [
			{ start: 0, count: xGeometry.index.count, materialIndex: 0 },
			{ start: xGeometry.index.count, count: yGeometry.index.count, materialIndex: 1 },
			{ start: xGeometry.index.count + yGeometry.index.count, count: zGeometry.index.count, materialIndex: 2 },
		];

		// Crea el mesh utilizando la geometría combinada y el array de materiales
		super(combinedGeometry, materials);
	}
}
