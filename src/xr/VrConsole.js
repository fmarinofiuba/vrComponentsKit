import { VrInteractivePanel } from './VrInteractivePanel';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { GrabbableVrObject } from './../xr/GrabbableVrObject';

export const defaultOptions = {
	width: 800,
	height: 500,
};

export class VrConsole extends VrInteractivePanel {
	constructor(domElement, worldContainer, controllersManager, options) {
		super(worldContainer, controllersManager, options);
		this.options = { ...defaultOptions, ...options };
		//this._grabbableVrObject = new GrabbableVrObject(this._container, controllersManager);
		this.domElement = domElement;
		this.consoleDiv = null;
		this.originalConsole = {
			log: console.log,
			info: console.info,
			warn: console.warn,
			error: console.error,
			debug: console.debug,
			trace: console.trace,
		};
		this.customConsoleStyles =
			`
            #vrConsole {
			
                
                position: absolute;
				bottom: 0;
				left: 0;
                border: 4px solid red;
                padding: 10px;
                overflow-y: scroll;
                font-family: monospace;
                font-size: 12px;
                background-color: #f4f4f4;
                color: #333;
                box-sizing: border-box;
                visibility: hidden;
                
                height: ` +
			this.options.height +
			`px;
				width: ` +
			this.options.width +
			`px;

            }
            .consoleLine {
                margin-bottom: 5px;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .consola-log { color: #000; }
            .consola-info { color: #0000AA; }
            .consola-warn { color: #AA5500; }
            .consola-error { color: #AA0000; font-weight: bold; }
            .consola-debug { color: #555555; }
            .consola-trace { color: #777777; }
            .consoleLine span { white-space: pre; }
        `;
		this.init();
	}

	init() {
		// Function name translated: inicializarConsola -> initializeConsole
		this.addStyles(); // Function call translated: agregarEstilos -> addStyles
		this.createConsoleContainer(); // Function call translated: crearContenedorConsola -> createConsoleContainer
		this.interceptConsoleMethods(); // Function call translated: interceptarMetodosConsola -> interceptConsoleMethods
	}

	addStyles() {
		// Function name translated: agregarEstilos -> addStyles
		const styleElement = document.createElement('style');
		styleElement.textContent = this.customConsoleStyles; // Property name translated: estilosConsolaPersonalizada -> customConsoleStyles
		document.head.appendChild(styleElement);
	}

	createConsoleContainer() {
		// Function name translated: crearContenedorConsola -> createConsoleContainer
		this.consoleDiv = document.createElement('div'); // Property name translated: consolaDiv -> consoleDiv
		this.consoleDiv.id = 'vrConsole'; // Property name translated: consolaDiv -> consoleDiv

		if (this.domElement) {
			// Variable name translated: contenedor -> container
			this.domElement.appendChild(this.consoleDiv); // Property name translated: consolaDiv -> consoleDiv, Variable name translated: contenedor -> container
		} else {
			document.body.appendChild(this.consoleDiv); // Property name translated: consolaDiv -> consoleDiv
			console.warn(`container is null. Console div added to body.`);
		}
	}

	formatConsoleArgument(arg) {
		// Function name translated: formatearArgumentoConsola -> formatConsoleArgument
		if (typeof arg === 'object' && arg !== null) {
			try {
				return JSON.stringify(arg, null, 2);
			} catch (e) {
				return String(arg);
			}
		}
		return String(arg);
	}

	processStyleDirectives(text) {
		// Function name translated: procesarDirectivasEstilo -> processStyleDirectives
		let fragment = document.createDocumentFragment(); // Variable name translated: fragmento -> fragment
		let styleRegex = /%c([^%]+?)%c(.*)/g; // Variable name translated: estilosRegex -> styleRegex
		let startIndex = 0; // Variable name translated: indiceInicio -> startIndex
		let result; // Variable name translated: resultado -> result

		while ((result = styleRegex.exec(text)) !== null) {
			// Variable name translated: resultado -> result, Variable name translated: estilosRegex -> styleRegex
			let previousText = text.substring(startIndex, result.index); // Variable name translated: textoPrevio -> previousText, Variable name translated: indiceInicio -> startIndex, Variable name translated: resultado -> result
			if (previousText) {
				// Variable name translated: textoPrevio -> previousText
				fragment.appendChild(document.createTextNode(previousText)); // Variable name translated: fragmento -> fragment, Variable name translated: textoPrevio -> previousText
			}

			let styledText = result[1]; // Variable name translated: textoEstilado -> styledText, Variable name translated: resultado -> result
			let cssStyles = result[2]; // Variable name translated: estilosCSS -> cssStyles, Variable name translated: resultado -> result

			let span = document.createElement('span');
			span.textContent = styledText; // Variable name translated: textoEstilado -> styledText
			span.style.cssText = cssStyles; // Variable name translated: estilosCSS -> cssStyles
			fragment.appendChild(span); // Variable name translated: fragmento -> fragment

			startIndex = styleRegex.lastIndex; // Variable name translated: indiceInicio -> startIndex, Variable name translated: estilosRegex -> styleRegex
		}

		let finalText = text.substring(startIndex); // Variable name translated: textoFinal -> finalText, Variable name translated: indiceInicio -> startIndex
		if (finalText) {
			// Variable name translated: textoFinal -> finalText
			fragment.appendChild(document.createTextNode(finalText)); // Variable name translated: fragmento -> fragment, Variable name translated: textoFinal -> finalText
		}
		return fragment; // Variable name translated: fragmento -> fragment
	}

