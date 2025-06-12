import * as THREE from 'three';

import { HandController, EventTypes as HCEvents } from './HandController.js';
import { EventsDispatcher } from '../utils/EventsDispatcher.js';

export const EventTypes = {
	ON_LEFT_CONTROLLER_CONNECTED: 'onLeftControllerConnected',
	ON_RIGHT_CONTROLLER_CONNECTED: 'onRightControllerConnected',

	ON_LEFT_CONTROLLER_DISCONNECTED: 'onLeftControllerDisconnected',
	ON_RIGHT_CONTROLLER_DISCONNECTED: 'onRightControllerDisconnected',

	ON_RAY_STARTED: 'onRayStarted',
	ON_RAY_UPDATED: 'onRayUpdated',
	ON_RAY_ENDED: 'onRayEnded',

	ON_ROTATE_LEFT: 'onRotateLeft',
	ON_ROTATE_RIGHT: 'onRotateRight',

	ON_BUTTON_UP: 'onButtonUp',
	ON_BUTTON_DOWN: 'onButtonDown',

	ON_AXIS_FORWARD_CLICK: 'onAxisFowardClick',
	ON_AXIS_BACKWARD_CLICK: 'onAxisBackwardClick',

	ON_AXIS_LEFT_CLICK: 'onAxisLeftClick',
	ON_AXIS_RIGHT_CLICK: 'onAxisRightClick',

	//ON_RESTART: 'onRestart',
	ON_AXIS_Y_NOT_ZERO: 'onAxisYNotZero',

	ON_SQUEEZE_START: 'onSqueezeStart',
	ON_SQUEEZE_END: 'onSqueezeEnd',

	ON_DOUBLE_SQUEEZE_STARTED: 'onDoubleSqueezeStarted',
	ON_DOUBLE_SQUEEZE_ENDED: 'onDoubleSqueezeEnded',

	ON_UPDATE: 'onUpdate',
};

export class ControllersManager extends EventsDispatcher {
	xr;
	controller0;
	controller1;
	userHandedness = 'right';
	parentContainer;
	me = this;
	options;

	_doubleSqueezeGesture = {
		left: {
			isDown: false,
			initialPosition: null,
		},
		right: {
			isDown: false,
			initialPosition: null,
		},
		initialDistance: null,
		initialCenterPoint: null,
	};

	constructor(xr, parentContainer, options) {
		if (ControllersManager.instance) {
			return ControllersManager.instance;
		}
		super();

		this.options = options;
		this.xr = xr;
		this.parentContainer = parentContainer;

		this.controller0 = new HandController(this.xr, this.parentContainer);
		this.controller0.setup(0);

		this.controller1 = new HandController(this.xr, this.parentContainer);
		this.controller1.setup(1);

		this._setupEventListeners();
		//this.xr.addEventListener('sessionstart', (e) => {});
		//this.xr.addEventListener('sessionend', (e) => {});
		ControllersManager.instance = this;
	}

	get connected() {
		return this.controller0.connected && this.controller1.connected;
	}

	get skilledHand() {
		if (this.controller0.handedness == this.userHandedness) return this.controller0;
		else return this.controller1;
	}

	get otherHand() {
		if (this.controller0.handedness != this.userHandedness) return this.controller0;
		else return this.controller1;
	}

	get right() {
		if (this.controller0 && this.controller0.handedness == 'right') return this.controller0;
		else if (this.controller1 && this.controller1.handedness === 'right') return this.controller1;
		return null;
	}

	get left() {
		if (this.controller0 && this.controller0.handedness == 'left') return this.controller0;
		else if (this.controller1 && this.controller1.handedness === 'left') return this.controller1;
		return null;
	}

	getController(hand) {
		if (hand == 'right') return this.right;
		if (hand == 'left') return this.left;
	}

	getDistanceBetweenHands() {
		if (!this.controller0 || !this.controller1) return null;

		let p0 = this.controller0.controller.getWorldPosition(new THREE.Vector3());
		let p1 = this.controller1.controller.getWorldPosition(new THREE.Vector3());
		return p0.distanceTo(p1);
	}

	getCenterPointBetweenHands() {
		if (!this.controller0 || !this.controller1) return null;
		let p0 = this.controller0.controller.getWorldPosition(new THREE.Vector3());
		let p1 = this.controller1.controller.getWorldPosition(new THREE.Vector3());
		return new THREE.Vector3().addVectors(p0, p1).multiplyScalar(0.5);
	}

	update(time, deltaTime) {
		if (this.controller0) this.controller0.update(time, deltaTime);
		if (this.controller1) this.controller1.update(time, deltaTime);
		this.dispatchEvent({ type: EventTypes.ON_UPDATE, time, deltaTime });
	}

	toggleHandedness(handedness) {
		if (handedness == undefined) handedness = this.userHandedness == 'right' ? 'left' : 'right';

		this.userHandedness = handedness;

		this.right.skilled = handedness == 'right';
		this.left.skilled = handedness == 'left';

		this.otherHand.getGrip().add(this.vrMenu);
	}

