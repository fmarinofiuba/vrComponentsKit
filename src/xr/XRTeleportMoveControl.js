import * as THREE from 'three';
import { ControllersManager, EventTypes as CMEventTypes } from './ControllersManager.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVHHelper } from 'three-mesh-bvh';
import { BoxAxesHelper } from './../utils/BoxAxesHelper';

const STICK_ARROW_THRESHOLD = 0.5; // modulus of stick position has to be larger than this value to show arrow on gizmo

const TORUS_RADIUS = 0.3;
const TORUS_TUBE = 0.02;
const ARROW_UPDATE_THRESHOLD = 1500; // msec
const TELEPORT_ARROW_ANGLE_INCREMENT = Math.PI / 12; //

const ROTATION_INCREMENT = 15; //degrees
const FORWARD_SPEED = 10; // meters/second
const VERTICALITY_THRESHOLD = 0.75;

export const defaultOptions = {
	showHelpers: true,
	enableContinousMotion: true, // enables translation using the stick, in the direction of the ray
	restrictVerticalMovement: false,
	enabledHands: 'right', // which hands are enabled for teleporting, flying or rotating ( can beleft, right or both)
};

const enabledHandsOptions = ['left', 'right', 'both'];

export class XRTeleportMoveControl {
	options;
	controllersManager;
	scene;
	xrManager;

	raycaster;
	testSurface;
	teleportGizmo;
	gizmoArrow;
	vrIsPresenting;

	xrRigidTransform;
	baseReferenceSpace;

	referenceSpaceHelper;
	worldSpaceHelper;

	vrCamera; // is an array camera, its coordinates are in the world space (not in the xrReferenceSpace)

	worldOffset = new THREE.Vector3(0, 0, 0);
	worldYRotation = (0 * Math.PI) / 2; // 0 means looking to the negative z axis

	userHeight = undefined;
	userHeightHasBeenMeasured = false;

	testRay;
	arrowHelper;

	enabledHands = [];

	_teleportGestureIsActive = false;
	/*
  
  Geometry and reference spaces in WebXR
  https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Geometry

  */
	constructor(xrManager, controllersManager, scene, options = {}) {
		this.options = Object.assign(defaultOptions, options);
		this.xrManager = xrManager;
		this.controllersManager = controllersManager;
		this.scene = scene;
		this.raycaster = new THREE.Raycaster();
		this.raycaster.firstHitOnly = true;

		this.testRay = new THREE.Ray(new THREE.Vector3(0, 15, 0), new THREE.Vector3(0, -1, 0));

		if (this.options.showHelpers) {
			this.referenceSpaceHelper = new BoxAxesHelper(1.5, 0.02, 0);
			let sprite = this._createSpriteLabel('Reference Space', 1);
			sprite.position.set(0, 1, 0);
			sprite.frustumCulled = false;
			this.referenceSpaceHelper.add(sprite);
			this.scene.add(this.referenceSpaceHelper);

			this.worldSpaceHelper = new BoxAxesHelper(0.75, 0.04, 1);
			sprite = this._createSpriteLabel('World Space', 1);
			sprite.frustumCulled = false;
			sprite.position.set(0, 0.5, 0);
			this.worldSpaceHelper.add(sprite);
			this.scene.add(this.worldSpaceHelper);
		}

		if (this.options.enabledHands == 'both') {
			this.enabledHands = ['left', 'right'];
		} else {
			this.enabledHands = [this.options.enabledHands]; // ["left", "right"] or ["left"] or ["right"]
		}
		this._setupListeners();
		this._buildGizmo();
	}

