import * as THREE from 'three';
import { ControllersManager, EventTypes as CMEventTypes } from './ControllersManager.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { InteractiveVRObject } from './InteractiveVRObject.js';

export const defaultOptions = {
	mode: 'panel', // "swatch", "panel",
	debugLevel: 1,

	size: 1, // meters
};

/*
VrInteractivePanel class is designed to create an interactive VR panel within a Three.js scene. 

It extends the functionality of a basic 3D object by integrating VR-specific
interactions, such as handling ray events from VR controllers. 

The class sets up a 3D panel with front and back faces, manages its visibility, 
and updates its aspect ratio based on the dynamic content dimensions.

It also includes methods for handling ray events (onRayStarted, onRayUpdated, onRayEnded) required by
the InteractiveVRObject class, which facilitates interaction with VR controllers. 

The class is intended to be extended by subclasses that implement specific UI functionality, 
as indicated by the abstract methods initCanvas, _onPointerEvent, and ui.

*/

export class VrInteractivePanel {
	_container;
	_mesh;
	_map;

	_mapYScale;
	_mapYOffset;

	_controllersManager;
	_worldContainer;

	_frontMaterial;
	_backMaterial;

	constructor(worldContainer, controllersManager, options) {
		this.options = { ...defaultOptions, ...options };

		if (worldContainer === undefined || controllersManager === undefined) {
			throw Error('VrMenu: Missing parameters');
		}
		this._controllersManager = controllersManager;
		this._worldContainer = worldContainer;

		this._container = new THREE.Group();

		this._frontMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this._backMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

		this._mesh = new THREE.Mesh(this._buildGeometry(), [this._backMaterial, this._frontMaterial]);
		this._container.add(this._mesh);

		// axes helper
		//this._container.add(new THREE.AxesHelper(1));

		this._interactiveVRObject = new InteractiveVRObject(this, worldContainer, controllersManager);
	}

	_buildGeometry() {
		// create geometry for the menu with front and back faces
		const frontface = new THREE.PlaneGeometry(this.options.size, this.options.size);
		const backface = new THREE.PlaneGeometry(this.options.size, this.options.size);
		backface.rotateY(Math.PI);
		let geo = new THREE.BufferGeometry();
		geo = BufferGeometryUtils.mergeGeometries([backface, frontface]);
		let c1 = frontface.index.count;
		let c2 = backface.index.count;
		geo.addGroup(0, c1, 0);
		geo.addGroup(c1, c2, 1);
		return geo;
	}

	setVisible(visible) {
		this._container.visible = visible;
	}

	toggleVisibility() {
		this._container.visible = !this._container.visible;
		this.setVisible(this._container.visible);
	}

	// canvasHeightPx is the height of the canvas in pixels
	// canvasWidthPx is the width of the canvas in pixels
	// contentHeightPx is the height of the content in pixels within the canvas

	_updateAspectRatio(canvasWidthPx, canvasHeightPx, contentHeightPx) {
		0;
		const aspect = canvasWidthPx / contentHeightPx;

		// map 0 .. contentHeightPx to 0 .. 1, to cover the whole mesh with the UI pixels only
		const yScale = contentHeightPx / canvasHeightPx; // map scaling factor
		// We center the map in the canvas, vertically
		const yOffset = 1 - yScale;

		// extend the area covered by the content, to cover the whole canvas
		this._map.offset.set(0, yOffset);
		this._map.repeat.set(1, yScale);

		this._mesh.scale.y = 1 / aspect;
		//this._mesh.position.y = this._mesh.scale.y / 2;
		/*
		if (this.options.debugLevel > 0) {
			console.log('_updateUiAspectRatio()');
			console.log('canvas w,h:', canvasWidthPx, canvasHeightPx);
			console.log('contentHeightPx:', contentHeightPx);
			console.log('yOffset:', yOffset);
			console.log('yScale:', yScale);
			console.log('aspect:', aspect);
		}*/

		this._mapYOffset = yOffset;
		this._mapYScale = yScale;
	}

	// Ray event handlers required by InteractiveVRObject

	onRayStarted(intersection) {
		this._onPointerEvent(this._createPointerEvent('pointerdown', intersection));
	}

	onRayUpdated(intersection) {
		this._onPointerEvent(this._createPointerEvent('pointermove', intersection));
	}

	onRayEnded(intersection) {
		if (intersection) {
			this._onPointerEvent(this._createPointerEvent('pointerup', intersection));
		} else {
			this._onPointerEvent(this._createPointerEvent('pointerupoutside'));
		}
	}

	_createPointerEvent(type, intersection) {
		let event = { type: type };
		if (intersection && intersection.uv) {
			let coords = intersection.uv.clone();
			coords.y = coords.y * this._mapYScale + this._mapYOffset;
			event.data = coords;
		}
		return event;
	}
	// for ray intersection testing
	getIntersectionMesh() {
		return this._mesh;
	}

	// a method that tells whether vr ray events should be tested against this object
	shouldTestRayEvents() {
		return this._container.visible;
	}

	// abstract methods and properties

	// It should define the _map texture
	createMap() {
		throw Error('Should be implemented in a subclass');
	}

	// This is called when a ray event is triggered over the panel
	_onPointerEvent = (e) => {
		// e.type: pointerdown,pointerup,pointermove,pointerupoutside
		// e.data: x,y in [0,1] range. e.data may be undefined
		throw Error('Should be implemented in a subclass');
	};

	// public getters
	get mesh() {
		return this._container;
	}
}
