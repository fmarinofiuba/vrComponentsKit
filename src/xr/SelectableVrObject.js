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
	showHelpers: true,
};

export const EventTypes = {
	ON_RAY_OVER: 'onRayOver', // the ray is over the object's bounding box
	ON_RAY_OUT: 'onRayOut', // the ray is out of the object's bounding box
	ON_SELECTED: 'onSelected', // the object is selected (clicked)
};

const selectablesList = [];
const controllerRayOverObject = {
	left: null,
	right: null,
};

export class SelectableVrObject extends EventsDispatcher {
	_options;
	_controllersManager;

	_targetObject;
	_boundingBox;
	_bboxHelper;

	_scene;

	constructor(targetObject, scene, options) {
		super();
		this._scene = scene;

		this._options = Object.assign({}, defaultOptions, options);
		this._controllersManager = ControllersManager.instance;
		this._targetObject = targetObject;

		// check whether targetObject is a THREE.Object3D or  a descendant of THREE.Object3D
		if (!(targetObject instanceof THREE.Object3D)) {
			throw new Error('SelectableVrObject: targetObject must be an instance of THREE.Object3D');
		}

		// Setup event listeners for squeezeStart y squeezeEnd

		this._controllersManager.addEventListener(CMEvents.ON_RAY_STARTED, this._onRayStarted.bind(this));
		//this._controllersManager.addEventListener(CMEvents.ON_RAY_ENDED, this._onRayEnded.bind(this));
		//this._controllersManager.addEventListener(CMEvents.ON_UPDATE, this._onUpdate.bind(this));

		selectablesList.push(this);
	}

	get targetObject() {
		return this._targetObject;
	}

	static testRays = function (controllersManager) {
		const nearestObject = {
			left: {
				object: null,
				distance: Infinity,
			},
			right: {
				object: null,
				distance: Infinity,
			},
		};

		// iterate over all selectable objects and test they are in the line of sight of the controller ray

		['left', 'right'].forEach((hand) => {
			const currentObjectOverRay = controllerRayOverObject[hand];
			const nearest = nearestObject[hand];
			let hc = controllersManager.getController(hand);
			if (hc) {
				selectablesList.forEach((selectable) => {
					let ray = hc.ray;
					let distance = selectable.testRayBBoxIntersection(ray);

					if (distance != null && distance < nearest.distance) {
						nearest.object = selectable;
						nearest.distance = distance;
					}
				});

				if (currentObjectOverRay && currentObjectOverRay != nearest.object) {
					// The current object over the ray is different from the nearest object
					// So, we dispatch an event to the object that is being over by ray.
					currentObjectOverRay.dispatchEvent({
						type: EventTypes.ON_RAY_OUT,
						controller: hc,
						hand: hand,
						object: currentObjectOverRay.targetObject,
					});
					// set the current object over ray to null
					controllerRayOverObject[hand] = null;
				}

				// if the nearest is not the current one, then we dispatch an event and update the current object over ray
				if (nearest.object && currentObjectOverRay != nearest.object) {
					nearest.object.dispatchEvent({
						type: EventTypes.ON_RAY_OVER,
						controller: hc,
						hand: hand,
						object: nearest.object.targetObject,
					});
					controllerRayOverObject[hand] = nearest.object;
				}
			}
		});
	};

	_onRayStarted = (e) => {
		e.handedness; // right or left
		e.ray; // ray going from the controller

		let controller = this._controllersManager.getController(e.handedness);

		if (this.testRayBBoxIntersection(e.ray)) {
			this.dispatchEvent({
				type: EventTypes.ON_SELECTED,
				controller: controller,
				object: this._targetObject,
			});
			return false; // stops event propagation
		}
	};

	testRayBBoxIntersection(ray) {
		this._targetObject.updateMatrixWorld();
		this._boundingBox = new THREE.Box3().setFromObject(this._targetObject, true);
		let res = ray.intersectBox(this._boundingBox, new THREE.Vector3());

		return res ? res.distanceTo(ray.origin) : null;
	}
}
