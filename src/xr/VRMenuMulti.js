import * as THREE from 'three';
import { ControllersManager, EventTypes as CMEventTypes } from '../xr/ControllersManager.js';
import * as UIL from '../vendor/uil.custom.module.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const defaultOptions = {
	mode: 'panel', // "swatch", "panel",
	debugLevel: 1,
	panelInclination: 30, // degrees
	panelDistance: 1.25, // meters
	panelVerticallOffset: -0.5, // meters
};

export class VRMenuMulti {
	_menuContainer;
	//_menuMesh;
	_panels = [];
	_UIs = [];
	//_helper;

	_controllersManager;
	_worldContainer;
	//_vrUI;

	_mapYScale = 1;
	_mapYOffset = 0;
	_lastRayStartedHand;

	_leftHitMarker;
	_rightHitMarker;
	_lastRayStartedHand;
	_frontMaterial;
	_backMaterial;

	//_menuMap;

	raycaster;

	constructor(totalPanels, worldContainer, controllersManager, options) {
		this.options = { ...defaultOptions, ...options };

		if (worldContainer === undefined || controllersManager === undefined) {
			console.error('VRMenu: worldContainer, controllersManager and xrTeleportMoveControl must be defined');
		}
		this._controllersManager = controllersManager;
		this._worldContainer = worldContainer;

		this.raycaster = new THREE.Raycaster();

		// create a container for the menu
		this._menuContainer = new THREE.Group();
		this._menuContainer.visible = false;
		const axesHelper = new THREE.AxesHelper(0.5);
		this._menuContainer.add(axesHelper);

		// helper is a cone
		this._helper = new THREE.Mesh(
			new THREE.SphereGeometry(0.2, 32, 32),
			new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide })
		);
		this._helper.position.z = -1;
		//this._menuContainer.add(this._helper);

		if (this.options.mode == 'swatch') {
			//this._menuContainer.position.set(0, 0.1, -0.2);
			/*
				-z goes forward in the controller's hand direction
				+y goes above the controller
			*/

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

		// create geometry for the menu
		const frontface = new THREE.PlaneGeometry(1, 1);
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

		//this._menuMesh.rotation.x = -Math.PI / 4;

		this._menuContainer.add(this._menuMesh);

		// create hit markers
		if (this.options.debugLevel > 0) {
			const markerGeo = new THREE.SphereGeometry(0.005, 16, 8);
			this._leftHitMarker = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
			this._rightHitMarker = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
			this._leftHitMarker.visible = false;
			this._rightHitMarker.visible = false;

			this._worldContainer.add(this._leftHitMarker);
			this._worldContainer.add(this._rightHitMarker);
		}

		this._setupUI();
		// set the mesh to the controllersManager
		//this._controllersManager.vrMenuMesh = this._menuMesh;
		this._setupEventListeners();
	}

	_setupUI() {
		//https://github.com/lo-th/uil

		this._vrUI = new UIL.Gui({
			w: 512,
			maxHeight: 512,
			colors: { bg: '#FFF' },
			isCanvas: true,
			parent: null,
		});

		const self = this;
		this._vrUI.onDraw = function () {
			// this.canvas es el canvas del objeto ui

			if (!self._menuMap) {
				//let dom = this.ui.zone;
				//console.log(dom);

				//this.canvas.drawRect(0, 0, 10, 10);
				self._menuMap = new THREE.Texture(this.canvas);
				self._menuMap.wrapS = THREE.RepeatWrapping;
				self._menuMap.wrapT = THREE.RepeatWrapping;
				self._menuMap.minFilter = THREE.LinearFilter;
				self._menuMap.needsUpdate = true;

				//if( useEncoding ) screen.encoding = THREE.sRGBEncoding
				self._frontMaterial.map = self._menuMap;
				self._frontMaterial.needsUpdate = true;
			} else {
				self._menuMap.needsUpdate = true;
			}

			// ui.zone.h es la altura en pixeles que ocupa el menu en el canvas, en el estado actual
			// ui.forceHeight es la altura del canvas en pixeles;
			// h es la proporcion de la altura del menu en relacion a la altura del canvas
			self._mapYScale = self._vrUI.zone.h / self._vrUI.forceHeight;
			self._mapYOffset = 1 - self._mapYScale;

			//console.log(ui.zone.h, ui.maxHeight, h, ui.zone.y, ui.forceHeight);

			self._menuMap.offset.set(0, self._mapYOffset);
			self._menuMap.repeat.set(1, self._mapYScale);
			self._menuMesh.scale.y = self._mapYScale;
			self._menuMesh.position.y = self._mapYScale / 2;

			//console.log('ui.onDraw()');
		};
	}

	setVisible(visible) {
		this._menuContainer.visible = visible;
		if (visible && this.options.mode == 'panel') this._repositionPanel();
	}

	toggleVisibility() {
		this._menuContainer.visible = !this._menuContainer.visible;
		this.setVisible(this._menuContainer.visible);
	}

	_repositionPanel() {
		// position and viewDirection are defined in world coordinates
		const { position, viewDirection } = this._controllersManager.getHeadsetTransform();

		viewDirection.y = 0; // we want to project direction on XZ plane
		viewDirection.normalize();
		viewDirection.multiplyScalar(this.options.panelDistance);

		position.y += this.options.panelVerticallOffset;
		position.add(viewDirection);

		this._menuContainer.position.copy(position);

		this._menuContainer.rotation.order = 'ZYX';
		this._menuContainer.rotation.y = -Math.atan2(viewDirection.z, viewDirection.x) - Math.PI / 2;
		this._menuContainer.rotation.x = -THREE.MathUtils.degToRad(this.options.panelInclination);
	}
	// Ray event handlers
	_onRayStarted(e) {
		if (!this._menuContainer.visible) return true;

		let allowEventPropagation = true;
		let intersection = this._getVRMenuRayIntersection(e.ray);
		if (intersection && !this._lastRayStartedHand) {
			// store the hand that started the ray or the "mouse down"
			this._lastRayStartedHand = e.handedness;

			// Important!! After setMouse, we need to triggerMouseMove
			// We need to setMouse and triggerMouseMove before triggerMouseDown
			// to capture the latest pointer position

			this._vrUI.setMouse(this._mapUVToMouseCoords(intersection.uv));
			this._vrUI.triggerMouseMove();
			this._vrUI.triggerMouseDown();
			allowEventPropagation = false;
		}
		return allowEventPropagation;
	}

	_onRayUpdated(e) {
		if (!this._menuContainer.visible) return true;

		let allowEventPropagation = true;
		let marker = e.handedness == 'left' ? this._leftHitMarker : this._rightHitMarker;
		let intersection = this._getVRMenuRayIntersection(e.ray);
		if (intersection) {
			// if the ray hand is the same that started the ray or generated
			// the mouse down, update the mouse position
			if (this._lastRayStartedHand == e.handedness) {
				this._vrUI.setMouse(this._mapUVToMouseCoords(intersection.uv));
				this._vrUI.triggerMouseMove();
				allowEventPropagation = false;
			}
			// update marker position and visibility, corresponding to the hand
			marker.position.copy(intersection.point);
			marker.visible = true;
		} else {
			marker.visible = false;
		}
		return allowEventPropagation;
	}

	_onRayEnded(e) {
		if (!this._menuContainer.visible) return true;
		let allowEventPropagation = true;
		let marker = e.handedness == 'left' ? this._leftHitMarker : this._rightHitMarker;
		let intersection = this._getVRMenuRayIntersection(e.ray);
		// Only trigger mouse up if the hand that started the ray is the same that ended it
		if (this._lastRayStartedHand == e.handedness) {
			// only trigger mouse up if the ray is over the menu
			if (intersection) {
				this._vrUI.triggerMouseUp();
			} else {
				this._vrUI.reset(true);
			}
			// clear the last ray started hand
			this._lastRayStartedHand = null;
			allowEventPropagation = false;
		}

		marker.visible = false;
		return allowEventPropagation;
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
			this._vrUI.reset(true);
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

	_setupEventListeners() {
		// When user presses the trigger down while pointing at the VRMenu mesh

		this._controllersManager.addEventListener(CMEventTypes.ON_RAY_STARTED, this._onRayStarted.bind(this));

		this._controllersManager.addEventListener(CMEventTypes.ON_RAY_UPDATED, this._onRayUpdated.bind(this));

		this._controllersManager.addEventListener(CMEventTypes.ON_RAY_ENDED, this._onRayEnded.bind(this));

		this._controllersManager.addEventListener(
			CMEventTypes.ON_LEFT_CONTROLLER_CONNECTED,
			this._onLeftControllerConnected.bind(this)
		);

		this._controllersManager.addEventListener(
			CMEventTypes.ON_LEFT_CONTROLLER_DISCONNECTED,
			this._onLeftControllerDisconnected.bind(this)
		);
	}

	_getVRMenuRayIntersection(ray) {
		if (this._menuMesh && ray) {
			this.raycaster.ray = ray;
			const intersection = this.raycaster.intersectObject(this._menuMesh, false)?.[0];
			if (intersection) {
				return intersection;
			}
		}
		return null;
	}

	_mapUVToMouseCoords(uv) {
		let c = uv.clone();
		c.y = c.y * this._mapYScale + this._mapYOffset;
		return c;
	}

	get mesh() {
		return this._menuMesh;
	}

	getPanel(number) {
		return this._UIs[number];
	}
}
