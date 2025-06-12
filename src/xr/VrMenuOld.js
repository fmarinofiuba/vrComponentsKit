import * as THREE from 'three';
import { ControllersManager, EventTypes as CMEventTypes } from './ControllersManager.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { InteractiveVRObject } from './InteractiveVRObject.js';

export const defaultOptions = {
	mode: 'panel', // "swatch", "panel",
	debugLevel: 1,
	panel: {
		width: 1, // meters
		inclination: 30, // degrees
		distance: 1.25, // meters
		verticalOffset: -0.5, // meters
	},
};

export class VrMenu {
	_menuContainer;
	_menuMesh;
	_menuMap;

	_vrUI;
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

		// create a container for the menu
		this._menuContainer = new THREE.Group();
		//this._menuContainer.visible = false;

		if (this.options.mode == 'swatch') {
			//this._menuContainer.position.set(0, 0.1, -0.2);

			//	-z goes forward in the controller's hand direction
			//	+y goes above the controller

			this._menuContainer.position.set(-0.03, 0.1, -0.14);
			this._menuContainer.scale.set(0.35, 0.35, 0.35);
			this._menuContainer.rotation.order = 'YXZ';
			this._menuContainer.rotation.y = THREE.MathUtils.degToRad(90);
			this._menuContainer.rotation.x = THREE.MathUtils.degToRad(-10);
			this._menuContainer.rotation.z = THREE.MathUtils.degToRad(-45);
		} else {
			this._menuContainer.position.set(0, 0.5, -1);
			this._menuContainer.scale.set(1, 1, 1);
		}

		// create geometry for the menu with front and back faces
		const frontface = new THREE.PlaneGeometry(this.options.panel.width, 1);
		const backface = frontface.clone();
		backface.rotateY(Math.PI);
		let geo = new THREE.BufferGeometry();
		geo = BufferGeometryUtils.mergeGeometries([backface, frontface]);
		let c1 = frontface.index.count;
		let c2 = backface.index.count;
		geo.addGroup(0, c1, 0);
		geo.addGroup(c1, c2, 1);

		this._frontMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this._backMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

		this._menuMesh = new THREE.Mesh(geo, [this._backMaterial, this._frontMaterial]);
		let box = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }));
		this._menuMesh.add(box);
		this._menuContainer.add(this._menuMesh);

		this._interactiveObject = new InteractiveVRObject(this, worldContainer, controllersManager);

		this._setupEventListeners();
	}

	setVisible(visible) {
		this._menuContainer.visible = visible;
		if (visible && this.options.mode == 'panel') this._repositionPanel();
	}

	toggleVisibility() {
		this._menuContainer.visible = !this._menuContainer.visible;
		this.setVisible(this._menuContainer.visible);
	}

	_updateUiAspectRatio(canvasWidthPx, canvasHeightPx, uiHeightPx) {
		0;
		const aspect = canvasWidthPx / uiHeightPx;

		// map 0 .. uiHeightPx to 0 .. 1, to cover the whole mesh with the UI pixels only
		const yScale = uiHeightPx / canvasHeightPx; // map scaling factor
		// We center the map in the canvas, vertically
		const yOffset = 1 - yScale;

		//console.log(ui.zone.h, ui.maxHeight, h, ui.zone.y, ui.forceHeight);

		// extend the area covered by the UI, to cover the whole canvas
		this._menuMap.offset.set(0, yOffset);
		this._menuMap.repeat.set(1, yScale);

		this._menuMesh.scale.y = 1 / aspect;
		this._menuMesh.position.y = this._menuMesh.scale.y / 2;
		/*
		if (this.options.debugLevel > 0) {
			console.log('_updateUiAspectRatio()');
			console.log('canvas w,h:', canvasWidthPx, canvasHeightPx);
			console.log('uiHeightPx:', uiHeightPx);
			console.log('yOffset:', yOffset);
			console.log('yScale:', yScale);
			console.log('aspect:', aspect);
		}*/

		this._mapYOffset = yOffset;
		this._mapYScale = yScale;
	}

	_repositionPanel() {
		// position and viewDirection are defined in world coordinates
		const { position, viewDirection } = this._controllersManager.getHeadsetTransform();

		viewDirection.y = 0; // we want to project direction on XZ plane
		viewDirection.normalize();
		viewDirection.multiplyScalar(this.options.panel.distance);

		position.y += this.options.panel.verticalOffset;
		position.add(viewDirection);

		this._menuContainer.position.copy(position);

		this._menuContainer.rotation.order = 'ZYX';
		this._menuContainer.rotation.y = -Math.atan2(viewDirection.z, viewDirection.x) - Math.PI / 2;
		this._menuContainer.rotation.x = -THREE.MathUtils.degToRad(this.options.panel.inclination);
	}

	// Ray event handlers required by InteractiveVRObject

	onRayStarted(intersection) {
		this._onPointerEvent(this._createEvent('pointerdown', intersection));
	}

	onRayUpdated(intersection) {
		this._onPointerEvent(this._createEvent('pointermove', intersection));
	}

	onRayEnded(intersection) {
		if (intersection) {
			this._onPointerEvent(this._createEvent('pointerup', intersection));
		} else {
			this._onPointerEvent(this._createEvent('pointerupoutside'));
		}
	}

	getIntersectionMesh() {
		return this._menuMesh;
	}

	// a method that tells whether vr ray events should be tested against this object
	shouldTestRayEvents() {
		return this._menuContainer.visible;
	}

	// event handlers

	_setupEventListeners() {
		this._controllersManager.addEventListener(
			CMEventTypes.ON_LEFT_CONTROLLER_CONNECTED,
			this._onLeftControllerConnected.bind(this)
		);

		this._controllersManager.addEventListener(
			CMEventTypes.ON_LEFT_CONTROLLER_DISCONNECTED,
			this._onLeftControllerDisconnected.bind(this)
		);
	}

	_onLeftControllerConnected(e) {
		if (this.options.mode == 'swatch') {
			let grip = this._controllersManager?.left?.getGrip();
			if (grip) {
				grip.add(this._menuContainer);
			}
		} else {
			// panel mode
			this._worldContainer.add(this._menuContainer);
		}
	}

	_onLeftControllerDisconnected(e) {
		let marker = e.handedness == 'left' ? this._leftHitMarker : this._rightHitMarker;
		marker.visible = false;

		if (this._lastRayStartedHand == e.handedness) {
			this._onPointerEvent(this._createEvent('pointerupoutside'));

			this._lastRayStartedHand = null;
		}
		if (this.options.mode == 'swatch') {
			let grip = this._controllersManager?.left?.getGrip();
			if (grip) {
				grip.remove(this._menuContainer);
			}
		} else {
			// panel mode
			this._worldContainer.remove(this._menuContainer);
		}
	}

	_createEvent(type, intersection) {
		let event = { type: type };
		if (intersection && intersection.uv) {
			let coords = intersection.uv.clone();
			coords.y = coords.y * this._mapYScale + this._mapYOffset;
			event.data = coords;
		}
		return event;
	}

	get mesh() {
		return this._menuMesh;
	}

	// abstract methods and properties

	initCanvas() {
		throw Error('Should be implemented in a subclass');
	}

	_onPointerEvent = (e) => {
		// e.type: pointerdown,pointerup,pointermove,pointerupoutside
		// e.data: x,y in [0,1] range. e.data may be undefined

		throw Error('Should be implemented in a subclass');
	};

	get ui() {
		throw Error('Should be implemented in a subclass');
	}
}
