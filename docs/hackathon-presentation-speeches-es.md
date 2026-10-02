# Equipo 7 — Discursos por persona

Borrador para `docs/hackathon-presentation-es.pptx` (10 diapositivas). Todo lo que sigue sale del readout (`hackathon-readout.pdf`) y de los documentos del proyecto. No se agrega nada que los documentos no respalden. Es la versión en español de `hackathon-presentation-speeches.md`, actualizada el 2026-10-02 para el spec v2.5 y la preferencia de contacto ya construida.

## Quién habla dónde

| Diapositiva | Tema | Quién habla |
|---|---|---|
| 1 | Portada | Julio |
| 2 | Nuestro equipo | Todos, una línea cada quien |
| 3 | El problema | Julio (BA) |
| 4 | Nuestro proceso, de punta a punta | Julio (pasos 1–2), Fernanda (paso 3), Juan (paso 4), Uriel (pasos 5–6) |
| 5 | Cómo aplicamos los pilares | Julio (Governance, Living Agility), Fernanda (Alignment, Adaptability), Uriel (Quality) |
| 6 | Qué dicen las revisiones y las pruebas | Uriel (QA) |
| 7 | Demo | Fernanda narra el recorrido, Juan maneja la app |
| 8 | Lo que no salió como esperábamos | Julio (1), Juan (2, 3 y Evidencia de pruebas), Uriel (Estado del spec) |
| 9 | El spec como registro vivo | Julio (BA) |
| 10 | Gracias | Todos |

Los roles salen del readout. El reparto de diapositivas es una propuesta basada en esos roles, así que cambien lo que no coincida con quién hizo realmente el trabajo. Los retos 2 y 3 se le dieron a Juan porque nadie recuerda quién los encontró y el equipo acordó que el desarrollador los toma.

El tiempo se calcula a unas 130 palabras por minuto. El total ronda los 8 minutos.

---

## Julio Flores — BA

*Diapositivas 1, 2, 3, 4 (pasos 1–2), 5 (Governance, Living Agility), 8 (reto 1), 9, 10 · unas 380 palabras, 3 minutos*

**[Diapositiva 1]**
Buenos días. Somos el Equipo 7, y esta es nuestra Lista de espera de Cardiología, construida con spec driven development.

**[Diapositiva 2, tu línea]**
Soy Julio Flores, el analista de negocio. Escribí el Product Spec: las historias de usuario, los criterios de aceptación y las reglas de negocio.

**[Diapositiva 3 — El problema]**
Empiezo con el problema. Un hospital público con ocho especialidades todavía agenda por teléfono. Las listas de espera de cardiología y oncología superan con regularidad las seis semanas, y el hospital quiere reducir el volumen de llamadas en un 40 por ciento.

Nuestra primera interpretación, antes de encontrar el brief completo, era una sola clínica privada con un solo especialista. Estaba mal. El alcance real es una especialidad piloto, cardiología, dentro de un sistema hospitalario mucho más grande. Y una parte importante de sus pacientes no es localizable por medios digitales. Ese último punto cambió todo lo que escribimos después.

**[Diapositiva 4 — Proceso, pasos 1 y 2]**
Nuestro proceso empieza con el problema y el PRD. A partir de ahí, el Product Spec, PS-001, pasó por diez versiones: de la v0.1 a la v0.4, y luego de la v2.0 a la v2.5 después de encontrar el brief real. La más reciente, la v2.5, sigue en Draft.

**[Diapositiva 5 — Pilares]**
Dos pilares me toca mostrar.

Governance. La IA sugirió que los casos urgentes se saltaran la lista. Lo rechazamos. Las clínicas reales absorben las urgencias como retrasos del mismo día, no reordenando la fila, así que fijamos primero en entrar, primero en salir, estricto. Es la regla de negocio BR-006, y está registrada como decisión resuelta en el spec.

Living Agility. Un brief de Confluence que nos habíamos perdido, hallado a mitad del hackathon, replanteó todo nuestro alcance. Reescribimos el spec para que coincidiera con el problema real, no al revés. Ese es el paso de la v0.4 a la v2.0.

**[Diapositiva 8 — Reto 1]**
Nuestro primer reto fue justo ese brief. El día 3 descubrimos el documento con el planteamiento real y completo del problema. Nuestro alcance había sido una suposición, no un hecho, durante dos días. No parchamos el spec anterior. Lo reescribimos.

