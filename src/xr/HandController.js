import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

import { XRGamepadMonitor, EventTypes as MonitorEvents } from './XRGamepadMonitor.js';
import { EventsDispatcher } from '../utils/EventsDispatcher.js';

export const EventTypes = {
	ON_CONNECTED: 'onConnected',
	ON_DISCONNECTED: 'onDisconnected',

	ON_SELECT_START: 'onSelectStart',
	ON_SELECT_END: 'onSelectEnd',

	ON_SQUEEZE_START: 'onSqueezeStart',
	ON_SQUEEZE_END: 'onSqueezeEnd',

	ON_RAY_STARTED: 'onRayStarted',
	ON_RAY_UPDATED: 'onRayUpdated',
	ON_RAY_ENDED: 'onRayEnded',

	ON_ROTATE_LEFT: 'onRotateLeft',
	ON_ROTATE_RIGHT: 'onRotateRight',

	ON_BUTTON_UP: 'onButtonUp',
	ON_BUTTON_DOWN: 'onButtonDown',

	ON_AXIS_FORWARD_DOWN: 'onAxisForwardDown', // when the stick y position crossed the threshold from up to down
	ON_AXIS_FORWARD_UP: 'onAxisForwardUp', // when the stick y position crossed the threshold from down to up

	ON_AXIS_Y_NOT_ZERO: 'onAxisYNotZero', // when y is <> 0, triggers on every update call

	ON_AXIS_FORWARD_CLICK: 'onAxisFowardClick',
	ON_AXIS_BACKWARD_CLICK: 'onAxisBackwardClick',

	ON_AXIS_LEFT_CLICK: 'onAxisLeftClick',
	ON_AXIS_RIGHT_CLICK: 'onAxisRightClick',
};

export class HandController extends EventsDispatcher {
	handedness;
	index; // number;
	connected; //boolean
	skilled = false;

	xr;
	parentContainer;
	monitor; // XRGamepadMonitor;

	controller; //THREE.XRTargetRaySpace;
	gamepad; //XRRemappedGamepad;

	// state variables

	triggerIsDown = false;

	time = 0;

	holdingPoint = new THREE.Object3D();
	grip; //THREE.Group;
	controllerRay;
	lastControllerRay;

	vrMenuMesh;

	clock = new THREE.Clock();
	raycaster;
	isSqueezing = false;

	attachedObject = null;
	attachedObjectParent = null;

	constructor(xr, parentContainer) {
		super();
		this.xr = xr;
		this.parentContainer = parentContainer;
		this.clock.start();
		this.raycaster = new THREE.Raycaster();
	}

	get ray() {
		return this.controllerRay.clone();
	}

	set vrMenuMesh(m) {
		this.vrMenuMesh = m;
	}

	get isSqueeing() {
		return this.isSqueezing;
	}

	// public methods

	setup(index) {
		this.index = index;
		this.controller = this.xr.getController(index);

		// handle internal events
		this.controller.addEventListener('connected', this._onConnected.bind(this));
		this.controller.addEventListener('disconnected', this._onDisconnected.bind(this));

		this.controller.addEventListener('selectstart', this._onSelectStart.bind(this));
		this.controller.addEventListener('selectend', this._onSelectEnd.bind(this));

		this.controller.addEventListener('squeezestart', this._onSqueezeStart.bind(this));
		this.controller.addEventListener('squeezeend', this._onSqueezeEnd.bind(this));

		this.parentContainer.add(this.controller);

		// export basic events
		this._exportEvent(this.controller, EventTypes.ON_CONNECTED, 'connected');
		this._exportEvent(this.controller, EventTypes.ON_DISCONNECTED, 'disconnected');

		this._exportEvent(this.controller, EventTypes.ON_SELECT_START, 'selectstart');
		this._exportEvent(this.controller, EventTypes.ON_SELECT_END, 'selectend');

		this._exportEvent(this.controller, EventTypes.ON_SQUEEZE_START, 'squeezestart');
		this._exportEvent(this.controller, EventTypes.ON_SQUEEZE_END, 'squeezeend');

		// The XRControllerModelFactory will automatically fetch controller models that match what the user is holding as closely as possible
		const controllerModelFactory = new XRControllerModelFactory();
		this.grip = this.xr.getControllerGrip(index);
		this.grip.name = `grip${index}`;
		this.grip.add(controllerModelFactory.createControllerModel(this.grip));
		this.grip.add(this.holdingPoint);

		this.parentContainer.add(this.grip);
	}

	getGrip() {
		return this.grip;
	}

	isDown(button) {
		return this.monitor.isDown(button);
	}

	getButtonValue(button) {
		return this.monitor.getButtonValue(button);
	}

	update(time, deltaTime = 0) {
		this.time += deltaTime;
		if (!this.monitor) return;

		this._updateControllerRay();
		let stickPosition = this.monitor.getStickPosition();
		this.monitor.update(deltaTime);

		if (this.triggerIsDown) {
			this.dispatchEvent({
				type: EventTypes.ON_RAY_UPDATED,
				handedness: this.handedness,
				ray: this.controllerRay.clone(),
				stickPosition: stickPosition.clone(),
			});
		}

		this._checkAndDispatchAxisYNonZeroEvent(deltaTime);
	}

	attachObject(object) {
		this.attachedObject = object;
		this.attachedObjectParent = object.parent;
		this.holdingPoint.attach(object);
	}

	detachObject() {
		// restore the object to its original parent
		if (this.attachedObject && this.attachedObjectParent) this.attachedObjectParent.attach(this.attachedObject);
		this.attachedObject = null;
	}
	// Execute haptic vibration, intensity 0 to 1
	pulse(intensity, millis) {
		this.gamepad.hapticActuators?.[0].pulse(intensity, millis);
	}

