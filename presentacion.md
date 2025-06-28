# Diapositiva 1: Título

## Componentes para simplificar el desarrollo de aplicaciones de Realidad Virtual Web
### Una solución modular para desarrolladores WebXR

**Autor:** Federico Marino
**Afiliación:** Facultad de Ingeniería, UBA, Argentina

**Imagen Sugerida:** Pequeña imagen de un dispositivo VR (ej. Meta Quest 3).

**Notas del Presentador:**
* Iniciar la presentación, agradeciendo al público.
* Mencionar brevemente la relevancia de la Realidad Virtual (RV) en la actualidad y cómo la web la ha democratizado.

---

# Diapositiva 2: Contexto: La Realidad Virtual Web

## La RV Web: democratizando la inmersión

* La RV, más que visualización avanzada, es una poderosa herramienta ligada al modelado y simulación computacional, intuitiva y atractiva para interactuar y visualizar sistemas complejos en diversas industrias y ciencias.
* La plataforma web permite incluso, simulación distribuida con visualización y simulación separadas, sincronizadas en red.
* La reciente proliferación de dispositivos RV autónomos y asequibles, como Meta Quest 3, combinada con la madurez de tecnologías web estandarizadas como WebGL, WebXR y JavaScript, ha abierto un abanico de oportunidades sin precedentes para crear y distribuir aplicaciones RV directamente a través de la web.

**Imágenes Sugeridas:**
* Una imagen general que represente la RV (ej. persona con casco VR).
* Un pequeño logo de WebXR o Three.js.

**Notas del Presentador:**
* Explicar cómo la RV se ha vuelto más accesible gracias a la web y dispositivos autónomos.
* Destacar su rol en la interacción y visualización de sistemas complejos.
* Mencionar que este nuevo paradigma simplifica la publicación y reduce los costos de entrada.

---

# Diapositiva 3: Problema y Motivación

## El desafío: una brecha entre bibliotecas y necesidades comunes

* Durante el desarrollo de múltiples aplicaciones de RV web, se suele observar una brecha entre las capacidades provistas por las bibliotecas y los mecanismos básicos necesarios en una aplicación típica.
* Bibliotecas gráficas como Three.js, aunque potentes, ofrecen una interfaz de programación para la interacción con dispositivos RV que se sitúa en un nivel relativamente bajo.
* Esto implica que, incluso para implementar funcionalidades básicas, los desarrolladores deben escribir código extenso y repetitivo en cada nuevo proyecto.
* La vastedad de casos de uso, estilos de interacción y objetivos de diseño dificulta la creación de componentes genéricos y universales.

**Imágenes Sugeridas:**
* Una ilustración que represente la complejidad del código o una barrera.
* Un diagrama simplificado mostrando la "brecha" entre la API y la aplicación final.

**Notas del Presentador:**
* Explicar la "brecha" existente entre las capacidades de las bibliotecas y las necesidades típicas de una aplicación VR.
* Enfatizar la necesidad de reinventar la rueda en cada proyecto debido a la baja abstracción de las APIs.
* Introducir el objetivo del trabajo: proponer componentes de software de alto nivel.

---

# Diapositiva 4: Solución Propuesta: Componentes de Alto Nivel

## Nuestra Propuesta: Componentes reutilizables para RV Web

* En este trabajo se proponen un conjunto de componentes de software de alto nivel para facilitar la creación de aplicaciones de RV web.
* La solución propuesta se enfoca en resolver los desafíos comunes que enfrentan los desarrolladores, como la gestión de los controladores XR, la creación de interfaces de usuario dinámicas (menús), la navegación de la escena, la selección y manipulación de objetos virtuales y la provisión de herramientas para depuración.
* Se proponen clases y módulos reutilizables, de código abierto, que se encuentran disponibles en línea.

**Imagen Sugerida:** Figura 2 del paper (Esquema de clases y módulos propuestos).

**Notas del Presentador:**
* Presentar la solución propuesta: un conjunto de componentes de software de alto nivel.
* Mencionar las áreas clave que abordan estos componentes (controladores, UI, navegación, manipulación, depuración).
* Resaltar que son de código abierto y están disponibles online.

---

# Diapositiva 5: Módulos Clave: Gestión de Controladores y Navegación

## Módulo de Controladores y Navegación

### **Módulo de Controladores:**
* Encapsula la complejidad de gestión de controladores, permitiendo acceder directamente al control derecho o izquierdo.
* La clase `XRGamepadMonitor` monitorea el estado de botones y palancas, emitiendo eventos.
* La clase `HandController` gestiona la representación 3D del controlador y la emisión de eventos de alto nivel para detección de intersecciones (Raycasting).

### **Módulo de Navegación:**
* La clase `XRTeleportMoveControl` combina dos mecanismos de navegación: teleportación para desplazamientos rápidos y modo de vuelo para ajuste fino de la ubicación.
* Utiliza la biblioteca Three-Mesh-Bvh para acelerar la detección de intersecciones de superficie.

**Imágenes Sugeridas:** Figura 3 del paper (Ejemplo de uso del módulo de navegación, representación de los controladores XR (izquierda) y uso del mecanismo de teleportación (derecha)).