	_setupListeners() {
		// When the session starts
		this.xrManager.addEventListener('sessionstart', (e) => {
			this.userHeightHasBeenMeasured = false;
			this.vrIsPresenting = true;

			this.baseReferenceSpace = this.xrManager.getReferenceSpace();
			this.vrCamera = this.xrManager.getCamera();

			this._applyCurrentTransform();
		});

		// When the session ends
		this.xrManager.addEventListener('sessionend', (e) => {
			this.vrIsPresenting = false;
			this.baseReferenceSpace = null;
		});

		// Teleportation events

		this.controllersManager.addEventListener(
			CMEventTypes.ON_RAY_STARTED,
			(e) => {
				if (!this._teleportSurfaces || !this.enabledHands.includes(e.handedness)) return;

				this.raycaster.ray = e.ray;
				let intersection = this.raycaster.intersectObject(this._teleportSurfaces);
				if (intersection && intersection[0]?.point) {
					this._teleportGestureIsActive = true;
					return false;
				}
				return true;
			},
			-999
		);

		this.controllersManager.addEventListener(
			CMEventTypes.ON_RAY_UPDATED,
			(e) => {
				if (
					!this._teleportSurfaces ||
					!this.enabledHands.includes(e.handedness) ||
					!this._teleportGestureIsActive
				)
					return;

				this.raycaster.ray = e.ray;
				let intersection = this.raycaster.intersectObject(this._teleportSurfaces);
				if (
					intersection &&
					intersection[0]?.point &&
					intersection[0]?.face &&
					this._isHorizontalSurface(intersection[0].face.normal)
				) {
					let point = intersection[0].point;
					this._updateTeleportGizmo(new THREE.Vector3(point.x, point.y, point.z), e.stickPosition, e.ray);
					return false; // stop event propagation to other listeners
				}
				return true;
			},
			-999
		);

		this.controllersManager.addEventListener(
			CMEventTypes.ON_RAY_ENDED,
			(e) => {
				if (
					!this._teleportSurfaces ||
					!this._teleportGestureIsActive ||
					!this.enabledHands.includes(e.handedness)
				)
					return;

				this.raycaster.ray = e.ray;
				const intersection = this.raycaster.intersectObject(this._teleportSurfaces);
				//console.log('intersection', intersection, this.testRay);
				let stopEventPropagation;
				if (
					intersection &&
					intersection[0]?.point &&
					intersection[0]?.face &&
					this._isHorizontalSurface(intersection[0].face.normal)
				) {
					let point = intersection[0].point;
					this._teleport(new THREE.Vector3(point.x, point.y, point.z), e.stickPosition, e.ray);
					stopEventPropagation = false;
				}
				stopEventPropagation = true;
				this._teleportGestureIsActive = false;
				this.teleportGizmo.visible = false;
				return stopEventPropagation;
			},
			-999
		);

		this._updateArrow = (ray) => {
			if (this.arrowHelper) {
				this.scene.remove(this.arrowHelper);
			}
			this.arrowHelper = new THREE.ArrowHelper(ray.direction, ray.origin, 20, 0xff9900);
			this.scene.add(this.arrowHelper);
		};

		// Rotation events
		this.controllersManager.addEventListener(
			CMEventTypes.ON_ROTATE_LEFT,
			(e) => {
				if (this._teleportGestureIsActive || !this.enabledHands.includes(e.handedness)) return;
				this._rotate(-ROTATION_INCREMENT);
			},
			-999
		);

		this.controllersManager.addEventListener(
			CMEventTypes.ON_ROTATE_RIGHT,
			(e) => {
				if (this._teleportGestureIsActive || !this.enabledHands.includes(e.handedness)) return;
				this._rotate(ROTATION_INCREMENT);
			},
			-999
		);

		if (this.options.enableContinousMotion) {
			// Listen to stick events, moving in the Y axis
			this.controllersManager.addEventListener(
				CMEventTypes.ON_AXIS_Y_NOT_ZERO,
				(e) => {
					if (this._teleportGestureIsActive || !this.enabledHands.includes(e.handedness)) return;
					this._moveInDirection(e.ray, e.stickPosition.y, e.deltaTime);
				},
				-999
			);
		}
	}

