import * as THREE from 'three';
import { VrInteractivePanel } from './VrInteractivePanel.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';

const defaultOptions = {
	width: 200, // pixels
};

export class VrVarsWatcher extends VrInteractivePanel {
	constructor(worldContainer, controllersManager, options = {}) {
		super(worldContainer, controllersManager, options);

		this._options = { ...defaultOptions, ...options };
		this._variables = new Map(); // Map<string, {value: any, getter: () => any}>

		// Create hidden container for the HTML
		this._htmlContainer = document.createElement('div');
		this._htmlContainer.id = 'vrVarsWatcher';
		this._htmlContainer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;           
            visibility: hidden;
        `;
		document.body.appendChild(this._htmlContainer);

		// Create and style the table
		this._table = document.createElement('table');
		this._table.style.cssText = `
            width: ${this._options.width}px;
            min-width: 100px;
            min-height: 100px;  
            border-collapse: collapse;
            background: #555555;
            font-family: 'Consolas', monospace;
            font-size: 10px;
            color: white;            
        `;
		this._htmlContainer.appendChild(this._table);
	}

	add(name, valueOrGetter) {
		const getter = typeof valueOrGetter === 'function' ? valueOrGetter : () => valueOrGetter;

		const ref = { name, getter };
		this._variables.set(name, ref);
		this.update();
		return ref;
	}

	remove(ref) {
		if (ref && ref.name) {
			this._variables.delete(ref.name);
		}
	}

	_formatValue(value) {
		if (value instanceof THREE.Vector2) {
			return `x:${value.x.toFixed(2)} y:${value.y.toFixed(2)}`;
		}
		if (value instanceof THREE.Vector3) {
			return `x:${value.x.toFixed(2)} y:${value.y.toFixed(2)} z:${value.z.toFixed(2)}`;
		}

		if (value instanceof THREE.Euler) {
			return `x:${value.x.toFixed(2)} y:${value.y.toFixed(2)} z:${value.z.toFixed(2)}`;
		}

		if (typeof value === 'number') {
			return value.toFixed(2);
		}
		return String(value);
	}

	update(time, deltaTime) {
		// Clear the table
		this._table.innerHTML = '';

		// Update table content
		for (const [name, ref] of this._variables) {
			const row = this._table.insertRow();

			const nameCell = row.insertCell();
			nameCell.textContent = name;
			nameCell.style.cssText =
				'text-align: right; padding: 2px 8px; border-right: 1px solid #444; text-wrap:nowrap;';

			const valueCell = row.insertCell();
			valueCell.textContent = this._formatValue(ref.getter());
			valueCell.style.cssText = 'text-align: left; padding: 2px 8px; text-wrap:nowrap';
		}
	}

	createMap() {
		const mesh = new HTMLMesh(this._htmlContainer);
		mesh.material;

		this._map = mesh.material.map;
		let h = this._map.image.height;
		let w = this._map.image.width;

		this._frontMaterial = mesh.material;
		this._mesh.material = [this._backMaterial, this._frontMaterial];

		this._updateAspectRatio(w, h, this._htmlContainer.offsetHeight);
	}

	_onPointerEvent = (e) => {
		// No interaction needed for this panel
	};
}
