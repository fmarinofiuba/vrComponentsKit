/**
 * GrabbableVrObject
 *
 * This class provides functionality to make objects grabbable in VR environments.
 * It supports both contact grabbing (when controller is close to the object) and
 * remote grabbing (ray-based interaction). The class handles controller interactions,
 * object attachment/detachment, and provides events for grab start/end actions.
 */
import * as THREE from 'three';
import { EventsDispatcher } from '../utils/EventsDispatcher.js';
import { ControllersManager, EventTypes as CMEvents } from './ControllersManager.js';

export const defaultOptions = {
	contactGrabbing: {
		enabled: true,
		distanceThreshold: 0.03,
	},
	remoteGrabbing: {
		enabled: true,
	},
	showHelpers: true,
};

export const EventTypes = {
	ON_GRAB_START: 'onGrabStart',
	ON_GRAB_END: 'onGrabEnd',
};

export class GrabbableVrObject extends EventsDispatcher {
	_options;
	_controllersManager;

	_targetObject;
	_grabbingController;
	_boundingBox;
	_bboxHelper;

	_targetState;
	_scene;

	constructor(targetObject, scene, options) {
		super();
		this._scene = scene;

		this._options = Object.assign({}, defaultOptions, options);
		this._controllersManager = ControllersManager.instance;
		this._targetObject = targetObject;

		// check whether targetObject is a THREE.Object3D or  a descendant of THREE.Object3D
		if (!(targetObject instanceof THREE.Object3D)) {
			throw new Error('GrabbableVrObject: targetObject must be an instance of THREE.Object3D');
		}

		// Setup event listeners for squeezeStart y squeezeEnd

		if (this._options.contactGrabbing.enabled || this._options.remoteGrabbing.enabled) {
			this._controllersManager.addEventListener(CMEvents.ON_SQUEEZE_START, this._onSqueezeStart.bind(this));
			this._controllersManager.addEventListener(CMEvents.ON_SQUEEZE_END, this._onSqueezeEnd.bind(this));
			this._controllersManager.addEventListener(CMEvents.ON_UPDATE, this._onUpdate.bind(this));
		}
	}

	_onUpdate(e) {
		if (!this._grabbingController) return;
		if (this._targetState == 'flyToGrip') {
			let grip = this._grabbingController.getGrip();
			let gripPos = grip.getWorldPosition(new THREE.Vector3());
			let pos = this._targetObject.position;

			let incrementVector = new THREE.Vector3();
			incrementVector.subVectors(gripPos, pos);
			incrementVector.multiplyScalar(0.5);
			this._targetObject.position.add(incrementVector);

			e.time;
			e.delta;

			// check distance to grip
			let distanceToGrip = this._targetObject.position.distanceTo(gripPos);
			if (distanceToGrip < 0.15) {
				this._grabbingController.attachObject(this._targetObject);
				this._targetState = 'grabbed';
			}
		}
	}

	_getControllerDistanceToBBox(which) {
		let controller = this._controllersManager.getController(which);
		if (!controller) return null;

		let grip = controller.getGrip();

		this._targetObject.updateMatrixWorld();

		this._boundingBox = new THREE.Box3().setFromObject(this._targetObject, true);
		let gripWorldPos = grip.getWorldPosition(new THREE.Vector3());

		// calculate distance bbox edges, localPoint should be in parent coordinates
		let distance = this._boundingBox.distanceToPoint(gripWorldPos);
		return distance;
	}

	get distanceToRightController() {
		return this._getControllerDistanceToBBox('right');
	}

	_onSqueezeStart = (e) => {
		// The object is already grabbed by another controller
		if (this._grabbingController) return;

		e.handedness; // right or left
		e.ray; // ray going from the controller

		// measure distance from ray.origin to the target object
		// if distance is less than threshold, grab the object

		if (this._options.contactGrabbing.enabled) {
			let controller = this._controllersManager.getController(e.handedness);
			let grip = controller.getGrip();
			this._targetObject.updateMatrixWorld();
			this._boundingBox = new THREE.Box3().setFromObject(this._targetObject, true);
			let gripWorldPos = grip.getWorldPosition(new THREE.Vector3());

			let distance = this._boundingBox.distanceToPoint(gripWorldPos);

			if (distance < this._options.contactGrabbing.distanceThreshold) {
				this._grabbingController = controller;
				this._grabbingController.attachObject(this._targetObject);
				this.dispatchEvent({
					type: EventTypes.ON_GRAB_START,
					controller: this._grabbingController,
					object: this._targetObject,
				});
				return false; // stops event propagation
			}
		}

		if (this._options.remoteGrabbing.enabled) {
			let controller = this._controllersManager.getController(e.handedness);
			//let grip = controller.getGrip();
			this._targetObject.updateMatrixWorld();
			this._boundingBox = new THREE.Box3().setFromObject(this._targetObject, true);
			let res = e.ray.intersectBox(this._boundingBox, new THREE.Vector3());
			if (res) {
				this._grabbingController = controller;

				let parent = this._targetObject.parent;
				// get transforms of _targetObject in world coordinates
				let worldPos = this._targetObject.getWorldPosition(new THREE.Vector3());
				let worldQuat = this._targetObject.getWorldQuaternion(new THREE.Quaternion());
				let worldScale = this._targetObject.getWorldScale(new THREE.Vector3());

				parent.remove(this._targetObject);
				this._scene.add(this._targetObject);
				this._targetObject.position.copy(worldPos);
				this._targetObject.quaternion.copy(worldQuat);
				this._targetObject.scale.copy(worldScale);

				this._targetState = 'flyToGrip';
				this.dispatchEvent({
					type: EventTypes.ON_GRAB_START,
					controller: this._grabbingController,
					object: this._targetObject,
				});
				return false; // stops event propagation
			}
		}
	};

	_onSqueezeEnd = (e) => {
		if (this._grabbingController) {
			this._grabbingController.detachObject();
			this.dispatchEvent({
				type: EventTypes.ON_GRAB_END,
				controller: this._grabbingController,
				object: this._targetObject,
			});
			this._grabbingController = null;
		}
	};
}