**[Diapositiva 9 — El spec como registro vivo]**
Para cerrar, esto es cómo cambió el spec entre el día 1 y hoy.

El día 1 asumía una clínica privada, mostraba a los pacientes su posición en vivo, permitía quitarlos de la lista y era solo digital. Hoy es una especialidad piloto en un hospital de ocho especialidades, confirmado. La posición y la remoción están diferidas, fuera de esta iteración. La ruta telefónica es una ruta principal, construida y probada. Y ahora los pacientes eligen y cambian su propia preferencia de contacto, que es el cambio más nuevo y sigue siendo un Draft.

Abajo se ve el recorrido: la v2.0 realineó el spec, la v2.1 corrigió los hallazgos de la revisión, la v2.2 redujo el alcance a registro, liberación de horario y aceptación, la v2.3 y la v2.4 corrigieron la consistencia y aplicaron las decisiones del Product Owner, y la v2.5 hizo que la preferencia de contacto se pueda fijar desde la app. La v2.5 revierte una postura que operaciones del hospital había confirmado, que la app solo lee la preferencia, así que la marcamos como propuesta hasta que ellos la confirmen. Ese recorrido es la evidencia de que el spec se mantuvo vivo.

**[Diapositiva 10]**
Gracias.

---

## Fernanda Hernández — UX

*Diapositivas 2, 4 (paso 3), 5 (Alignment, Adaptability), 7 (Demo), 10 · unas 270 palabras, 2 minutos más el demo*

**[Diapositiva 2, tu línea]**
Soy Fernanda Hernández, UX. Hice los mapas de journey, llevé la bitácora de decisiones y construí el prototipo HTML funcional.

**[Diapositiva 4 — Proceso, paso 3]**
El paso tres son los mapas de journey y el prototipo. Mantuvimos ambos alineados con el spec hasta la versión 3.

**[Diapositiva 5 — Pilares]**
Alignment. Hice los mapas de journey y el prototipo funcional. Julio y Uriel integraron cada decisión abierta al Product Spec. Después de cada ronda de feedback, el prototipo y el spec se actualizaron los dos antes del siguiente build.

Adaptability. Mantuvimos el prototipo como una sola página HTML con pestañas internas, no varias páginas. Lo hicimos a propósito, porque nuestro dev necesitaba construir rápido. Nos calibramos a la restricción real de la semana y no sobrediseñamos.

**[Diapositiva 7 — Demo]**
Ahora el demo. La idea es un solo registro compartido, con dos formas de entrar: la web o una llamada telefónica. Y ahora el paciente elige cuál.

*(Recorrido sugerido, tomado de la app construida y del README. Juan maneja la app después de `npm run seed`. Si falta tiempo, corten cualquier acto.)*

*Acto 0, registro (solo demo).* En la pantalla de inicio de sesión, una persona nueva se registra con un nombre y una elección, en la app o por teléfono, y queda con la sesión iniciada. Un nombre que ya está en uso se rechaza. Este paso existe solo para el demo, porque aquí no hay un sistema de registro del hospital.

*Acto 1, registro en la lista.* Un paciente sin preferencia registrada debe elegir una antes de unirse. Elige en la app o por teléfono, cada opción con una descripción corta, confirma y se une. Del lado del personal, la entrada aparece al instante, sin llamada ni libreta. Maria Gómez, que ya tiene la app, se une directo. El personal también puede agregar a quien llama por teléfono, en su nombre. Cuando esa persona no tiene preferencia, el personal registra la elección que ella declara en el mismo paso. Cuando el personal intenta agregar a Sofía Reyes, se rechaza, porque no está registrada en los expedientes del hospital. El personal no puede crear a un paciente fantasma.

*Acto 2, liberación de horario.* Se abre un horario y el personal lo libera. Va al siguiente paciente en la fila. Carlos Mendoza tiene preferencia por teléfono, así que aparece marcado "requiere llamada". No hay banner, porque no tiene la app. El personal le llama, y cuando rechaza, la oferta se cierra. No salta sola a la siguiente persona. El personal libera otra vez, y Ana Torres, que no tiene preferencia registrada, se trata como teléfono hasta que elija. Cuando el personal no logra contactarla, pasa la oferta con un clic. Un no confirmado y un paciente que no contesta son resultados distintos, así que se comportan distinto.