	_isHorizontalSurface(normal) {
		const normalWorld = new THREE.Vector3().copy(normal).transformDirection(this._teleportSurfaces.matrixWorld);

		// Verificar si la normal apunta hacia arriba
		const isVertical = normalWorld.y > VERTICALITY_THRESHOLD; // Puedes ajustar el valor 0.9 según tus necesidades
		return isVertical;
	}

	_getTeleportGizmoAngle(stickPos, ray) {
		let projDir = ray.direction.clone();
		projDir.y = 0;
		projDir.normalize();

		let forwardAngle = Math.atan2(projDir.z, projDir.x);
		let ang = Math.atan2(stickPos.y, -stickPos.x);

		ang = Math.round(ang / TELEPORT_ARROW_ANGLE_INCREMENT) * TELEPORT_ARROW_ANGLE_INCREMENT;

		return Math.PI / 2 + ang - forwardAngle;
	}

	_createSpriteLabel(text = '', size = 1) {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');

		// Set canvas size
		canvas.width = 256;
		canvas.height = 256;

		// Set text style
		context.font = '24px Arial	';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.textBaseline = 'middle';

		// Write text on canvas
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		// Create texture from canvas
		const texture = new THREE.CanvasTexture(canvas);

		// Create sprite using the texture
		const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthWrite: false });
		const sprite = new THREE.Sprite(spriteMaterial);
		// When sizeAttenutation is false, the size of the sprite is indepent of the camera distance,
		// but is affected by the camera FOV

		sprite.scale.set(size, size, size);

		return sprite;
	}

	_rotate(degrees) {
		if (!this.vrIsPresenting || !this.baseReferenceSpace) return;

		let rotationDelta = (degrees * Math.PI) / 180;

		this.worldYRotation += rotationDelta;

		let currentSceneOffset = this.worldOffset.clone();

		let vrCamPosInRefSpace = this.vrCamera.position.clone();
		let m = new THREE.Matrix4().fromArray(this.xrRigidTransform.matrix);

		vrCamPosInRefSpace.applyMatrix4(m);

		// We rotate the scene around the vrCamera position in Reference Space
		let m1 = new THREE.Matrix4().makeTranslation(vrCamPosInRefSpace.x, 0, vrCamPosInRefSpace.z);
		let m2 = new THREE.Matrix4().makeRotationY(rotationDelta);
		let m3 = new THREE.Matrix4().makeTranslation(-vrCamPosInRefSpace.x, 0, -vrCamPosInRefSpace.z);

		let mRot = new THREE.Matrix4();
		mRot.multiply(m1);
		mRot.multiply(m2);
		mRot.multiply(m3);

		currentSceneOffset.applyMatrix4(mRot);
		this.worldOffset.copy(currentSceneOffset);

		this._applyCurrentTransform();

		this.teleportGizmo.visible = false;
	}

	_buildGizmo() {
		const gizmoMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x555555, shininess: 32 });

		const xrayMaterial = new THREE.ShaderMaterial({
			uniforms: {
				cameraPosition: { value: new THREE.Vector3(1, 1, 1) },
			},
			vertexShader: `
					precision mediump float;

	
					
					varying vec3 vNormal;
					varying vec3 vPosition;

					void main() {
						vNormal = normalize(normalMatrix*vec4(normal,1.0).xyz);
						vPosition = (modelViewMatrix*vec4(position,1.0)).xyz;
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
				`,
			fragmentShader: `
					
					varying vec3 vNormal;
					varying vec3 vPosition;

					void main() {
													
						float xrayOpacity = 0.8 - 0.6*abs(dot( vNormal, vec3(0.0,0.0,1.0) ));
						gl_FragColor = vec4(0.0, 0.8, 1.0, xrayOpacity );
						//gl_FragColor = vec4(vNormal, 1.0 );
					}
				`,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
		});

		// this.gizmoArrow
		const arrowGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 3);
		arrowGeo.rotateY(Math.PI / 2);
		arrowGeo.translate(0.65, -0.025, 0);

		this.gizmoArrow = new THREE.Mesh(arrowGeo, xrayMaterial);
		this.gizmoArrow.visible = false;

		// Torus
		const torusGeo = new THREE.TorusGeometry(TORUS_RADIUS, TORUS_TUBE, 16, 100);
		torusGeo.rotateX(Math.PI / 2);

		this.teleportGizmo = new THREE.Mesh(torusGeo, xrayMaterial);
		this.teleportGizmo.add(this.gizmoArrow);

		this.scene.add(this.teleportGizmo);
		this.teleportGizmo.visible = false;
	}

	_updateTeleportGizmo(pos, stickPosition, ray) {
		this.teleportGizmo.visible = true;
		this.teleportGizmo.position.set(pos.x, pos.y + TORUS_TUBE / 2, pos.z);

		if (stickPosition.length() > STICK_ARROW_THRESHOLD) {
			this.gizmoArrow.visible = true;
			this.gizmoArrow.rotation.y = this._getTeleportGizmoAngle(stickPosition, ray);
			this.gizmoArrow.userData.lastUpdate = Date.now();
		} else {
			this.gizmoArrow.visible = false;
		}
	}

	_measureUserHeight() {
		if (this.userHeightHasBeenMeasured || !this.vrIsPresenting) return;

		let pos = this.vrCamera.position.clone();
		// position has not been set yet from XR headser
		if (pos.length() === 0) return;

		let m = new THREE.Matrix4().fromArray(this.xrRigidTransform.matrix);
		pos.applyMatrix4(m);

		this.userHeight = pos.y;
		this.userHeightHasBeenMeasured = true;
	}

	_teleport(destinationPos, stickPosition, ray) {
		/*
		destinationPos: the position where the user wants to teleport in world space origin, not to the xrReferenceSpace
		
		Teleport references:  
		https://threejs.org/examples/webxr_vr_teleport.html
		https://github.com/smarthug/teleport
		https://discourse.threejs.org/t/teleport-functionality-in-webxrmanager-webxrcontroller/18605/2
		https://medium.com/@darktears/adding-support-for-vr-inputs-with-webxr-and-three-js-235b40beb6f0
  

    */
		if (!this.vrIsPresenting || !this.baseReferenceSpace) return;

		const arrowUpdateElpasedTime = this.gizmoArrow.userData.lastUpdate
			? Date.now() - this.gizmoArrow.userData.lastUpdate
			: Infinity;

		if (stickPosition && ray && arrowUpdateElpasedTime < ARROW_UPDATE_THRESHOLD) {
			// get head direction vector in world space
			let headDir = this.vrCamera.getWorldDirection(new THREE.Vector3(0, 0, -1));
			headDir.y = 0;
			headDir.normalize();
			let headAngle = Math.atan2(headDir.z, headDir.x);

			/*
			// get the direction of ray in the XZ plane
			let rayDir = ray.direction.clone();
			rayDir.y = 0;
			rayDir.normalize();
			let rayAngle = Math.atan2(rayDir.z, rayDir.x);
			*/
			// get the angle of the ray in the XZ plane

			// get the angle of the arrow in the XZ plane
			let arrowAngle = this.gizmoArrow.rotation.y;

			// arrowAngle is 0 in +x and 90 in +z
			// rayAngle,headAngle are 0 in +x and 90 in -z
			// that's why they are added instead of subtracted

			let deltaRotation = -(arrowAngle + headAngle);
			this.worldYRotation += deltaRotation;
		}

		this.gizmoArrow.visible = false;

		let targetPos = destinationPos.clone().negate();

		let mRot = new THREE.Matrix4().makeRotationY(this.worldYRotation);
		targetPos.applyMatrix4(mRot);

		//this.vrCamera.position() is the position in xrReferenceSpace
		//apply offset between the vrCamera and the xrReferenceSpace

		let vrCamPosInWorldSpace = this.vrCamera.position.clone();
		let m = new THREE.Matrix4().fromArray(this.xrRigidTransform.matrix);
		vrCamPosInWorldSpace.applyMatrix4(m);

		targetPos.x += vrCamPosInWorldSpace.x;
		targetPos.z += vrCamPosInWorldSpace.z;

		this.worldOffset.set(targetPos.x, targetPos.y, targetPos.z);

		this._applyCurrentTransform();
		this.teleportGizmo.visible = false;
	}

	// this method is called when the user moves the stick in the Y axis
	_moveInDirection(ray, stickPositionY, deltaTime) {
		// deltaTime is in seconds
		let rayDir = ray.direction.clone();
		rayDir.normalize();

		if (this.options.restrictVerticalMovement) {
			rayDir.y = 0;
			rayDir.normalize();
		}

		rayDir.multiplyScalar(stickPositionY * FORWARD_SPEED * deltaTime);

		let mRot = new THREE.Matrix4().makeRotationY(this.worldYRotation);
		rayDir.applyMatrix4(mRot);

		this.worldOffset.add(rayDir);

		//this._applyCurrentTransform();
	}

	_applyCurrentTransform() {
		if (!this.baseReferenceSpace) return;

		let offsetPosition = this.worldOffset.clone();

		// calculation: offsetPosition = [yRotation] * this.worldOffset
		//const mRot = new THREE.Matrix4().makeRotationY(this.worldYRotation);
		//offsetPosition.applyMatrix4(mRot);

		// execute transform
		let offsetRotation = new THREE.Quaternion();
		offsetRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.worldYRotation);

		this.xrRigidTransform = new XRRigidTransform(
			new THREE.Vector3(offsetPosition.x, offsetPosition.y, offsetPosition.z),
			offsetRotation
		);

		const spaceOffset = this.baseReferenceSpace.getOffsetReferenceSpace(this.xrRigidTransform);

		this.xrManager.setReferenceSpace(spaceOffset);

		// xrRigidTransform es la transformacion de WorldSpace(Scene) respecto de ReferenceSpace
		let mat = new THREE.Matrix4().fromArray(this.xrRigidTransform.matrix);
		// la inversa me da la transformacion de ReferenceSpace respecto de WorldSpace (Scene)
		mat.invert();

		let pos = new THREE.Vector3();
		pos.applyMatrix4(mat);

		if (this.options.showHelpers) {
			this.referenceSpaceHelper.position.copy(pos);
			this.referenceSpaceHelper.rotation.setFromRotationMatrix(mat);
		}
	}

	// xrRigidTransform es la transformacion de WorldSpace(Scene) respecto de ReferenceSpace
	getXRRigidTransform() {
		return new THREE.Matrix4().fromArray(this.xrRigidTransform.matrix);
	}

	update(deltaTime) {
		if (this.vrIsPresenting) {
			this._applyCurrentTransform();
			//this._measureUserHeight();
		}
	}

	setTeleportSurfaces(geometry) {
		// BVHMesh  https://github.com/gkjohnson/three-mesh-bvh
		geometry.computeBoundsTree = computeBoundsTree.bind(geometry);
		geometry.disposeBoundsTree = disposeBoundsTree.bind(geometry);
		geometry.computeBoundsTree();

		this._teleportSurfaces = new THREE.Mesh(
			geometry,
			new THREE.MeshBasicMaterial({
				side: THREE.DoubleSide,
			})
		);
		this._teleportSurfaces.raycast = acceleratedRaycast.bind(this._teleportSurfaces);
		this._teleportSurfaces.updateMatrixWorld();

		if (this.options.showHelpers) {
			let bvhHelper = new MeshBVHHelper(this._teleportSurfaces, 0xff0000);
			bvhHelper.displayEdges = true;
			this.scene.add(bvhHelper);
		}
	}

	_testRayCaster() {
		this.testRay.origin.set(0, 20, 0);
		this.testRay.direction.set(0, -1, 0);
		this.raycaster.ray = this.testRay;
		this._updateArrow(this.testRay);
		const intersection = this.raycaster.intersectObject(this._teleportSurfaces);
		console.log('intersection', intersection);
	}
}
