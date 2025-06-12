import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export function CityGenerator(scene, renderer) {
	let esDeDia = false;
	let c1 = 0;
	let SEMILLA1 = 49823.3232;
	let SEMILLA2 = 92733.112;

	let diaNoche = 0;
	let cityContainer;

	let directionalLight;
	let hemiLight;

	const cieloDia = new THREE.Color(0xccccff);
	const cieloNoche = new THREE.Color(0x222299);
	let lights = [];

	let materiales = {
		tronco: new THREE.MeshPhongMaterial({ color: 0x996611, name: 'tronco' }),

		copa1: new THREE.MeshPhongMaterial({ color: 0x009900, name: 'copa1' }),
		copa2: new THREE.MeshPhongMaterial({ color: 0x11aa00, name: 'copa2' }),
		copa3: new THREE.MeshPhongMaterial({ color: 0x008811, name: 'copa3' }),

		casa1: new THREE.MeshPhongMaterial({ color: 0xffcccc, name: 'casa1' }),
		casa2: new THREE.MeshPhongMaterial({ color: 0xffccff, name: 'casa2' }),
		casa3: new THREE.MeshPhongMaterial({ color: 0xccffcc, name: 'casa3' }),

		losa: new THREE.MeshPhongMaterial({ color: 0x444444, name: 'losa' }),

		ventana: new THREE.MeshPhongMaterial({ color: 0x9999ff, emissive: 0xffffff, shininess: 64, name: 'ventana' }),

		techo: new THREE.MeshPhongMaterial({ color: 0x993333, shininess: 2, name: 'techo' }),
		puerta: new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 2, name: 'puerta' }),

		pasto: new THREE.MeshPhongMaterial({ color: 0x33ff633, name: 'pasto' }),

		poste: new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 64, name: 'poste' }),

		luz1: new THREE.MeshPhongMaterial({ emissive: 0xffff00, name: 'luz1' }),
		luz2: new THREE.MeshPhongMaterial({ emissive: 0xff00ff, name: 'luz2' }),
		luz3: new THREE.MeshPhongMaterial({ emissive: 0x77ffff, name: 'luz3' }),
		luz4: new THREE.MeshPhongMaterial({ emissive: 0xff5577, name: 'luz4' }),
		luz5: new THREE.MeshPhongMaterial({ emissive: 0x7777ff, name: 'luz5' }),
	};

	// metodos publicos
	this.generate = function () {
		if (cityContainer) {
			scene.remove(cityContainer);
		}
		cityContainer = new THREE.Group();

		construirEscenario();
		construirBarrio();

		mergeGeometries();
		//scene.add(cityContainer)
	};

	function mergeGeometries() {
		let geoms = {};
		let meshes = [];

		cityContainer.updateMatrixWorld(true, true);

		cityContainer.traverse((obj) => {
			if (obj.isMesh) {
				meshes.push(obj);
				let g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry().clone();

				let matName = obj.material.name;
				if (!geoms.hasOwnProperty(matName)) {
					geoms[matName] = [];
				}

				g.applyMatrix4(obj.matrixWorld);
				geoms[matName].push(g);
			}

			if (obj.isLight) {
				//obj.parent.remove(obj);
				lights.push(obj);
			}
		});
		/*
		geoms.forEach(
			(g,i)=>{
				g.applyMatrix4(meshes[i].matrixWorld)
			}
		)
*/

		for (const [matName, geoList] of Object.entries(geoms)) {
			let gg = BufferGeometryUtils.mergeGeometries(geoList, true);
			gg.applyMatrix4(cityContainer.matrix.clone().invert());
			let mesh = new THREE.Mesh(gg, materiales[matName]);
			scene.add(mesh);
		}

		lights.forEach((l, i) => {
			let m = l.matrixWorld.clone();

			let p = l.getWorldPosition(new THREE.Vector3());
			if (l.parent) l.parent.remove(l);
			l.position.copy(p);
			scene.add(l);
		});
	}

	function enteroAleatorio(desde, hasta) {
		let v = desde + Math.floor((0.5 + 0.5 * Math.sin(c1 * SEMILLA1)) * (hasta - desde));
		c1 += v;
		return v;
	}

	function numeroAleatorio(desde, hasta) {
		let v = desde + (0.5 + 0.5 * Math.sin(c1 * SEMILLA2)) * (hasta - desde);
		c1 += v;
		return v;
	}

	function construirEscenario() {
		// agregamos la grilla y los ejes
		const size = 400;
		const divisions = 40;
		/*
		const gridHelper = new THREE.GridHelper(size, divisions, 0xffffff, 0xaaaaaa);
		gridHelper.position.y = -0.05;

		cityContainer.add(gridHelper);
*/
		const axesHelper = new THREE.AxesHelper(5);
		cityContainer.add(axesHelper);

		// creamos las luces

		// de noche

		directionalLight = new THREE.DirectionalLight(0xeeeeff, 0.2);
		directionalLight.position.set(-1, 2, 3);
		hemiLight = new THREE.HemisphereLight(0x8888dd, 0x080866, 0.2);

		scene.add(directionalLight);
		scene.add(hemiLight);

		// creamos un plano
		/*
		const suelo = new THREE.Mesh(
			new THREE.PlaneGeometry(400, 400),
			new THREE.MeshPhongMaterial({
				color: 0x998877,
				side: THREE.DoubleSide,
				shininess: 1,
			})
		);

		suelo.rotation.x = -Math.PI / 2;
		suelo.position.y = -0.05;
		cityContainer.add(suelo);
		*/
	}

	function crearArbol(altura, diametro) {
		let arbol = new THREE.Group();

		let geoCopa = new THREE.SphereGeometry(diametro / 2, 32, 16);
		let mat = materiales['copa' + enteroAleatorio(1, 3)];
		let copa = new THREE.Mesh(geoCopa, mat);
		copa.position.set(0, altura, 0);

		let diamTronco = Math.max(0.1, diametro * 0.1);

		let geoTronco = new THREE.CylinderGeometry(diamTronco / 2, diamTronco, altura, 32);
		geoTronco.translate(0, altura / 2, 0);
		let tronco = new THREE.Mesh(geoTronco, materiales['tronco']);

		arbol.add(tronco);
		arbol.add(copa);

		return arbol;
	}

	function crearParque(ancho, largo) {
		let geoParque = new THREE.BoxGeometry(ancho, 0.05, largo);

		let parque = new THREE.Mesh(geoParque, materiales['pasto']);
		return parque;
	}

	function crearFarol(altura, intensidad, color) {
		// creo el poste

		if (!intensidad) intensidad = 0.3;

		let farol = new THREE.Group();
		let geoPoste = new THREE.CylinderGeometry(0.1, 0.1, altura, 12);

		geoPoste.translate(0, altura / 2, 0);
		let cyl = new THREE.Mesh(geoPoste, materiales['poste']);

		let geoLampara = new THREE.SphereGeometry(0.3, 32, 16);
		let matLuz = materiales['luz' + enteroAleatorio(1, 5)];
		let lampara = new THREE.Mesh(geoLampara, matLuz);
		lampara.position.set(0, altura, 0);

		farol.add(cyl);
		farol.add(lampara);

		if (!esDeDia) {
			const light = new THREE.PointLight(matLuz.emissive, intensidad, 10, 1);
			light.position.set(0, altura, 0);
			farol.add(light);
		}

		return farol;
	}

	function colorHSL(tono, saturacion, iluminacion) {
		let c = new THREE.Color();
		c.setHSL(tono, saturacion, iluminacion);
		return parseInt('0x' + c.getHexString());
	}

	function crearCasa(pisos, anchoFrente, color) {
		if (!color) color = 0xffffff;
		if (!pisos) pisos = 0;

		// creo el contenedor que representa la casa completa
		let casa = new THREE.Group();
		let alturaPiso = 4;

		// creo el cuerpo principal de la casa
		let geoCasa = new THREE.BoxGeometry(anchoFrente, alturaPiso, 10);
		geoCasa.translate(0, alturaPiso / 2, 0);

		let cube = new THREE.Mesh(geoCasa, materiales['casa' + enteroAleatorio(1, 3)]);

		// creo el techo
		let geoTecho = new THREE.BoxGeometry(anchoFrente + 1, 0.5, 11);

		let panelTecho = new THREE.Mesh(geoTecho, materiales['techo']);
		panelTecho.position.set(0, alturaPiso * pisos, 0);
		casa.add(panelTecho);

		let geoVentana = new THREE.BoxGeometry(3, 1.5, 0.1);
		geoVentana.rotateY(Math.PI / 2);

		let ventana0 = new THREE.Mesh(geoVentana, materiales['ventana']);

		// creo los pisos superiores

		for (let i = 0; i < pisos; i++) {
			let geoLosa = new THREE.BoxGeometry(anchoFrente + 1, 0.1, 11);
			let losa = new THREE.Mesh(geoLosa, materiales['losa']);
			losa.position.set(0, alturaPiso * i, 0);
			casa.add(losa);

			let pisoSuperior = cube.clone();
			pisoSuperior.position.y = i * alturaPiso;
			casa.add(pisoSuperior);

			let ventana = ventana0.clone();
			ventana.position.set(-anchoFrente / 2 - 0.1, i * alturaPiso + 2, 2);
			casa.add(ventana);

			ventana = ventana0.clone();
			ventana.position.set(+anchoFrente / 2 + 0.1, i * alturaPiso + 2, -2);
			casa.add(ventana);
		}

		// creo la puerta
		let geoPuerta = new THREE.BoxGeometry(1, 2.2, 0.2);

		let puerta = new THREE.Mesh(geoPuerta, materiales['puerta']);
		puerta.position.set(0, 1.1, 5);
		casa.add(puerta);

		return casa;
	}

	function crearLote() {
		let lote = new THREE.Group();
		let casa = crearCasa(enteroAleatorio(2, 10), numeroAleatorio(3, 8), 0xffffff);
		lote.add(casa);

		let parque = crearParque(20, 20);
		lote.add(parque);
		let alturaFarol = numeroAleatorio(2, 7);

		let cantidadFaroles = enteroAleatorio(1, 1);
		let anchoLineaFaroles = 16;
		let tonoFarol = numeroAleatorio(0, 1);

		for (let i = 1; i <= cantidadFaroles; i++) {
			let farol = crearFarol(alturaFarol, 0.65, colorHSL(tonoFarol, 1, 0.75));
			let separacionEntreFaroles = anchoLineaFaroles / cantidadFaroles;
			farol.position.set(anchoLineaFaroles / 2 - i * separacionEntreFaroles, 0, 8);
			lote.add(farol);
		}

		for (let j = 0; j < 10; j++) {
			let alturaArbol = numeroAleatorio(3, 7);
			let radio = numeroAleatorio(1, 4);

			let arbol = crearArbol(alturaArbol, radio);

			let offsetX = numeroAleatorio(0, 2);
			arbol.position.set(9 - offsetX, 0, 5 - j * 1);
			lote.add(arbol);
		}

		return lote;
	}

	function construirBarrio() {
		const separacion = 15;
		let lote;
		let TOTAL = 4;
		for (let i = -TOTAL; i < TOTAL; i++) {
			lote = crearLote();
			lote.position.set(i * 22, 0, -separacion);
			cityContainer.add(lote);
		}

		for (let i = -TOTAL; i < TOTAL; i++) {
			lote = crearLote();
			lote.position.set(i * 22, 0, separacion);
			lote.rotation.set(0, 3.1415, 0);
			cityContainer.add(lote);
		}
	}

	function updateDiaNoche() {
		let cielo = cieloDia.clone();
		cielo.lerp(cieloNoche, diaNoche);

		renderer.setClearColor(cielo.getHex());
		materiales['ventana'].emissive = new THREE.Color().setHSL(0.5, 0, diaNoche);

		lights.forEach((l, i) => {
			l.intensity = diaNoche * 0.6;
		});
		directionalLight.intensity = 1 - diaNoche;
		hemiLight.intensity = 0.1 + (1 - diaNoche) * 0.3;
	}

	Object.defineProperty(this, 'factorDiaNoche', {
		get() {
			return diaNoche;
		},
		set(value) {
			diaNoche = value;
			updateDiaNoche();
		},
	});
}