*Acto 3, aceptación y un cambio de opinión.* Maria ahora tiene la oferta. Ve el banner, toca Aceptar y confirma. Los dos pasos son a propósito, para que nadie reserve por un toque accidental. Del lado del personal aparece como reservada, y los demás avanzan automáticamente. Si un paciente que tiene una oferta cambia su preferencia, la oferta se queda y sigue el nuevo canal: el banner aparece o desaparece, y la marca de llamada del personal lo sigue.

**[Diapositiva 10]**
Gracias.

---

## Juan Carlos Abarca — BE / FE Dev

*Diapositivas 2, 4 (paso 4), 7 (maneja el demo), 8 (retos 2 y 3, y Evidencia de pruebas), 10 · unas 330 palabras, 2.5 minutos más el demo*

**[Diapositiva 2, tu línea]**
Soy Juan Carlos Abarca, desarrollo back-end y front-end. Trabajé en el modelo de datos, en si el spec realmente se podía construir, y en apoyar el build.

**[Diapositiva 4 — Proceso, paso 4]**
El paso cuatro es el spec técnico en OpenSpec. Tenemos tres cambios, y todos están construidos: 32 de 32 tareas, 30 de 30 y 25 de 25, es decir 87 de 87. El último, para el spec v2.5, está construido y probado, pero todavía no está archivado.

**[Diapositiva 7 — Demo]**
*(Manejen la app en local mientras Fernanda narra cada acto. Digan solo lo que se ve en pantalla: la vista del personal, la vista del paciente y los actos del recorrido.)*

**[Diapositiva 8 — Reto 2]**
Nuestro segundo reto fue una regla que construimos mal. Nuestro propio prototipo avanzaba solo la lista ante un rechazo, lo que contradecía directamente una regla de negocio que nosotros mismos escribimos. Lo detectamos al releer el spec contra el build, y lo corregimos antes de que llegara al equipo.

**[Diapositiva 8 — Reto 3]**
Nuestro tercer reto fue un bug que solo el guion encontró. Cuando escribimos el guion literal del demo, no solo hacer clic por ahí, salió un bug en el orden de la fila que nadie había notado en pruebas casuales.

**[Diapositiva 8 — Aún abierto: Evidencia de pruebas]**
La ruta telefónica que estaba abierta en nuestro borrador anterior ya está construida, con la preferencia de contacto, la marca "requiere llamada" y las respuestas registradas por el personal. La suite de Playwright tiene 50 pruebas escritas y ninguna omitida. Quiero ser directo en una cosa: la corrida completa sobre el build final es la última verificación antes de presentar.

*(Antes de decir esto, corran la suite y confirmen cuántas pasan. Digan ese número real.)*

**[Diapositiva 10]**
Gracias.

---

## Uriel Angeles — QA

*Diapositivas 2, 4 (pasos 5–6), 5 (Quality), 6, 8 (Estado del spec), 10 · unas 410 palabras, 3 minutos*

**[Diapositiva 2, tu línea]**
Soy Uriel Angeles, QA. Revisé las reglas de negocio, busqué casos límite y verifiqué que el spec y el build se mantuvieran alineados.

**[Diapositiva 4 — Proceso, pasos 5 y 6]**
El paso cinco son los QA test specs: 46 casos de prueba en dos specs, 20 para la ruta telefónica y 26 para el spec v2.5, cada uno trazado a criterios de aceptación y reglas de negocio, con bitácoras de gaps y matrices de cobertura. El segundo spec es un delta, así que solo cubre lo que cambió la v2.5. El paso seis son las revisiones y la automatización. Corrimos el spec-readiness-review y el spec-critic sobre el spec, y construimos una suite de Playwright de 50 pruebas con un reporte Allure.

**[Diapositiva 5 — Pilares: Quality]**
Quality. Detectamos que nuestro propio prototipo contradecía nuestra propia regla de negocio. Un rechazo pasaba solo al siguiente paciente, cuando el spec exigía una acción aparte del personal. Lo corregimos antes de que llegara al equipo.

También cuestionamos el spec de la propia IA. Las revisiones señalaron que "primero en la fila" contradecía la regla de salto, y lo corregimos en la v2.3. Para la v2.5, la revisión de QA registró 11 gaps nuevos, por ejemplo que operaciones del hospital no ha confirmado el cambio.

**[Diapositiva 6 — Qué dicen las revisiones y las pruebas]**
Estos son los números. Son nuestras propias corridas, no la evaluación oficial.

