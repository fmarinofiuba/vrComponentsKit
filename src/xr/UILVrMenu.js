import * as THREE from 'three';
import { VrMenu } from './VrMenu.js';
import { ControllersManager, EventTypes as CMEventTypes } from './ControllersManager.js';
import * as UIL from '../vendor/uil.custom.module.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export class UILVrMenu extends VrMenu {
	constructor(worldContainer, controllersManager, options) {
		super(worldContainer, controllersManager, options);

		this._vrUI = new UIL.Gui({
			w: 512,
			maxHeight: 512,
			colors: { bg: '#FFF' },
			isCanvas: true,
			parent: null,
		});
	}

	createMap() {
		//https://github.com/lo-th/uil

		const me = this;
		this._vrUI.onDraw = function () {
			// this.canvas es el canvas del objeto ui

			if (!me._map) {
				//let dom = this.ui.zone;
				//console.log(dom);

				//this.canvas.drawRect(0, 0, 10, 10);
				me._map = new THREE.Texture(this.canvas);
				me._map.wrapS = THREE.RepeatWrapping;
				me._map.wrapT = THREE.RepeatWrapping;
				me._map.minFilter = THREE.LinearFilter;
				me._map.needsUpdate = true;

				//if( useEncoding ) screen.encoding = THREE.sRGBEncoding
				me._frontMaterial.map = me._map;
				me._frontMaterial.needsUpdate = true;
			} else {
				me._map.needsUpdate = true;
			}

			const uiHeightPx = me._vrUI.zone.h; // Is the height of the UI in pixels
			const canvasHeightPx = me._vrUI.forceHeight; // Is the height of the canvas in pixels
			const canvasWidthPx = me._vrUI.zone.w; // Is the width of the canvas in pixels

			me._updateAspectRatio(canvasWidthPx, canvasHeightPx, uiHeightPx);

			//console.log('ui.onDraw()');
		};
	}

	_onPointerEvent = (e) => {
		// e.type: pointerdown,pointerup,pointermove
		// e.data: x,y in [0,1] range

		switch (e.type) {
			case 'pointerdown':
				// Important!! After setMouse, we need to triggerMouseMove
				// We need to setMouse and triggerMouseMove before triggerMouseDown
				// to capture the latest pointer position

				this._vrUI.setMouse(e.data);
				this._vrUI.triggerMouseMove();
				this._vrUI.triggerMouseDown();
				break;
			case 'pointermove':
				this._vrUI.setMouse(e.data);
				this._vrUI.triggerMouseMove();
				break;
			case 'pointerup':
				//this._onPointerUp();
				this._vrUI.triggerMouseUp();
				break;
			case 'pointerupoutside':
				this._vrUI.reset(true);
				break;
		}
	};

	get ui() {
		return this._vrUI;
	}
}