	// private methods
	_exportEvent(origin, externalType, internalType) {
		this._updateControllerRay();
		origin.addEventListener(internalType, (xrEvent) => {
			const e = { ...xrEvent };
			e.internalType = e.type;
			e.type = externalType;
			e.handedness = this.handedness;
			e.ray = this.controllerRay.clone();
			this.dispatchEvent(e);
		});
	}

	_onSqueezeStart(event) {
		this.isSqueezing = true;
	}

	_onSqueezeEnd(event) {
		this.isSqueezing = false;
	}

	_onSelectStart(event) {
		if (this.triggerIsDown) return;
		this.triggerIsDown = true;
		let stickPosition = this.monitor.getStickPosition();

		this._updateControllerRay();

		this.dispatchEvent({
			type: EventTypes.ON_RAY_STARTED,
			handedness: this.handedness,
			ray: this.controllerRay.clone(),
			stickPosition: stickPosition.clone(),
		});

		this.monitor.restartHoldingTimer();
	}

	_onSelectEnd(event) {
		if (!this.triggerIsDown) return;
		this.triggerIsDown = false;

		let stickPosition = this.monitor.getStickPosition();

		this._updateControllerRay();

		this.dispatchEvent({
			type: EventTypes.ON_RAY_ENDED,
			handedness: this.handedness,
			ray: this.controllerRay.clone(),
			stickPosition: stickPosition.clone(),
		});

		this.monitor.restartHoldingTimer();
	}

	_onConnected(event) {
		this.connected = true;
		this.handedness = event.data.handedness;
		this.gamepad = event.data.gamepad;

		this.monitor = new XRGamepadMonitor(this.xr, this.handedness);

		this._exportEvent(this.monitor, EventTypes.ON_BUTTON_DOWN, MonitorEvents.ON_BUTTON_DOWN);
		this._exportEvent(this.monitor, EventTypes.ON_BUTTON_UP, MonitorEvents.ON_BUTTON_UP);

		this._exportEvent(this.monitor, EventTypes.ON_BUTTON_UP, MonitorEvents.ON_AXIS_FORWARD_DOWN);
		this._exportEvent(this.monitor, EventTypes.ON_BUTTON_UP, MonitorEvents.ON_AXIS_FORWARD_UP);

		this._exportEvent(this.monitor, EventTypes.ON_AXIS_FORWARD_CLICK, MonitorEvents.ON_AXIS_FORWARD_CLICK);
		this._exportEvent(this.monitor, EventTypes.ON_AXIS_BACKWARD_CLICK, MonitorEvents.ON_AXIS_BACKWARD_CLICK);
		this._exportEvent(this.monitor, EventTypes.ON_AXIS_LEFT_CLICK, MonitorEvents.ON_AXIS_LEFT_CLICK);
		this._exportEvent(this.monitor, EventTypes.ON_AXIS_RIGHT_CLICK, MonitorEvents.ON_AXIS_RIGHT_CLICK);

		this.monitor.addEventListener(MonitorEvents.ON_AXIS_X_HOLDED, (event) => {
			if (event.value > 0) {
				this.dispatchEvent({
					type: EventTypes.ON_ROTATE_RIGHT,
					handedness: this.handedness,
				});
			} else {
				this.dispatchEvent({
					type: EventTypes.ON_ROTATE_LEFT,
					handedness: this.handedness,
				});
			}
		});

		this.controller.add(this._buildController(event.data));
	}

	_onDisconnected(event) {
		this.controller.remove(this.controller.children[0]);
		this.monitor = null;
	}

	_updateControllerRay() {
		const mat = new THREE.Matrix4();

		this.lastControllerRay = this.controllerRay?.clone();

		mat.identity().extractRotation(this.controller.matrixWorld);

		const origin = new THREE.Vector3().setFromMatrixPosition(this.controller.matrixWorld);
		const direction = new THREE.Vector3().set(0, 0, -1).applyMatrix4(mat);

		this.controllerRay = new THREE.Ray(origin, direction);
	}

	_buildController(data) {
		let geometry, material;

		// See WebXR > Concepts > Targeting categories
		// https://immersive-web.github.io/webxr/input-explainer.html#concepts
		switch (data.targetRayMode) {
			// Pointers can be tracked separately from the viewer (e.g. Cculus touch controllers)
			case 'tracked-pointer':
				geometry = new THREE.BufferGeometry();
				geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
				geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

				material = new THREE.LineBasicMaterial({
					vertexColors: true,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
					transparent: true,
				});

				return new THREE.Line(geometry, material);

			// Gaze-based input sources do not have their own tracking mechanism and instead use the viewer’s head position for targeting.
			case 'gaze':
				geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1);
				material = new THREE.MeshBasicMaterial({
					opacity: 0.5,
					transparent: true,
					depthWrite: false,
				});
				return new THREE.Mesh(geometry, material);
		}
	}

	_checkAndDispatchAxisYNonZeroEvent(deltaTime) {
		if (!this.monitor) return;
		let pos = this.monitor.getStickPosition();
		if (Math.abs(pos.y) > 0 && !this.monitor.xIsAboveHoldThreshold()) {
			// this is used to translate the user on every frame
			this.dispatchEvent({
				type: EventTypes.ON_AXIS_Y_NOT_ZERO,
				handedness: this.handedness,
				ray: this.controllerRay.clone(),
				stickPosition: pos,
				deltaTime: deltaTime,
			});
		}
	}
}