El spec-readiness-review calificó el spec v2.1 con 46 de 65, y el spec v2.4 con 52 de 65. Ambos están en la banda "Minor Revisions Needed". SDD-Ready empieza en 59, así que todavía no llegamos. No hemos calificado la v2.5. El spec-critic sigue diciendo "Requires Refinement" para la v2.4.

Los dos QA test specs tienen 46 casos, 20 más 26 de la v2.5. Registramos 26 gaps, 15 más 11, y el Product Owner ha resuelto 6. Los 11 nuevos siguen todos abiertos.

La suite de Playwright ahora tiene 50 pruebas, antes 23, y ninguna está omitida, porque la ruta telefónica y la preferencia ya están construidas. *(Corran la suite y digan cuántas pasan realmente. Primero detengan la API del demo en el puerto 3001, o la suite no arranca.)*

**[Diapositiva 8 — Aún abierto: Estado del spec]**
Queda otra cosa abierta. El spec v2.5 es un Draft. Revierte la preferencia de solo lectura que operaciones del hospital confirmó en la v2.0 a la v2.4, y todavía no confirman el cambio. Si lo rechazan, el cambio de OpenSpec se revierte. Antes, la versión 2.0 se llamaba a sí misma "Ready with Minor Refinement" y la revisión decía "Requires Refinement", y lo corregimos. Preferimos mostrarlo que esconderlo.

**[Diapositiva 10]**
Gracias. Con gusto respondemos preguntas.

---

## Datos a la mano

Cada uno sale de los documentos. Si sale un número en las preguntas, usen estos.

| Tema | Dato | Fuente |
|---|---|---|
| Hospital | 8 especialidades; esperas de cardiología y oncología de más de 6 semanas; meta de reducir 40% las llamadas | Readout, PRD |
| Spec | 10 versiones: v0.1 a v0.4 y v2.0 a v2.5; la v2.5 es Draft | Nota de versión del PS-001 v2.5 |
| Spec v2.5 | 13 historias definidas (US-001 a US-013), 10 en alcance, 3 diferidas; 21 reglas de negocio, BR-009 diferida | PS-001 v2.5 |
| Diferido | Posición visible al paciente, que el paciente se salga, remoción por el personal, que el personal corrija una preferencia ya registrada, números de teléfono | PS-001 v2.5, sección 10 |
| Readiness | v2.1: 46/65; v2.4: 52/65; ambos "Minor Revisions Needed"; v2.5 sin calificar | `spec-readiness-review-PS-001-v2.1.md`, `spec-iteration-log-PS-001-v2.0-to-v2.4.md` |
| QA test specs | 20 + 26 = 46 casos; 15 + 11 = 26 gaps; 6 resueltos | `docs/qa/test-spec-waitlist-telephone-path-and-slot-rules.md`, `docs/qa/test-spec-waitlist-contact-preference-in-app.md` |
| Playwright | 50 pruebas escritas, ninguna omitida; falta confirmar cuántas pasan con una corrida completa | `playwright-suite/tests/specs/` |
| OpenSpec | 32 de 32, 30 de 30 y 25 de 25 tareas hechas; el cambio de preferencia de contacto no está archivado | `openspec/changes/` |

## Puntos abiertos antes de presentar

1. **Quién hizo qué más allá del readout.** Los retos 2 y 3 están con Juan porque nadie recuerda quién los encontró. Las líneas "En esta presentación" de la diapositiva 2 nombran solo artefactos que encajan con cada rol.
2. **Qué build usa el demo.** La app construida ya tiene la ruta telefónica y la preferencia de contacto, así que el demo puede correr sobre ella. El prototipo V4 no existe, así que las pantallas son las de la app construida, no las de un prototipo. Corran primero `npm run seed`, para que Carlos y Ana ya estén esperando.
3. **Especialidad piloto.** El readout dice cardiología. El PS todavía lista cardiología u oncología como una decisión abierta. Prepárense para esa pregunta.
4. **Números de Playwright.** Las 50 pruebas y 0 omitidas salen de contar los specs. La corrida completa no pudo arrancar en esta sesión porque la API del demo usaba el puerto 3001, así que no hay un conteo de pruebas aprobadas confirmado. Corran la suite y actualicen la diapositiva 6 antes de presentar.
5. **La v2.5 es un Draft.** Operaciones del hospital no la ha confirmado, y la postura del Product Owner cambió respecto a la v2.4. Digan que es propuesta, no acordada.
