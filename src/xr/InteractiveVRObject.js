import * as THREE from 'three';
import { ControllersManager, EventTypes as CMEventTypes } from './ControllersManager.js';

export const defaultOptions = {
	debugLevel: 1,
};

export class InteractiveVRObject {
	_raycaster; // raycaster used for hit testing
	_hitTestMesh; // mesh used for hit testing
	_lastRayStartedOnHand; // hand that started the ray
	_options; // options
	_leftHitMarker; // left hit marker
	_rightHitMarker; // right hit marker
	_targetObject; // target object

	constructor(targetObject, worldContainer, controllersManager, options) {
		this.options = { ...defaultOptions, ...options };
		if (worldContainer === undefined || controllersManager === undefined || targetObject === undefined) {
			throw Error('InteractiveVRObject: Missing parameters');
		}

		// if targetObject does not implement the required methods, throw an error
		if (typeof targetObject.onRayStarted !== 'function' || typeof targetObject.onRayEnded !== 'function') {
			throw Error('InteractiveVRObject: targetObject does not implement the required methods');
		}

		if (targetObject?.getIntersectionMesh() != undefined) {
			this._hitTestMesh = targetObject.getIntersectionMesh();
		} else {
			throw Error('InteractiveVRObject: targetObject does not implement the getIntersectionMesh method');
		}

		this._targetObject = targetObject;
		this._controllersManager = controllersManager;
		this._worldContainer = worldContainer;
		this._controllersManager = controllersManager;
		this._raycaster = new THREE.Raycaster();

		// create hit markers
		if (this.options.debugLevel > 0) {
			const markerGeo = new THREE.SphereGeometry(0.01, 16, 8);
			this._leftHitMarker = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
			this._rightHitMarker = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
			//this._leftHitMarker.visible = false;
			//this._rightHitMarker.visible = false;

			this._worldContainer.add(this._leftHitMarker);
			this._worldContainer.add(this._rightHitMarker);
		}

		this._setupEventListeners();
	}

	_setupEventListeners() {
		const events = [
			{ type: CMEventTypes.ON_RAY_STARTED, handler: '_onRayStarted' },
			{ type: CMEventTypes.ON_RAY_UPDATED, handler: '_onRayUpdated' },
			{ type: CMEventTypes.ON_RAY_ENDED, handler: '_onRayEnded' },
		];

		events.forEach((event) => {
			this._controllersManager.addEventListener(
				event.type,
				this[event.handler].bind(this)
				//this._targetObject[event.handler].bind(this._targetObject)
			);
		});
	}

	// Ray event handlers
	_onRayStarted(e) {
		if (!this._targetObject.shouldTestRayEvents()) return true;

		let allowEventPropagation = true;
		let intersection = this._getRayIntersection(e.ray);
		if (intersection && !this._lastRayStartedOnHand) {
			// store the hand that started the ray or the "mouse down"
			this._lastRayStartedOnHand = e.handedness;
			allowEventPropagation = false;
			if (this._targetObject.onRayStarted) this._targetObject.onRayStarted(intersection);
		}
		return allowEventPropagation;
	}

	_onRayUpdated(e) {
		if (!this._targetObject.shouldTestRayEvents()) return true;

		let allowEventPropagation = true;
		let marker = e.handedness == 'left' ? this._leftHitMarker : this._rightHitMarker;
		let intersection = this._getRayIntersection(e.ray);
		if (intersection) {
			// if the ray hand is the same that started the ray or generated
			// the mouse down, update the mouse position
			if (this._lastRayStartedOnHand == e.handedness) {
				allowEventPropagation = false;
				if (this._targetObject.onRayUpdated) this._targetObject.onRayUpdated(intersection);
			}
			// update marker position and visibility, corresponding to the hand
			let d = e.ray.origin.distanceTo(intersection.point);
			let s = 1 + d * 0.5;

			marker.position.copy(intersection.point);
			marker.scale.set(s, s, s);
			marker.visible = true;
		} else {
			marker.visible = false;
		}
		return allowEventPropagation;
	}

	_onRayEnded(e) {
		if (!this._targetObject.shouldTestRayEvents()) return true;
		let allowEventPropagation = true;
		let marker = e.handedness == 'left' ? this._leftHitMarker : this._rightHitMarker;
		let intersection = this._getRayIntersection(e.ray);
		// Only trigger mouse up if the hand that started the ray is the same that ended it
		if (this._lastRayStartedOnHand == e.handedness) {
			// only trigger mouse up if the ray is over the menu

			if (this._targetObject.onRayEnded) this._targetObject.onRayEnded(intersection);

			// clear the last ray started hand
			this._lastRayStartedOnHand = null;
			allowEventPropagation = false;
		}

		marker.visible = false;

		return allowEventPropagation;
	}

	_getRayIntersection(ray) {
		if (this._hitTestMesh && ray) {
			this._raycaster.ray = ray;
			const intersection = this._raycaster.intersectObject(this._hitTestMesh, false)?.[0];
			if (intersection) {
				return intersection;
			}
		}
		return null;
	}
}