	getHeadsetTransform() {
		// devuelve en coordenadas de mundo !!
		let xrCamera = this.xr.getCamera();
		let e = xrCamera.matrixWorld.elements;

		//La posición se calcula utilizando los elementos [12], [13], y [14] de la matriz matrixWorld.
		// Estos elementos corresponden a la posición de la cámara en el sistema de coordenadas del mundo.
		let position = new THREE.Vector3(e[12] / e[15], e[13] / e[15], e[14] / e[15]);

		//Los elementos [8], [9], y [10] de la matriz representan la dirección del eje z de la cámara en coordenadas del mundo.
		//En Three.js, la cámara mira en la dirección del eje negativo z local, por eso se usa negativo
		let viewDirection = new THREE.Vector3(-e[8], -e[9], -e[10]).normalize();

		return { position, viewDirection };
	}

	// private methods
	_exportEvent(origin, externalType, internalType) {
		origin.addEventListener(internalType, (event) => {
			const e = { ...event };
			e.internalType = e.type;
			e.type = externalType;
			this.dispatchEvent(e);
		});
	}

	_setupEventListeners() {
		[this.controller0, this.controller1].forEach((o, i) => {
			o.addEventListener(HCEvents.ON_CONNECTED, this._onControllerConnected.bind(this, o));
			o.addEventListener(HCEvents.ON_DISCONNECTED, this._onControllerDisconnected.bind(this, o));

			o.addEventListener(HCEvents.ON_SQUEEZE_START, this._onControllerSqueezeStart.bind(this, o));
			o.addEventListener(HCEvents.ON_SQUEEZE_END, this._onControllerSqueezeEnd.bind(this, o));

			this._exportEvent(o, EventTypes.ON_SQUEEZE_START, HCEvents.ON_SQUEEZE_START);
			this._exportEvent(o, EventTypes.ON_SQUEEZE_END, HCEvents.ON_SQUEEZE_END);

			this._exportEvent(o, EventTypes.ON_RAY_STARTED, HCEvents.ON_RAY_STARTED);
			this._exportEvent(o, EventTypes.ON_RAY_UPDATED, HCEvents.ON_RAY_UPDATED);
			this._exportEvent(o, EventTypes.ON_RAY_ENDED, HCEvents.ON_RAY_ENDED);

			this._exportEvent(o, EventTypes.ON_AXIS_Y_NOT_ZERO, HCEvents.ON_AXIS_Y_NOT_ZERO);

			this._exportEvent(o, EventTypes.ON_ROTATE_LEFT, HCEvents.ON_ROTATE_LEFT);
			this._exportEvent(o, EventTypes.ON_ROTATE_RIGHT, HCEvents.ON_ROTATE_RIGHT);

			this._exportEvent(o, EventTypes.ON_BUTTON_DOWN, HCEvents.ON_BUTTON_DOWN);
			this._exportEvent(o, EventTypes.ON_BUTTON_UP, HCEvents.ON_BUTTON_UP);

			this._exportEvent(o, EventTypes.ON_AXIS_FORWARD_CLICK, HCEvents.ON_AXIS_FORWARD_CLICK);
			this._exportEvent(o, EventTypes.ON_AXIS_BACKWARD_CLICK, HCEvents.ON_AXIS_BACKWARD_CLICK);

			this._exportEvent(o, EventTypes.ON_AXIS_LEFT_CLICK, HCEvents.ON_AXIS_LEFT_CLICK);
			this._exportEvent(o, EventTypes.ON_AXIS_RIGHT_CLICK, HCEvents.ON_AXIS_RIGHT_CLICK);
		});
	}

	_onControllerConnected(controller, event) {
		if (this.userHandedness == controller.handedness) {
			controller.skilled = true;
		} else {
			controller.skilled = false;
			//controller.getGrip().add(this.vrMenu);
		}

		this.dispatchEvent({
			type:
				controller.handedness == 'right'
					? EventTypes.ON_RIGHT_CONTROLLER_CONNECTED
					: EventTypes.ON_LEFT_CONTROLLER_CONNECTED,
			controller: controller,
		});
	}

	_onControllerDisconnected(controller, event) {
		this.dispatchEvent({
			type:
				controller.handedness == 'right'
					? EventTypes.ON_RIGHT_CONTROLLER_DISCONNECTED
					: EventTypes.ON_LEFT_CONTROLLER_DISCONNECTED,
		});
	}

	_onControllerSqueezeStart(hc, event) {
		let gesture = this._doubleSqueezeGesture[event.handedness];

		gesture.isDown = true;
		gesture.initialPosition = hc.controller.getWorldPosition(new THREE.Vector3());
		// if both squeezes are down, trigger the action.
		if (this._doubleSqueezeGesture['left'].isDown && this._doubleSqueezeGesture['right'].isDown) {
			this._doubleSqueezeGesture.initialDistance = this.getDistanceBetweenHands();
			this._doubleSqueezeGesture.initialCenterPoint = this.getCenterPointBetweenHands();
			this.dispatchEvent({
				type: EventTypes.ON_DOUBLE_SQUEEZE_STARTED,
				initialDistance: this._doubleSqueezeGesture.initialDistance,
				initialCenterPoint: this._doubleSqueezeGesture.initialCenterPoint,
			});
		}
	}

	_onControllerSqueezeEnd(controller, event) {
		this._doubleSqueezeGesture[event.handedness].isDown = false;
		// exclusive OR
		if (this._doubleSqueezeGesture['left'].isDown != this._doubleSqueezeGesture['right'].isDown) {
			this.dispatchEvent({
				type: EventTypes.ON_DOUBLE_SQUEEZE_ENDED,
			});
		}
	}
}
