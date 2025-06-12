import * as THREE from 'three';
import { VrMenu } from './VrMenu.js';
import { ControllersManager, EventTypes as CMEventTypes } from './ControllersManager.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';

export class HtmlVrMenu extends VrMenu {
	constructor(worldContainer, controllersManager, options) {
		super(worldContainer, controllersManager, options);
		this._vrUI = new GUI();
	}

	createMap() {
		//https://github.com/lo-th/uil

		const mesh = new HTMLMesh(this._vrUI.domElement);
		mesh.material;

		this._map = mesh.material.map;
		let h = this._map.image.height;
		let w = this._map.image.width;

		this._frontMaterial = mesh.material;

		this._mesh.material = [this._backMaterial, this._frontMaterial];

		mesh.position.z = 0.1;
		//this._menuContainer.add(mesh);

		this._updateAspectRatio(w, h, this._vrUI.domElement.offsetHeight);
	}

	_onPointerEvent = (e) => {
		// e.type: pointerdown,pointerup,pointermove
		// e.data: x,y in [0,1] range

		switch (e.type) {
			case 'pointerdown':
				// We need to convert the type to mousedown
				e.type = 'mousedown';
				// IMPORTANT: The y axis is inverted in the DOM events
				e.data.y = 1 - e.data.y;
				this._map.dispatchDOMEvent(e);
				break;
			case 'pointermove':
				e.type = 'mousemove';
				// IMPORTANT: The y axis is inverted in the DOM events
				e.data.y = 1 - e.data.y;
				this._map.dispatchDOMEvent(e);
				break;
			case 'pointerup':
				e.type = 'mouseup';
				// IMPORTANT: The y axis is inverted in the DOM events
				e.data.y = 1 - e.data.y;
				this._map.dispatchDOMEvent(e);
				break;
			case 'pointerupoutside':
				break;
		}
	};

	get ui() {
		return this._vrUI;
	}
}
