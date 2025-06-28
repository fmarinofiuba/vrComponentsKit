# Diapositiva 1: Título

## Componentes para simplificar el desarrollo de aplicaciones de Realidad Virtual Web
### Solución modular para desarrolladores WebXR

**Autor:** Federico Marino
**Afiliación:** Facultad de Ingeniería, UBA, Argentina

**Imagen Sugerida:** Pequeña imagen de un dispositivo VR (ej. Meta Quest 3).

**Notas del Presentador:**
* Introducción: RV, Web y su relevancia.
* Agradecer al público.

---

# Diapositiva 2: Contexto: La Realidad Virtual Web

## RV Web: Inmersión accesible

* RV: herramienta potente para simulación y visualización de sistemas complejos.
* Web: plataforma para RV distribuida y accesible.
* Dispositivos asequibles (Meta Quest 3) y tecnologías web (WebGL, WebXR) amplían oportunidades.

**Imágenes Sugeridas:**
* Una imagen general que represente la RV.
* Un pequeño logo de WebXR o Three.js.

**Notas del Presentador:**
* La RV se democratiza gracias a la web y dispositivos autónomos.
* Su rol en interacción y visualización.
* Simplifica publicación y reduce costos.

---

# Diapositiva 3: Problema y Motivación

## El desafío: brecha entre bibliotecas y necesidades

* Bibliotecas como Three.js ofrecen APIs de bajo nivel para RV.
* Desarrolladores repiten código para funcionalidades básicas.
* Diversidad de experiencias RV dificulta componentes genéricos.

**Imágenes Sugeridas:**
* Ilustración de complejidad de código o una barrera.
* Diagrama simplificado mostrando la "brecha" API-aplicación.

**Notas del Presentador:**
* Existe una "brecha" entre bibliotecas y necesidades típicas de RV.
* Se "reinventa la rueda" por baja abstracción de APIs.
* Objetivo: proponer componentes de software de alto nivel.

---

# Diapositiva 4: Solución Propuesta: Componentes de Alto Nivel

## Nuestra Propuesta: Componentes reutilizables para RV Web

* Conjunto de componentes de software de alto nivel.
* Abordan desafíos comunes: controladores XR, UI, navegación, manipulación de objetos, depuración.
* Clases y módulos reutilizables, de código abierto, disponibles online.

**Imagen Sugerida:** Figura 2 del paper (Esquema de clases y módulos propuestos).

**Notas del Presentador:**
* Presentar la solución: componentes de software de alto nivel.
* Áreas clave que abordan.
* Resaltar que son de código abierto y disponibles.

---

# Diapadeslizamiento 5: Módulos Clave: Gestión de Controladores y Navegación

## Controladores y Navegación

### **Controladores:**
* Simplifica gestión de controladores XR.
* Encapsula eventos y representación 3D.
* Eventos de alto nivel para Raycasting (activar, sujetar, arrastrar).

### **Navegación:**
* Combina teleportación y modo de vuelo.
* Usa Three-Mesh-Bvh para intersecciones rápidas.

**Imágenes Sugeridas:** Figura 3 del paper (Ejemplo de uso del módulo de navegación, controladores XR y teleportación).

**Videos Sugeridos:**
* **Video 1:** Demostración de gestión de controladores. (30-45 segundos)
* **Video 2:** Demostración de navegación (teleportación y vuelo). (30-45 segundos)

**Notas del Presentador:**
* Describir gestión de controladores.
* Explicar teleportación y vuelo.
* Enfatizar ahorro de código y simplicidad.

---

# Diapositiva 6: Módulos Clave: Interfaz de Usuario (UI)

## Módulo de Interfaz de Usuario (UI)

* Menús bidimensionales, flexibles con HTML/CSS.
* Clase abstracta `VRMenu`: paneles rectangulares con texturas dinámicas.
* Modos: "panel" (delante) y "swatch" (muñeca).
* Subclases `UILVRMenu` y `HtmlVRMenu` para actualización.

**Imágenes Sugeridas:** Figura 4 del paper (Ejemplo de uso de UILVRMenu y HtmlVRMenu).

**Videos Sugeridos:**
* **Video 3:** Demostración de interacción con menús UI. (30-45 segundos)

**Notas del Presentador:**
* Elección de interfaces 2D y su flexibilidad.
* Describir clases `VRMenu`, `UILVRMenu` y `HtmlVRMenu`.
* Mencionar mostrar/ocultar menú.

---

# Diapositiva 7: Módulos Clave: Depuración y Manipulación de Objetos

## Depuración y Manipulación de Objetos

### **Depuración:**
* Supera desafíos de depuración en RV.
* `VRConsole`: proyecta salida de consola en tiempo real.
* `VRVarsWatcher`: monitorea y actualiza variables/objetos dinámicamente.

### **Manipulación de Objetos:**
* Asocia comportamientos (selección, sujeción, arrastre, soltar).
* `SelectableVrObject`: eventos de selección y rayo.
* `GrabbableVrObject`: sujetar objetos (remoto y contacto).

**Imágenes Sugeridas:** Figura 5 del paper (Ejemplos de uso de SelectableVrObject y GrabbableVrObject).

**Videos Sugeridos:**
* **Video 4:** Demostración de depuración (`VRConsole`, `VRVarsWatcher`). (30-45 segundos)
* **Video 5:** Demostración de manipulación de objetos (selección, sujeción, arrastre). (30-45 segundos)

**Notas del Presentador:**
* Herramientas de depuración superan limitaciones de RV.
* Funcionalidad de `VRConsole` y `VRVarsWatcher`.
* Capacidades de selección y manipulación de objetos.

---

# Diapositiva 8: Evaluación Funcional y Ahorro Estimado

## Evaluación y Ahorro en Horas de Programación

* Evaluación funcional con ejemplos didácticos (online).
* Ahorro significativo en tiempo de programación (ver Tabla 1).
* Reducción de errores por modularidad y pruebas aisladas.

**Imagen Sugerida:** Tabla 1 del paper (Estimación del ahorro en horas de programación).

**Notas del Presentador:**
* Evaluación basada en ejemplos prácticos, código fuente disponible.
* Resaltar ahorro de horas de programación.
* Beneficios adicionales de la modularidad.

---

# Diapositiva 9: Conclusiones y Futuras Direcciones

## Conclusiones y Próximos Pasos

### **Conclusiones:**
* Solución flexible para aplicaciones complejas (programadores Three.js).
* Eventos de alto nivel reducen acoplamiento.

### **Futuras Direcciones:**
* Consolidar directrices para UI 3D en RV.
* Mejorar herramientas de depuración (teclados virtuales, controles interactivos).
* Evaluación de compatibilidad con dispositivos alternativos.
* Explorar integración de UI 3D y modos de interacción.

**Imagen Sugerida:** Una imagen inspiradora que represente el futuro de la RV o innovación.

**Notas del Presentador:**
* Recalcar flexibilidad y público objetivo.
* Reafirmar beneficios de modularidad.
* Desafíos futuros y áreas de mejora.
* Contribución al software abierto.

---

# Diapositiva 10: Preguntas y Contacto

## ¡Gracias! Preguntas y Contacto

**Información de contacto:** Federico Marino - fmarino@fi.uba.ar
**Recursos:** Código fuente disponible en: https://fmarinofiuba.github.io/vrComponentsKit/

**Imagen Sugerida:** Pequeña imagen de tus datos de contacto o un código QR al repositorio.

**Notas del Presentador:**
* Agradecer al público.
* Invitar a preguntas.
* Recordar recursos y contacto.