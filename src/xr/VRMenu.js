import * as THREE from 'three';
import { ControllersManager, EventTypes as CMEventTypes } from './ControllersManager.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { InteractiveVRObject } from './InteractiveVRObject.js';
import { VrInteractivePanel } from './VrInteractivePanel.js';

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

export class VrMenu extends VrInteractivePanel {
	_vrUI;

	constructor(worldContainer, controllersManager, options) {
		super(worldContainer, controllersManager, options);

		if (this.options.mode == 'swatch') {
			//this._container.position.set(0, 0.1, -0.2);

			//	-z goes forward in the controller's hand direction
			//	+y goes above the controller

			this._container.position.set(-0.03, 0.1, -0.14);
			this._container.scale.set(0.35, 0.35, 0.35);
			this._container.rotation.order = 'YXZ';
			this._container.rotation.y = THREE.MathUtils.degToRad(90);
			this._container.rotation.x = THREE.MathUtils.degToRad(-10);
			this._container.rotation.z = THREE.MathUtils.degToRad(-45);
		} else {
			this._container.position.set(0, 0.5, -1);
			this._container.scale.set(1, 1, 1);
		}
		this._container.visible = false; // initially hidden
		this._setupEventListeners();
	}

	// We override this method to add repositioning of the panel
	setVisible(visible) {
		this._container.visible = visible;
		if (visible && this.options.mode == 'panel') this._repositionPanel();
	}

	_updateAspectRatio(canvasWidthPx, canvasHeightPx, uiHeightPx) {
		0;
		const aspect = canvasWidthPx / uiHeightPx;

		// map 0 .. uiHeightPx to 0 .. 1, to cover the whole mesh with the UI pixels only
		const yScale = uiHeightPx / canvasHeightPx; // map scaling factor
		// We center the map in the canvas, vertically
		const yOffset = 1 - yScale;

		//console.log(ui.zone.h, ui.maxHeight, h, ui.zone.y, ui.forceHeight);

		// extend the area covered by the UI, to cover the whole canvas
		this._map.offset.set(0, yOffset);
		this._map.repeat.set(1, yScale);

		this._mesh.scale.y = 1 / aspect;
		this._mesh.position.y = this._mesh.scale.y / 2;
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

		this._container.position.copy(position);

		this._container.rotation.order = 'ZYX';
		this._container.rotation.y = -Math.atan2(viewDirection.z, viewDirection.x) - Math.PI / 2;
		this._container.rotation.x = -THREE.MathUtils.degToRad(this.options.panel.inclination);
	}
	/*
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
	}*/

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
				grip.add(this._container);
			}
		} else {
			// panel mode
			this._worldContainer.add(this._container);
		}
	}

	_onLeftControllerDisconnected(e) {
		let marker = e.handedness == 'left' ? this._leftHitMarker : this._rightHitMarker;
		marker.visible = false;

		if (this._lastRayStartedHand == e.handedness) {
			this._onPointerEvent(this._createPointerEvent('pointerupoutside'));

			this._lastRayStartedHand = null;
		}
		if (this.options.mode == 'swatch') {
			let grip = this._controllersManager?.left?.getGrip();
			if (grip) {
				grip.remove(this._container);
			}
		} else {
			// panel mode
			this._worldContainer.remove(this._container);
		}
	}

	get ui() {
		throw Error('Should be implemented in a subclass');
	}
}