**Videos Sugeridos:**
* **Video 1:** Demostración del funcionamiento del módulo de gestión de controladores (mostrando la representación 3D y quizás algún evento en consola si es visible). (30-45 segundos)
* **Video 2:** Demostración de la navegación (teleportación y modo de vuelo). (30-45 segundos)

**Notas del Presentador:**
* Describir el módulo de gestión de controladores y cómo facilita el acceso y manejo de los mismos.
* Explicar los mecanismos de teleportación y vuelo del módulo de navegación.
* Enfatizar el ahorro de código y la simplicidad para el desarrollador.

---

# Diapositiva 6: Módulos Clave: Interfaz de Usuario (UI)

## Módulo de Interfaz de Usuario (UI)

* Se decidió implementar una solución basada en menús bidimensionales, dada la flexibilidad que brindan las bibliotecas JavaScript basadas en HTML/CSS para crear menús dinámicamente.
* Se diseñó la clase abstracta `VRMenu` que representa un panel rectangular que utiliza un mapa de texturas actualizado dinámicamente.
* Ofrece dos modos de visualización: "panel" (delante del usuario) y "swatch" (acoplado al controlador como un reloj de muñeca).
* Se definieron las subclases `UILVRMenu` y `HtmlVRMenu` que implementan diferentes mecanismos para actualizar el mapa de texturas.

**Imágenes Sugeridas:** Figura 4 del paper (Ejemplo de uso de clase UILVRMenu (izquierda) y de HtmlVRMenu (derecha)).

**Videos Sugeridos:**
* **Video 3:** Demostración de la interacción con los menús UI, mostrando ambos modos (panel y swatch) y la funcionalidad de los controles. (30-45 segundos)

**Notas del Presentador:**
* Explicar la elección de interfaces 2D para la UI, destacando su flexibilidad con HTML/CSS.
* Describir las clases `VRMenu`, `UILVRMenu` y `HtmlVRMenu`.
* Mencionar la capacidad de mostrar/ocultar el menú.

---

# Diapositiva 7: Módulos Clave: Depuración y Manipulación de Objetos

## Módulos de Depuración y Manipulación de Objetos

### **Módulo de Depuración:**
* Aborda desafíos de depuración inherentes a la naturaleza inmersiva y al hardware específico.
* La clase `VRConsole` permite crear un plano donde se proyecta la salida de la consola de depuración del navegador en tiempo real.
* La clase `VRVarsWatcher` permite asociar y monitorear un conjunto de variables u objetos, que se despliegan y actualizan dinámicamente.

### **Módulo de Manipulación de Objetos:**
* Se diseñó un subsistema que permite asociar comportamientos a objetos 3D para seleccionarlos, sujetarlos, arrastrarlos o soltarlos.
* La clase `SelectableVrObject` escucha eventos para emitir nuevos cuando se concreta la selección o cuando el rayo pasa por encima del objeto.
* La clase `GrabbableVrObject` dota a los objetos de la capacidad de ser sujetados, con modos como "remoteGrabbing" (tomar objetos fuera de alcance) y "contactGrabbing" (tomar objetos en contacto directo).

**Imágenes Sugeridas:** Figura 5 del paper (Ejemplos de uso de SelectableVrObject (izquierda) GrabbableVrObject (derecha)).

**Videos Sugeridos:**
* **Video 4:** Demostración del módulo de depuración (`VRConsole` mostrando mensajes y `VRVarsWatcher` con variables actualizándose). (30-45 segundos)
* **Video 5:** Demostración de la manipulación de objetos (selección, sujeción, arrastre con ambos modos). (30-45 segundos)

**Notas del Presentador:**
* Explicar cómo las herramientas de depuración superan las limitaciones de la depuración tradicional en VR.
* Describir la funcionalidad de `VRConsole` y `VRVarsWatcher`.
* Presentar las capacidades de selección y manipulación de objetos, destacando los modos de `GrabbableVrObject`.

---

# Diapositiva 8: Evaluación Funcional y Ahorro Estimado

## Evaluación y Ahorro en Horas de Programación

* La evaluación de los resultados se centra en la demostración práctica en RV de la funcionalidad de estos componentes a través de ejemplos de uso concretos.
* El código fuente se encuentra disponible al público en un repositorio online.
* Los resultados de la tabla evidencian un ahorro significativo en tiempo de programación y potencialmente en la reducción en las tasas de errores.
* La organización en módulos permite probar los mecanismos en forma aislada del resto de la aplicación.

**Imagen Sugerida:** Tabla 1 del paper (Estimación del ahorro en horas de programación).

**Notas del Presentador:**
* Explicar que la evaluación se basó en ejemplos prácticos y la métrica de éxito fue el cumplimiento de objetivos.
* Mencionar que el código fuente de los ejemplos está disponible.
* Resaltar los resultados de la tabla, evidenciando el ahorro de horas de programación.
* Destacar los beneficios adicionales de la modularidad.

---

# Diapositiva 9: Conclusiones y Futuras Direcciones

## Conclusiones y Próximos Pasos

### **Conclusiones:**
* La solución propuesta da una mayor flexibilidad para diseñar aplicaciones complejas, orientada a programadores con cierta experiencia en Three.js.
* El uso de nuevos tipos de eventos de alto nivel reduce el nivel de acoplamiento de la aplicación.

### **Futuras Direcciones:**
* Uno de los desafíos futuros es consolidar las directrices para el diseño de