	interceptConsole(type) {
		// Function name translated: interceptarConsola -> interceptConsole
		this.originalConsole[type] = console[type]; // Property name translated: consolaOriginal -> originalConsole
		console[type] = (...args) => {
			// Using rest parameter for arguments
			const lineDiv = document.createElement('div'); // Variable name translated: lineaDiv -> lineDiv
			lineDiv.className = 'consoleLine consola-' + type; // Variable name translated: lineaDiv -> lineDiv

			const formattedArguments = Array.from(args).map(this.formatConsoleArgument); // Variable name translated: argumentosFormateados -> formattedArguments, Function call translated: formatearArgumentoConsola -> formatConsoleArgument
			const message = formattedArguments.join(' '); // Variable name translated: argumentosFormateados -> formattedArguments

			if (message.includes('%c')) {
				lineDiv.appendChild(this.processStyleDirectives(message)); // Function call translated: procesarDirectivasEstilo -> processStyleDirectives, Variable name translated: lineaDiv -> lineDiv
			} else {
				lineDiv.textContent = message; // Variable name translated: lineaDiv -> lineDiv
			}

			this.consoleDiv.appendChild(lineDiv); // Property name translated: consolaDiv -> consoleDiv, Variable name translated: lineaDiv -> lineDiv
			this.consoleDiv.scrollTop = this.consoleDiv.scrollHeight; // Property name translated: consolaDiv -> consoleDiv

			this.originalConsole[type].apply(console, args); // Property name translated: consolaOriginal -> originalConsole, Using 'args' here
		};
	}

	interceptConsoleMethods() {
		// Function name translated: interceptarMetodosConsola -> interceptConsoleMethods
		this.interceptConsole('log'); // Function call translated: interceptarConsola -> interceptConsole
		this.interceptConsole('info'); // Function call translated: interceptarConsola -> interceptConsole
		this.interceptConsole('warn'); // Function call translated: interceptarConsola -> interceptConsole
		this.interceptConsole('error'); // Function call translated: interceptarConsola -> interceptConsole
		this.interceptConsole('debug'); // Function call translated: interceptarConsola -> interceptConsole
		this.interceptConsole('trace'); // Function call translated: interceptarConsola -> interceptConsole
	}

	createMap() {
		//https://github.com/lo-th/uil

		const mesh = new HTMLMesh(this.consoleDiv);
		mesh.material;

		this._map = mesh.material.map;
		let h = this._map.image.height;
		let w = this._map.image.width;

		this._frontMaterial = mesh.material;

		this._mesh.material = [this._backMaterial, this._frontMaterial];

		this._updateAspectRatio(w, h, this.consoleDiv.offsetHeight);
	}

	_onPointerEvent = (e) => {
		// e.type: pointerdown,pointerup,pointermove
		// e.data: x,y in [0,1] range

		switch (e.type) {
			case 'pointerdown':
				// We need to convert the type to mousedown
				e.type = 'mousedown';
				// IMPORTANT: The y axis is inverted in the DOM events
				e.data.y = 1 - e.data.y;
				this._map.dispatchDOMEvent(e);
				break;
			case 'pointermove':
				e.type = 'mousemove';
				// IMPORTANT: The y axis is inverted in the DOM events
				e.data.y = 1 - e.data.y;
				this._map.dispatchDOMEvent(e);
				break;
			case 'pointerup':
				e.type = 'mouseup';
				// IMPORTANT: The y axis is inverted in the DOM events
				e.data.y = 1 - e.data.y;
				this._map.dispatchDOMEvent(e);
				break;
			case 'pointerupoutside':
				break;
		}
	};
}
