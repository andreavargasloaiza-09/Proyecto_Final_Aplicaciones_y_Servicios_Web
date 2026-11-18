# Mesa de servicios de soporte tecnológico

> Proyecto Final PF-02 — Aplicaciones y Servicios Web — Tecnología en Desarrollo de Software

## 1. Información general

| Elemento | Detalle |
|---|---|
| **Nombre del proyecto** | Mesa de Servicios de Soporte Tecnológico (API REST + Interfaz Web) |
| **Problema seleccionado** | Gestión integral del ciclo de vida de reportes e incidentes de soporte técnico (registro, asignación, atención, historial de intervenciones, cierre y calificación del servicio) con control de acceso basado en roles (*Solicitante*, *Técnico* y *Coordinador*) y persistencia relacional. |
| **Integrantes y contribución** | **Trabajo en conjunto:** Levantamiento de requerimientos y entrevista con el docente, análisis y redacción de docs/requisitos.md, docs/diseno.md, matriz de trazabilidad (trazabilidad.md) y consolidación final del README.md (**PR #5**).<br>**Andrea Vargas Loaiza:** Arquitectura del backend en FastAPI, modelado relacional y persistencia en SQLite (mesa_soporte.db), autenticación JWT con *scopes* por rol, datos iniciales (seed.py) y desarrollo de endpoints REST (**PR #1** y **PR #2**).<br>**Samuel Montoya Galeano:** Desarrollo completo de la interfaz web del lado del cliente (login, vistas de *Solicitante*, *Técnico* y *Coordinador*), integración con la API REST mediante tokens JWT (**PR #3** y **PR #4**), ejecución y documentación de pruebas funcionales (CP-01 a CP-12). |
| **Asignatura** | Aplicaciones y Servicios Web |
| **Fecha** | 17 de noviembre de 2026 |
| **Enlace al repositorio** | [https://github.com/andreavargasloaiza-09/Proyecto_Final_Aplicaciones_y_Servicios_Web](https://github.com/andreavargasloaiza-09/Proyecto_Final_Aplicaciones_y_Servicios_Web) |

## 2. Descripción del sistema

### Contexto y problema abordado
Una **institución educativa** cuenta con un equipo de soporte tecnológico que atiende necesidades de docentes y personal administrativo relacionadas con computadores, conectividad, software y acceso a plataformas institucionales (incidentes y solicitudes de soporte).

Actualmente, los reportes llegan por correo electrónico, llamadas y comunicaciones directas con el personal técnico, lo que genera las siguientes dificultades:
* Ausencia de un registro unificado de los casos y falta de claridad sobre quién está a cargo de cada atención.
* Desconocimiento por parte de los usuarios sobre el avance de sus reportes.
* Dificultad del personal técnico para recuperar el historial de intervenciones anteriores.
* Falta de una visión consolidada en la coordinación sobre el trabajo pendiente y atendido.

**Problema a resolver:** La institución requiere una solución web que permita registrar y dar seguimiento a los casos de soporte tecnológico desde su reporte hasta su resolución o cierre, manteniendo información verificable sobre las intervenciones realizadas y el resultado de la atención.

### Actores del sistema
* **Usuario solicitante:** Docente o funcionario administrativo que reporta una dificultad o solicitud de soporte, consulta el avance y resultado de sus propios casos, y califica la atención recibida una vez cerrado el reporte.
* **Personal técnico:** Responsable de analizar y atender los casos de soporte que le son asignados, iniciar la reparación, registrar intervenciones técnicas en el historial y finalizar la atención con su respuesta técnica.
* **Coordinación de soporte:** Responsable de organizar la atención asignando técnicos a los casos reportados, ejecutar el cierre definitivo de los reportes terminados y consultar el estado consolidado general de la operación.

### Alcance aprobado, solución y restricciones
* **Alcance funcional (RF-01 a RF-11 y CA-01 a CA-06):** Registro validado de reportes por categoría, flujo de estados controlado (reportado → asignado → en_reparacion → terminado → cerrado), bitácora cronológica de intervenciones, cierre definitivo sin reapertura, calificación del servicio (1 a 5) y consulta consolidada para coordinación.
* **Resumen de la solución:** Aplicación web cliente-servidor con una **API REST** desarrollada en **Python (FastAPI)** y base de datos relacional **SQLite** (mesa_soporte.db), integrada mediante tokens **JWT** con control de permisos por rol y propiedad del caso a una **interfaz web** con vistas diferenciadas para *Solicitante*, *Técnico* y *Coordinador*.

* **Restricciones del sistema:**
  * Arquitectura obligatoria dividida en interfaz web (frontend), API REST (backend) y base de datos relacional (SQLite) sobre servidor local Uvicorn.
  * Prohibición de subir credenciales reales o archivos .env al repositorio; las llaves secretas de JWT (SECRET_KEY) deben gestionarse mediante variables de entorno (.env.example).
  * Uso exclusivo de datos ficticios de prueba para proteger la privacidad institucional.

**Especificación detallada:** [Consultar documento de requisitos (docs/requisitos.md)](docs/requisitos.md)

## 3. Requisitos y alcance

### Método utilizado para obtener la información
Para el levantamiento y validación de requisitos se aplicó una **entrevista semiestructurada en dos fases** (preguntas iniciales y refinamiento de ambigüedades) con el docente **Juan Carlos Morales Guerra**, complementada con el análisis del contexto operativo y la definición de reglas de negocio (RN-01 a RN-06).

---

### Evidencia de entrevista y decisiones confirmadas por el docente

**Capturas de la entrevista con el docente:**

![Evidencia entrevista docente 1](evidencias/entrevista_1.png)

![Evidencia entrevista docente 2](evidencias/entrevista_2.png)

![Evidencia entrevista docente 2](evidencias/entrevista_3.png)

**Decisiones clave confirmadas durante la validación:**
* **Datos obligatorios y categorización:** Todo reporte debe capturar descripción del fallo, placa del equipo o recurso, teléfono, nombre del solicitante, área y una categoría que distinga el tipo de caso (RN-01, RN-02).
* **Flujo lineal y cierre definitivo:** El ciclo de vida es estrictamente secuencial: `Reportado` → `Asignado` (por coordinación) → `En reparación` (por el técnico) → `Terminado` (por el técnico con respuesta) → `Cerrado` (por coordinación). Un caso cerrado no puede reabrirse bajo ninguna circunstancia (RN-03, RN-05).
* **Gestión de casos erróneos o duplicados:** No se eliminan físicamente de la base de datos; el coordinador los cierra dejando una observación explicativa (RN-05).
* **Asignación y trazabilidad técnica:** Únicamente el coordinador asigna un técnico responsable (RN-04), y solo el técnico asignado registra notas de intervención con fecha/hora y descripción sin sobrescribir el historial previo (RF-05).
* **Satisfacción y vista consolidada:** Una vez cerrado el caso, se habilita la calificación del servicio (1 a 5) para el solicitante (RF-11), y coordinación dispone de un reporte consolidado de casos abiertos y cerrados (RF-09).

---

### Requisitos priorizados, historias de usuario y criterios de aceptación

El desarrollo se priorizó en tres fases secuenciales para garantizar el cumplimiento de las **Condiciones de Aceptación Obligatorias (CA-01 a CA-06)**:

| Fase / Prioridad | Historias de Usuario | Requisitos Asociados | Criterios de Aceptación y Condición Obligatoria |
|---|---|---|---|
| **Fase 1:** Cimientos y Seguridad *(Prioridad Crítica)* | **HU-01:** Autenticación y Autorización | RF-10, RNF-01, RNF-02, RNF-04, RNF-05, RNF-06 | **Base de Seguridad:** Valida correo y contraseña, emite token JWT con id y scopes por rol, y rechaza accesos sin token o sin permisos (401/403). |
| **Fase 2:** Núcleo del Negocio *(Prioridad Alta)* | **HU-02:** Registro de un caso | RF-01, RF-02, RNF-03 | **Cubre CA-01:** Exige los 5 datos obligatorios + categoría, asigna estado inicial "reportado", rechaza datos incompletos (422) y persiste el caso (201). |
| **Fase 2:** Núcleo del Negocio *(Prioridad Alta)* | **HU-03:** Asignación de casos | RF-03, RF-04 | **Cubre CA-02 y CA-03:** Solo el coordinador asigna un técnico válido, vincula tecnico_id y pasa el estado de "reportado" a "asignado". |
| **Fase 2:** Núcleo del Negocio *(Prioridad Alta)* | **HU-04:** Seguimiento e intervenciones | RF-05 | **Cubre CA-04:** Solo el técnico asignado registra notas de intervención con fecha/hora sin borrar ni sobrescribir registros anteriores. |
| **Fase 2:** Núcleo del Negocio *(Prioridad Alta)* | **HU-05:** Gestión y finalización técnica | RF-06 | **Cubre CA-02 y CA-05 (parcial):** El técnico asignado transita el caso a "en_reparacion" y luego a "terminado" con su respuesta; no puede cerrarlo. |
| **Fase 2:** Núcleo del Negocio *(Prioridad Alta)* | **HU-07:** Cierre definitivo y satisfacción | RF-07, RF-08, RF-11 | **Cubre CA-05:** Solo coordinación pasa el caso a "cerrado" con observación; se bloquean cambios futuros y se habilita la calificación (1–5) al solicitante. |
| **Fase 3:** Integración y Cierre *(Prioridad Media)* | **HU-06:** Visión consolidada | RF-08, RF-09 | **Cubre CA-03 y CA-06:** Coordinación visualiza el resumen global de casos abiertos y cerrados con ID, estado, solicitante y técnico responsable. |

### Exclusiones explícitas del alcance
* Envío de notificaciones por correo electrónico corporativo o mensajería (WhatsApp/SMS).
* Integración con directorios activos institucionales (Active Directory / LDAP).
* Sistemas de chat en tiempo real o webhooks.
* Herramientas de conexión remota a los equipos reportados.
* Módulos de reportes estadísticos complejos o exportaciones a PDF/Excel.

## 4. Arquitectura, diseño de API y modelo de datos

**Documento detallado de arquitectura y especificación:** [Consultar `docs/diseno.md`](docs/diseno.md)

### Diagrama de componentes y responsabilidades

La aplicación utiliza una arquitectura en capas con separación cliente-servidor: FastAPI entrega las pantallas HTML mediante Jinja2 y expone la API REST bajo /api, mientras que el frontend en JavaScript consume los endpoints intercambiando JSON autenticado con tokens JWT.

```mermaid
flowchart LR
    subgraph NAV["Navegador (frontend)"]
        PANT["Pantallas HTML"]
        JS["JavaScript: api.js, ui.js y un script por pantalla"]
    end
    subgraph SRV["Aplicación FastAPI (backend)"]
        PAG["endpoints/paginas.py con Jinja2"]
        API["endpoints: API REST y permisos"]
        SRVC["services: lógica de los casos"]
        REG["utils/reglas.py: estados y permisos"]
        ENT["entities: tablas"]
    end
    BD[("SQLite: mesa_soporte.db")]
    PAG -->|"HTML y archivos estáticos"| PANT
    PANT --> JS
    JS -->|"JSON por HTTP con token JWT"| API
    API --> SRVC
    SRVC --> REG
    SRVC --> ENT
    ENT --> BD
```

### Tecnologías y justificación
- **Backend:** Python + FastAPI. Valida esquemas de entrada/salida con Pydantic, resuelve la seguridad con JWT y permisos por *scopes*, y genera la documentación interactiva en /docs.
- **Frontend:** FastAPI con plantillas **Jinja2** (estructura HTML) y **JavaScript** modular sin dependencias externas que consume la API REST. Permite ejecutar todo el sistema con un solo proceso y comando, manteniendo desacoplada la lógica de negocio.
- **Base de datos:** Relacional con SQLAlchemy (SQLite por defecto en mesa_soporte.db, configurable mediante DATABASE_URL). Garantiza integridad referencial (PRAGMA foreign_keys=ON) y restricciones CHECK a nivel de motor.

### Organización del código
```text
backend/src/
├── endpoints/   Rutas HTTP: reciben la solicitud, verifican permisos y responden
├── services/    Lógica de los casos y registro del historial
├── entities/    Tablas de la base de datos (usuarios, categorías, reportes, intervenciones)
├── schemas/     Validación de lo que entra y sale de la API
├── database/    Conexión y sesión de la base de datos
├── utils/       Reglas del negocio (reglas.py), seguridad (JWT y scopes) y configuración
└── main.py      Arma la aplicación FastAPI

frontend/
├── templates/   Pantallas (Jinja2): base, ingreso, solicitante, técnico y coordinación
└── static/      CSS y JavaScript (api.js habla con la API; ui.js dibuja; uno por pantalla)
```

### Modelo de datos y relaciones

El esquema relacional consta de cuatro entidades principales (usuarios, categorias, reportes e intervenciones) con historial inmutable (*append-only*) y sin borrado físico de casos:

```mermaid
erDiagram
    USUARIOS ||--o{ REPORTES : "solicita"
    USUARIOS |o--o{ REPORTES : "atiende"
    CATEGORIAS ||--o{ REPORTES : "clasifica"
    REPORTES ||--o{ INTERVENCIONES : "tiene"
    USUARIOS ||--o{ INTERVENCIONES : "escribe"

    USUARIOS {
        int id PK
        string nombre
        string correo UK
        string password_hash
        string rol
        boolean activo
        datetime creado_en
    }
    CATEGORIAS {
        int id PK
        string nombre UK
        string tipo
    }
    REPORTES {
        int id PK
        int solicitante_id FK
        int tecnico_id FK
        int categoria_id FK
        text descripcion
        string placa
        string telefono
        string nombre_solicitante
        string area
        string estado
        text respuesta_tecnica
        string motivo_cierre
        text observacion_cierre
        int calificacion
        text comentario_calificacion
        datetime creado_en
        datetime actualizado_en
        datetime cerrado_en
    }
    INTERVENCIONES {
        int id PK
        int reporte_id FK
        int autor_id FK
        string tipo
        text descripcion
        string estado_anterior
        string estado_nuevo
        datetime creado_en
    }
```

### Interfaces del sistema (prototipos y capturas)

Los prototipos ASCII de cada vista se encuentran detallados en la [Sección 3.3 de `docs/diseno.md`](docs/diseno.md#33-prototipos-y-capturas-de-las-pantallas-implementadas). A continuación se muestran las vistas principales implementadas por rol:

| Vista | Captura |
|---|---|
| **Ingreso (`/`)** | ![Pantalla de ingreso](evidencias/CP-12.png) |
| **Solicitante (`/solicitante`)** | ![Vista de solicitante](evidencias/CP-12_2.png) |
| **Detalle de caso (Modal compartido)** | ![Detalle del caso](evidencias/CP-12_3.png) |
| **Técnico (`/tecnico`)** | ![Vista de técnico](evidencias/pantalla-4.png) |
| **Coordinación — Por asignar (`/coordinador`)** | ![Vista de coordinación](evidencias/CP-12_4.png) |
| **Coordinación — Consolidado (`/coordinador`)** | ![Vista consolidada](evidencias/pantalla-5.png) |

## 5. Configuración del entorno

Requisitos: Python 3.10 o superior.

```bash
# 1. Entorno virtual e instalación (desde la raíz del repositorio)
python -m venv .venv
source .venv/bin/activate          # En Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Variables de entorno
cp .env.example .env               # En Windows: copy .env.example .env
# Edite .env: reemplace SECRET_KEY por una clave generada con
#   python -c "import secrets; print(secrets.token_urlsafe(48))"
# y escriba en DEMO_PASSWORD la clave de prueba que usarán los usuarios ficticios.

# 2b. (Opcional) Comprobar que todo quedó completo en este computador
python verificar_instalacion.py

# 3. Base de datos y datos ficticios de prueba (desde backend/)
cd backend
python seed.py

# 4. Ejecutar backend y frontend integrados (desde backend/)
# FastAPI sirve la API REST en /api y la interfaz web estática en /
uvicorn src.main:app --reload
```

- Aplicación web: <http://127.0.0.1:8000/>
- Documentación interactiva de la API: <http://127.0.0.1:8000/docs>

Usuarios ficticios (todos usan la clave que definan en DEMO_PASSWORD dentro de su .env):

| Rol | Correo |
|---|---|
| Coordinador | coordinador@demo.test |
| Técnico | tecnico1@demo.test, tecnico2@demo.test |
| Solicitante | solicitante1@demo.test, solicitante2@demo.test |

Para reiniciar los datos de prueba: python seed.py --reset (desde backend/).

### Errores frecuentes al arrancar

| Mensaje | Causa y solución |
|---|---|
| No module named 'app' | Se usó el comando antiguo. El correcto es uvicorn src.main:app --reload |
| No module named 'src' | La terminal no está en backend/. Ejecute cd backend primero |
| SECRET_KEY o DEMO_PASSWORD faltante | Falta esa línea en el .env de la raíz del repositorio |
| No module named 'jinja2' (u otro paquete) | Ejecute pip install -r requirements.txt con el entorno virtual activo |

## 6. Servicios web implementados

Documentación interactiva: /docs. Todas las rutas, salvo el inicio de sesión, exigen el token JWT.

| Método | Ruta | Descripción | Requisito relacionado |
|---|---|---|---|
| POST | `/api/auth/login` | Inicia sesión y devuelve el token con sus scopes | RF-10 |
| GET | `/api/auth/me` | Usuario de la sesión actual | RF-10 |
| GET | `/api/categorias` | Lista las categorías | RF-02 |
| GET | `/api/usuarios/tecnicos` | Lista los técnicos (solo coordinación) | RF-03 |
| POST | `/api/reportes` | Reporta un caso | RF-01, RF-02 |
| GET | `/api/reportes` | Lista los casos que el rol puede ver | RF-08, RF-09 |
| GET | `/api/reportes/{id}` | Detalle: estado, responsable, resultado | RF-08 |
| GET | `/api/reportes/{id}/historial` | Historial de intervenciones en orden | RF-05 |
| PATCH | `/api/reportes/{id}/asignar` | Asigna técnico (solo coordinación) | RF-03, RF-04 |
| PATCH | `/api/reportes/{id}/iniciar` | Inicia la reparación (técnico asignado) | RF-06 |
| POST | `/api/reportes/{id}/intervenciones` | Registra una intervención (técnico asignado) | RF-05 |
| PATCH | `/api/reportes/{id}/terminar` | Termina con su respuesta (técnico asignado) | RF-06 |
| PATCH | `/api/reportes/{id}/cerrar` | Cierra el caso (solo coordinación); no se reabre | RN-05, RF-07 |
| POST | `/api/reportes/{id}/calificacion` | Califica un caso cerrado (solicitante) | RF-11 |
| GET | `/api/consolidado` | Casos abiertos y cerrados con estado y responsable | RF-09 |

Códigos de respuesta: 200/201 éxito · 401 sin sesión válida · 403 sin permiso · 404 no existe · 409 acción no válida para el estado del caso · 422 datos inválidos.

### Ejemplos de solicitudes, respuestas y manejo de errores

#### 1. Autenticación (`POST /api/auth/login` → `200 OK`)
* **Solicitud (`application/x-www-form-urlencoded`):**
  ```text
  username=solicitante1@demo.test&password=<DEMO_PASSWORD>
  ```
* **Respuesta (`200 OK`):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

#### 2. Creación de reporte (`POST /api/reportes` → `201 Created`)
* **Solicitud (`application/json`):**
  ```json
  {
    "categoria_id": 1,
    "descripcion": "El equipo de escritorio no obtiene dirección IP por cable Ethernet en el puesto 14.",
    "placa": "EQ-2026-014",
    "nombre_solicitante": "Pedro Ruiz",
    "area": "Sala de Sistemas 2",
    "telefono": "3001234567"
  }
  ```
* **Respuesta (`201 Created`):**
  ```json
  {
    "id": 1,
    "estado": "reportado",
    "categoria": {
      "id": 1,
      "nombre": "Falla de computador o periférico",
      "tipo": "incidente"
    },
    "placa": "EQ-2026-014",
    "nombre_solicitante": "Pedro Ruiz",
    "area": "Sala de Sistemas 2",
    "solicitante": {
      "id": 4,
      "nombre": "Pedro Ruiz",
      "correo": "solicitante1@demo.test",
      "rol": "solicitante"
    },
    "tecnico": null,
    "creado_en": "2026-11-16T23:41:37.538404+00:00"
  }
  ```

#### 3. Registro de intervención técnica (`POST /api/reportes/1/intervenciones` → `201 Created`)
* **Solicitud (`application/json`):**
  ```json
  {
    "descripcion": "Se registró una intervención de prueba para validar que el sistema permita agregar observaciones al historial del caso y conservar la información correctamente."
  }
  ```
* **Respuesta (`201 Created`):**
  ```json
  {
    "id": 4,
    "tipo": "nota",
    "descripcion": "Se registró una intervención de prueba para validar que el sistema permita agregar observaciones al historial del caso y conservar la información correctamente.",
    "estado_anterior": null,
    "estado_nuevo": null,
    "creado_en": "2026-11-17T00:49:22.280552+00:00",
    "autor": {
      "id": 2,
      "nombre": "Luis Pérez",
      "correo": "tecnico1@demo.test",
      "rol": "tecnico"
    }
  }
  ```

#### 4. Validaciones y respuestas de error (`403 Forbidden` y `422 Unprocessable Entity`)
* **Error de autorización por rol o asignación (`403 Forbidden` en `PATCH /api/reportes/2/iniciar`):**
  ```json
  {
    "detail": "Solo el técnico asignado a este caso puede realizar esta acción"
  }
  ```
* **Error de validación de esquema (`422 Unprocessable Entity` cuando faltan campos obligatorios en `POST /api/reportes`):**
  ```json
  {
    "detail": [
      {
        "type": "missing",
        "loc": ["body", "placa"],
        "msg": "Field required"
      }
    ]
  }
  ```

## 7. Pruebas de API e integración y evidencias

**Matriz de trazabilidad completa:** [Consultar `docs/trazabilidad.md`](docs/trazabilidad.md)

### Cómo reproducir las pruebas funcionales
1. **Preparar estado limpio de la base de datos:** Ejecutar python seed.py --reset dentro de backend/ e iniciar el servidor con uvicorn src.main:app --reload.
2. **Pruebas de API y reglas de negocio (CP-01 a CP-11):** Abrir **Swagger UI** en <http://127.0.0.1:8000/docs>, autenticarse mediante el botón **Authorize** con el usuario correspondiente (solicitante1@demo.test, solicitante2@demo.test, tecnico1@demo.test, tecnico2@demo.test o coordinador@demo.test) y ejecutar cada endpoint siguiendo el orden secuencial de la tabla.
3. **Prueba de integración extremo a extremo (CP-12):** Abrir la interfaz web en <http://127.0.0.1:8000/> desde el navegador, operar los formularios con JWT activo y verificar la persistencia en SQLite.

### Tabla de pruebas funcionales de API, reglas de negocio e integración

| Identificador | Prueba mínima | Requisito asociado | Condiciones iniciales | Pasos de ejecución | Datos de entrada | Método y código HTTP | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|
| CP-01 | Registro válido de caso de soporte | CA-01 (RF-01, RF-02) | Servidor FastAPI activo en `http://127.0.0.1:8000`; usuario `solicitante1@demo.test` autenticado mediante token JWT; categoría `1` existente en SQLite. | 1. Iniciar sesión en Authorize de Swagger UI (`/docs`) con `solicitante1@demo.test`.<br>2. Desplegar `POST /api/reportes` y pulsar Try it out.<br>3. Ingresar el JSON de entrada y pulsar Execute. | `{"descripcion": "El equipo de escritorio no obtiene dirección IP por cable Ethernet en el puesto 14.", "placa": "EQ-2026-014", "telefono": "3001234567", "nombre_solicitante": "Pedro Ruiz", "area": "Sala de Sistemas 2", "categoria_id": 1}` | `POST /api/reportes` → `201 Created` | El sistema valida los campos, persiste el reporte en `mesa_soporte.db`, asigna un `id` único, estado inicial y vincula al solicitante autenticado. | Reporte creado exitosamente con `id: 1`, `estado: "reportado"`, fecha `2026-11-16T19:28:09.512738+00:00`, asociado a `Pedro Ruiz` (`id: 4`) y categoría `1`. | Aprobada | • [Solicitud](evidencias/CP-01.png)<br>• [Respuesta](evidencias/CP-01_2.png) |
| CP-02 | Registro con datos inválidos | CA-01 (RF-02) | Servidor FastAPI activo en `http://127.0.0.1:8000`; usuario `solicitante1@demo.test` autenticado mediante token JWT; no existe categoría con `id: 999` en SQLite. | 1. Iniciar sesión en Authorize de Swagger UI (`/docs`) con `solicitante1@demo.test`.<br>2. Desplegar `POST /api/reportes` y pulsar Try it out.<br>3. Ingresar el JSON con `categoria_id: 999` y pulsar Execute. | `{"descripcion": "El equipo de escritorio no obtiene dirección IP por cable Ethernet en el puesto 14.", "placa": "EQ-2026-014", "telefono": "3001234567", "nombre_solicitante": "Pedro Ruiz", "area": "Sala de Sistemas 2", "categoria_id": 999}` | `POST /api/reportes` → `422 Unprocessable Content` | La API rechaza la solicitud con error HTTP controlado por categoría inexistente y no persiste ningún registro en `mesa_soporte.db`. | Solicitud rechazada con código `422 Unprocessable Content` y respuesta `{"detail": "La categoría indicada no existe"}`, sin guardar información inválida en la base de datos. | Aprobada | • [Solicitud](evidencias/CP-02.png)<br>• [Respuesta](evidencias/CP-02_2.png) |
| CP-03 | Consulta de caso existente | CA-03 (RF-04, RF-08) | Servidor FastAPI activo en `http://127.0.0.1:8000`; existe el reporte `id: 1` creado por `solicitante1@demo.test`; usuarios `solicitante1@demo.test` (propietario) y `solicitante2@demo.test` (ajeno) registrados. | 1. Iniciar sesión en Authorize con `solicitante1@demo.test`.<br>2. Desplegar `GET /api/reportes/{reporte_id}`, ingresar `reporte_id = 1` y pulsar Execute.<br>3. Cerrar sesión (Logout), autenticar a `solicitante2@demo.test` y repetir la consulta sobre `reporte_id = 1`. | Parámetro de ruta `reporte_id = 1` (con token de `solicitante1@demo.test` y posteriormente de `solicitante2@demo.test`). | `GET /api/reportes/1` → `200 OK` (propietario) / `403 Forbidden` (otro solicitante) | El solicitante dueño del caso obtiene la información completa del reporte (`200 OK`), mientras que otro solicitante sin relación con el caso recibe bloqueo de acceso (`403 Forbidden`). | Con `solicitante1@demo.test` respondió `200 OK` devolviendo los datos íntegros del caso `id: 1` (`estado: "reportado"`, placa `EQ-2026-014`, solicitante `Pedro Ruiz`). Con `solicitante2@demo.test` respondió `403 Forbidden` (`{"detail": "No tiene permiso para ver este caso"}`). | Aprobada | • [Solicitud](evidencias/CP-03.png)<br>• [Respuesta 200](evidencias/CP-03_2.png)<br>• [Respuesta 403](evidencias/CP-03_3.png) |
| CP-04 | Consulta de caso inexistente | CA-03 (RF-04) | Servidor FastAPI activo en `http://127.0.0.1:8000`; usuario `solicitante2@demo.test` autenticado mediante token JWT; no existe ningún reporte con `id: 2` en SQLite. | 1. Iniciar sesión en Authorize de Swagger UI (`/docs`) con `solicitante2@demo.test`.<br>2. Desplegar `GET /api/reportes/{reporte_id}` y pulsar Try it out.<br>3. Ingresar `reporte_id = 2` y pulsar Execute. | Parámetro de ruta `reporte_id = 2` | `GET /api/reportes/2` → `404 Not Found` | La API responde con un error HTTP controlado (`404 Not Found`) indicando que el caso no existe, sin fallos internos del servidor. | Solicitud rechazada de forma controlada con código `404 Not Found` y respuesta `{"detail": "El caso solicitado no existe"}`. | Aprobada | • [Solicitud y Respuesta](evidencias/CP-04.png) |
| CP-05 | Gestión por personal autorizado | CA-02 (RF-03, RF-06, RF-10) | Servidor FastAPI activo en `http://127.0.0.1:8000`; reporte `id: 1` en estado `"reportado"`; usuarios `coordinador@demo.test` (rol coordinador) y `tecnico1@demo.test` (id `2`, rol técnico) autenticados con JWT. | 1. Autenticar `coordinador@demo.test` y ejecutar `PATCH /api/reportes/1/asignar` con `{"tecnico_id": 2}`.<br>2. Autenticar `tecnico1@demo.test` y ejecutar `PATCH /api/reportes/1/iniciar`.<br>3. Ejecutar `PATCH /api/reportes/1/terminar` con la respuesta técnica del caso. | Asignar: `{"tecnico_id": 2}`<br>Iniciar: `reporte_id = 1`<br>Terminar: `{"respuesta": "Se realizó la verificación del caso y se validó el correcto funcionamiento del registro de intervenciones y del historial de seguimiento. Las pruebas se completaron satisfactoriamente y el caso se marca como terminado."}` | `PATCH /api/reportes/1/asignar` → `200 OK`<br>`PATCH /api/reportes/1/iniciar` → `200 OK`<br>`PATCH /api/reportes/1/terminar` → `200 OK` | El sistema permite a coordinación asignar el técnico (`"asignado"`) y al técnico responsable iniciar (`"en_reparacion"`) y finalizar el reporte (`"terminado"`), persistiendo cada transición. | Las tres transiciones respondieron `200 OK` en orden: asignado a `Luis Pérez` (`id: 2`, estado `"asignado"`), iniciado (`estado: "en_reparacion"`) y finalizado (`estado: "terminado"`, `actualizado_en: "2026-11-17T00:53:37.243810+00:00"`). | Aprobada | • [Asignar (Req)](evidencias/CP-05.png)<br>• [Asignar (Res)](evidencias/CP-05_2.png)<br>• [Iniciar](evidencias/CP-05_3.png)<br>• [Terminar (Req)](evidencias/CP-05_4.png)<br>• [Terminar (Res)](evidencias/CP-05_5.png) |
| CP-06 | Gestión por actor no autorizado | CA-02 (RF-03, RF-06, RF-10) | Servidor FastAPI activo en `http://127.0.0.1:8000`; existe el reporte `id: 2` no asignado a `tecnico1@demo.test`; usuario `tecnico1@demo.test` autenticado con JWT. | 1. Autenticar `tecnico1@demo.test` en Authorize (`/docs`).<br>2. Intentar asignar el caso mediante `PATCH /api/reportes/2/asignar` con `{"tecnico_id": 4}`.<br>3. Intentar iniciar la reparación mediante `PATCH /api/reportes/2/iniciar`.<br>4. Intentar finalizar el caso mediante `PATCH /api/reportes/2/terminar` con `{"respuesta": "Caso resuelto"}`. | Asignar: `{"tecnico_id": 4}`<br>Iniciar: `reporte_id = 2`<br>Terminar: `{"respuesta": "Caso resuelto"}` | `PATCH /api/reportes/2/asignar` → `403 Forbidden`<br>`PATCH /api/reportes/2/iniciar` → `403 Forbidden`<br>`PATCH /api/reportes/2/terminar` → `403 Forbidden` | La API rechaza todas las operaciones con `403 Forbidden` al validar scopes de rol (asignación exclusiva de coordinación) y asignación del caso (inicio y cierre técnico solo por el técnico asignado), sin alterar el estado del reporte. | Las tres peticiones respondieron `403 Forbidden`: `/asignar` devolvió `{"detail": "No tiene permisos para esta operación"}`, mientras que `/iniciar` y `/terminar` devolvieron `{"detail": "Solo el técnico asignado a este caso puede realizar esta acción"}`. | Aprobada | • [Asignar (Req)](evidencias/CP-06.png)<br>• [Asignar (Res)](evidencias/CP-06_2.png)<br>• [Iniciar (Res)](evidencias/CP-06_3.png)<br>• [Terminar (Req)](evidencias/CP-06_4.png)<br>• [Terminar (Res)](evidencias/CP-06_5.png) |
| CP-07 | Consulta de estado y responsable | CA-03 (RF-04, RF-08) | Servidor FastAPI activo en `http://127.0.0.1:8000`; reporte `id: 2` creado por `solicitante2@demo.test` (Laura Díaz) y asignado a `tecnico2@demo.test` (Ana Torres, `id: 3`); solicitante autenticado con JWT. | 1. Autenticar `solicitante2@demo.test` en Authorize (`/docs`).<br>2. Desplegar `GET /api/reportes/{reporte_id}` y pulsar Try it out.<br>3. Ingresar `reporte_id = 2` y pulsar Execute. | Parámetro de ruta `reporte_id = 2` | `GET /api/reportes/2` → `200 OK` | La API devuelve el detalle actualizado del caso con coherencia entre su estado operativo (`"asignado"`) y la información completa del técnico responsable asignado. | Respuesta `200 OK` mostrando el caso `id: 2` (`placa: "PC-ADM-014"`, área `Administración`) en `estado: "asignado"`, vinculado correctamente a la técnica responsable `Ana Torres` (`tecnico2@demo.test`, `id: 3`). | Aprobada | • [Solicitud](evidencias/CP-07.png)<br>• [Respuesta](evidencias/CP-07_2.png) |
| CP-08 | Consulta de historial de intervenciones | CA-04 (RF-05, RF-07) | Servidor FastAPI activo en `http://127.0.0.1:8000`; reporte `id: 1` asignado a `tecnico1@demo.test` (`id: 2`, Luis Pérez); técnico autenticado con JWT. | 1. Autenticar `tecnico1@demo.test` en Authorize (`/docs`).<br>2. Desplegar `POST /api/reportes/{reporte_id}/intervenciones`, ingresar `reporte_id = 1` y enviar la observación técnica.<br>3. Ejecutar `GET /api/reportes/1/historial` para verificar el registro cronológico de notas y cambios de estado. | `{"descripcion": "Se registró una intervención de prueba para validar que el sistema permita agregar observaciones al historial del caso y conservar la información correctamente."}`<br>Consulta: `reporte_id = 1` | `POST /api/reportes/1/intervenciones` → `201 Created`<br>`GET /api/reportes/1/historial` → `200 OK` | El sistema registra la intervención vinculada al reporte y al técnico autor (`201 Created`), y al consultar el historial devuelve en orden cronológico las notas técnicas y transiciones de estado (`200 OK`). | Intervención creada con `id: 4`, `tipo: "nota"`, fecha `2026-11-17T00:49:22.280552+00:00` y autor `Luis Pérez` (`tecnico1@demo.test`, `id: 2`); consulta de historial retorna la traza completa del caso `1`. | Aprobada | • [Registrar (Req)](evidencias/CP-08.png)<br>• [Registrar (Res)](evidencias/CP-08_2.png)<br>• [Historial (Req)](evidencias/CP-08_3.png)<br>• [Historial (Res)](evidencias/CP-08_4.png) |
| CP-09 | Cierre de caso y consulta de resultado | CA-05 (RF-08, RF-11) | Servidor FastAPI activo en `http://127.0.0.1:8000`; reporte `id: 1` en estado `"terminado"`; usuarios `coordinador@demo.test` y `solicitante1@demo.test` autenticados con JWT. | 1. Autenticar `coordinador@demo.test` y ejecutar `PATCH /api/reportes/1/cerrar` con motivo `"resuelto"`.<br>2. Autenticar `solicitante1@demo.test` y ejecutar `POST /api/reportes/1/calificacion` con puntuación `5`. | Cerrar: `{"motivo": "resuelto", "observacion": "Caso cerrado"}`<br>Calificar: `{"puntuacion": 5, "comentario": "Buen servicio"}` | `PATCH /api/reportes/1/cerrar` → `200 OK`<br>`POST /api/reportes/1/calificacion` → `200 OK` | Coordinación cierra el reporte de forma definitiva (`"cerrado"`, con marca de tiempo `cerrado_en`), habilitando al solicitante dueño del caso para registrar y consultar su calificación del servicio. | Ambos endpoints respondieron `200 OK`: el caso pasó a `estado: "cerrado"` con `cerrado_en: "2026-11-17T00:59:17.726006+00:00"` y `motivo_cierre: "resuelto"`, y se registró la calificación de `5` estrellas (`"Buen servicio"`). | Aprobada | • [Cerrar (Req)](evidencias/CP-09.png)<br>• [Cerrar (Res)](evidencias/CP-09_2.png)<br>• [Calificar (Req)](evidencias/CP-09_3.png)<br>• [Calificar (Res)](evidencias/CP-09_4.png) |
| CP-10 | Consulta consolidada de coordinación | CA-06 (RF-09) | Servidor FastAPI activo en `http://127.0.0.1:8000`; existen 2 reportes registrados (`id: 1` cerrado e `id: 2` asignado); usuario `coordinador@demo.test` autenticado mediante token JWT. | 1. Autenticar `coordinador@demo.test` en Authorize (`/docs`).<br>2. Desplegar `GET /api/consolidado` y pulsar Try it out.<br>3. Pulsar Execute sin parámetros adicionales. | Solicitud `GET /api/consolidado` con cabecera `Authorization: Bearer <token_coordinador>`. | `GET /api/consolidado` → `200 OK` | El sistema retorna el resumen consolidado con los totales generales, conteo discriminado por cada estado operativo y el detalle de los casos abiertos con sus responsables. | Respuesta `200 OK` reportando `"total": 2`, `"abiertos": 1`, `"cerrados": 1`, desglose `"por_estado": {"reportado": 0, "asignado": 1, "en_reparacion": 0, "terminado": 0, "cerrado": 1}` y el listado `casos_abiertos` con el reporte `id: 2` (`Laura Díaz`, placa `PC-ADM-014`). | Aprobada | • [Solicitud y Respuesta](evidencias/CP-10.png) |
| CP-11 | Persistencia e integridad de relaciones | CA-03, CA-04 (RF-04, RF-05, RF-07, RF-08) | Servidor FastAPI ejecutándose en `http://127.0.0.1:8000` (proceso `13624`) con 2 reportes, intervenciones, asignaciones y calificación almacenados en `mesa_soporte.db`. | 1. Detener el servidor Uvicorn en la terminal (`Ctrl + C`) a las 9:29 p. m.<br>2. Reiniciar el servidor con `uvicorn src.main:app --reload` a las 9:30 p. m.<br>3. Ejecutar `GET /api/consolidado` en Swagger (`/docs`) a las 9:31 p. m. para verificar los datos almacenados. | Reinicio del proceso de servidor y consulta `GET /api/consolidado` con token de `coordinador@demo.test`. | `GET /api/consolidado` (tras reinicio) → `200 OK` | Al reiniciar la aplicación, la base de datos SQLite conserva todos los registros previos sin pérdida de información ni ruptura de claves foráneas entre reportes, usuarios, categorías e intervenciones. | Tras detener el proceso `[13624]` (9:29 p. m.) y levantar el nuevo proceso `[15836]` (9:30 p. m.), la consulta a las 9:31 p. m. respondió `200 OK` manteniendo íntegros los `2` reportes (`1` abierto asignado y `1` cerrado) y todas sus relaciones. | Aprobada | • [Detener servidor](evidencias/CP-11.png)<br>• [Reiniciar servidor](evidencias/CP-11_2.png)<br>• [Verificar datos](evidencias/CP-11_3.png) |
| CP-12 | Integración interfaz–API–base de datos | CA-01 a CA-06 (RF-01 a RF-11, RNF-01, RNF-04) | Servidor FastAPI activo en `http://127.0.0.1:8000` sirviendo el frontend web; usuarios `solicitante1@demo.test` (Pedro Ruiz) y `coordinador@demo.test` (Marta Gómez) habilitados. | 1. Iniciar sesión en la vista web (`/`) con `solicitante1@demo.test`.<br>2. Diligenciar y enviar el formulario *Reportar un caso* desde `solicitante.html` con placa `IMP-2026-002` y área `Contabilidad`.<br>3. Verificar la creación del **Caso #3** en el modal de detalle del solicitante.<br>4. Iniciar sesión como `coordinador@demo.test` en `coordinador.html` y verificar el caso en la pestaña *Por asignar*.<br>5. Confirmar en Swagger (`/docs`) mediante `GET /api/consolidado` la persistencia del registro en SQLite. | Credenciales web de `solicitante1@demo.test` y `coordinador@demo.test`; formulario web: Categoría `Falla de computador o periférico`, Descripción `"La impresora de red del segundo piso no responde a la cola de impresión"`, Placa `"IMP-2026-002"`, Área `"Contabilidad"`, Teléfono `"3123456778"`. | `POST /api/auth/login` → `200 OK`<br>`POST /api/reportes` → `201 Created`<br>`GET /api/consolidado` → `200 OK` | La interfaz web consume los endpoints REST adjuntando el token JWT, persiste el nuevo reporte en `mesa_soporte.db` y sincroniza la información en tiempo real entre las vistas de solicitante y coordinación. | El flujo web creó el `Caso #3` (`estado: "reportado"`, placa `IMP-2026-002`, área `Contabilidad`), lo reflejó inmediatamente en la tabla *Casos reportados sin técnico* del panel de coordinación (`Marta Gómez`) y quedó confirmado en `GET /api/consolidado` (`200 OK`, `creado_en: "2026-11-17T02:44:09.597638+00:00"`). | Aprobada | • [Login web](evidencias/CP-12.png)<br>• [Formulario](evidencias/CP-12_2.png)<br>• [Caso #3 creado](evidencias/CP-12_3.png)<br>• [Panel Coordinación](evidencias/CP-12_4.png)<br>• [Confirmación API](evidencias/CP-12_5.png) |

### Evidencias CP-01: Registro válido de caso de soporte

**Solicitud (Request):**
![Solicitud CP-01](evidencias/CP-01.png)

**Respuesta (Response 201 Created):**
![Respuesta CP-01](evidencias/CP-01_2.png)

### Evidencias CP-02: Registro con datos inválidos
**Solicitud (Request):**
![Solicitud CP-02](evidencias/CP-02.png)

**Respuesta (Response 422 Unprocessable Content):**
![Respuesta CP-02](evidencias/CP-02_2.png)

### Evidencias CP-03: Consulta de caso existente
**Solicitud (Request):**
![Solicitud CP-03](evidencias/CP-03.png)

**Respuesta (Response 200 OK):**
![Respuesta CP-03](evidencias/CP-03_2.png)

**Respuesta (Response 403 Forbidden - Otro solicitante):**
![Respuesta CP-03](evidencias/CP-03_3.png)

### Evidencias CP-04: Consulta de caso inexistente
**Solicitud y Respuesta (Response 404 Not Found):**
![Solicitud y Respuesta CP-04](evidencias/CP-04.png)

### Evidencias CP-05: Gestión por personal autorizado

**1. Asignación de técnico - Solicitud (`coordinador@demo.test`):**
![Solicitud Asignar CP-05](evidencias/CP-05.png)

**2. Asignación de técnico - Respuesta (`200 OK`):**
![Respuesta Asignar CP-05](evidencias/CP-05_2.png)

**3. Inicio de reparación (`tecnico1@demo.test` - `200 OK`):**
![Iniciar Reparación CP-05](evidencias/CP-05_3.png)

**4. Terminación del caso - Solicitud (`tecnico1@demo.test`):**
![Solicitud Terminar CP-05](evidencias/CP-05_4.png)

**5. Terminación del caso - Respuesta (`200 OK`):**
![Respuesta Terminar CP-05](evidencias/CP-05_5.png)

### Evidencias CP-06: Gestión por actor no autorizado
**1. Intento de asignación por técnico - Solicitud (`PATCH /api/reportes/2/asignar`):**
![Solicitud Asignar CP-06](evidencias/CP-06.png)

**2. Intento de asignación por técnico - Respuesta (`403 Forbidden`):**
![Respuesta Asignar CP-06](evidencias/CP-06_2.png)

**3. Intento de inicio por técnico no asignado (`PATCH /api/reportes/2/iniciar` - `403 Forbidden`):**
![Respuesta Iniciar CP-06](evidencias/CP-06_3.png)

**4. Intento de terminación por técnico no asignado - Solicitud (`PATCH /api/reportes/2/terminar`):**
![Solicitud Terminar CP-06](evidencias/CP-06_4.png)

**5. Intento de terminación por técnico no asignado - Respuesta (`403 Forbidden`):**
![Respuesta Terminar CP-06](evidencias/CP-06_5.png)

### Evidencias CP-07: Consulta de estado y responsable

**1. Consulta del caso asignado - Solicitud (`solicitante2@demo.test`):**
![Solicitud CP-07](evidencias/CP-07.png)

**2. Consulta del caso asignado - Respuesta (`200 OK`):**
![Respuesta CP-07](evidencias/CP-07_2.png)

### Evidencias CP-08: Consulta de historial de intervenciones
**1. Registro de intervención - Solicitud (`tecnico1@demo.test`):**
![Solicitud Intervención CP-08](evidencias/CP-08.png)

**2. Registro de intervención - Respuesta (`201 Created`):**
![Respuesta Intervención CP-08](evidencias/CP-08_2.png)

**3. Consulta cronológica del historial - Solicitud (`GET /api/reportes/1/historial`):**
![Solicitud Historial CP-08](evidencias/CP-08_3.png)

**4. Consulta cronológica del historial - Respuesta (`200 OK`):**
![Respuesta Historial CP-08](evidencias/CP-08_4.png)

### Evidencias CP-09: Cierre de caso y consulta de resultado
**1. Cierre del caso - Solicitud (`coordinador@demo.test`):**
![Solicitud Cerrar CP-09](evidencias/CP-09.png)

**2. Cierre del caso - Respuesta (`200 OK`):**
![Respuesta Cerrar CP-09](evidencias/CP-09_2.png)

**3. Calificación del servicio - Solicitud (`solicitante1@demo.test`):**
![Solicitud Calificar CP-09](evidencias/CP-09_3.png)

**4. Calificación del servicio - Respuesta (`200 OK`):**
![Respuesta Calificar CP-09](evidencias/CP-09_4.png)

### Evidencias CP-10: Consulta consolidada de coordinación
**Consulta consolidada (`GET /api/consolidado` - `200 OK`):**
![Consolidado CP-10](evidencias/CP-10.png)

### Evidencias CP-11: Persistencia e integridad de relaciones
**1. Detención del servidor Uvicorn (Proceso `[13624]` - 9:29 p. m.):**
![Detener Servidor CP-11](evidencias/CP-11.png)

**2. Reinicio del servidor Uvicorn (Nuevo proceso `[15836]` - 9:30 p. m.):**
![Reiniciar Servidor CP-11](evidencias/CP-11_2.png)

**3. Verificación de datos persistidos tras el reinicio (`GET /api/consolidado` - 9:31 p. m.):**
![Verificar Persistencia CP-11](evidencias/CP-11_3.png)

### Evidencias CP-12: Integración interfaz–API–base de datos

**1. Inicio de sesión en la interfaz web (`solicitante1@demo.test`):**
![Login Web CP-12](evidencias/CP-12.png)

**2. Diligenciamiento del formulario *Reportar un caso* (`solicitante.html`):**
![Formulario Reporte CP-12](evidencias/CP-12_2.png)

**3. Confirmación visual y modal de detalle del Caso #3 registrado:**
![Caso Registrado CP-12](evidencias/CP-12_3.png)

**4. Visualización inmediata en la bandeja *Por asignar* de Coordinación (`coordinador.html`):**
![Panel Coordinación CP-12](evidencias/CP-12_4.png)

**5. Confirmación de persistencia en SQLite vía API (`GET /api/consolidado` - `200 OK`):**
![Confirmación Swagger CP-12](evidencias/CP-12_5.png)

## 8. Control de versiones

* **Repositorio oficial:** `https://github.com/andreavargasloaiza-09/Proyecto_Final_Aplicaciones_y_Servicios_Web`
* **Flujo de trabajo aplicado:** Desarrollo basado en ramas por funcionalidad (*feature branches*) integradas a la rama principal `main` mediante revisión por Pull Requests (PR #1 a PR #4).

### Pull Requests, ramas y commits relevantes

| Pull Request | Rama / Área | Commits asociados | Descripción de los cambios integrados en `main` |
|---|---|---|---|
| **PR #1** – Núcleo de reportes y reglas de negocio | Backend (`backend/src/`) | `db76ebf` | Implementación de modelos relacionales SQLite, esquemas Pydantic, autenticación JWT con *scopes* por rol y endpoints base de creación, asignación, inicio, intervenciones, terminación y cierre. |
| **PR #2** – Consultas, historial y consolidado | Backend (`backend/src/`) | `f92c9d2` | Implementación de consultas filtradas por rol (`GET /api/reportes/{id}`), bitácora cronológica (`GET /api/reportes/{id}/historial`), encuesta de calificación (`POST /api/reportes/{id}/calificacion`) y resumen gerencial (`GET /api/consolidado`). |
| **PR #3** – Vistas base y formulario de reporte | Frontend (`frontend/`) | `501791f`, `f37b1a0` | Maquetación de plantillas HTML (`login`, `solicitante`, `tecnico`, `coordinador`), estilos CSS y consumo inicial de autenticación JWT y creación de reportes. |
| **PR #4** – Integración completa de flujos web | Frontend (`frontend/`) | `04b519f`, `d9d27b3` | Integración extremo a extremo en JavaScript (`solicitante.js`, `tecnico.js`, `coordinador.js`, `ui.js`) de asignación de técnicos, gestión de estados, historial de intervenciones, cierre, calificación y vista consolidada. |
|**PR #5** – Documentación final, matrices y evidencias de pruebas | Documentación (`README.md`, `trazabilidad.md`, `evidencias/`) | `9ce4774` | Consolidación del `README.md` final, matriz de trazabilidad (`trazabilidad.md`) y carga de evidencias gráficas de entrevista y pruebas funcionales (`CP-01` a `CP-12`). |

### Resumen verificable de aportes por integrante

* **Trabajo en conjunto (Samuel Montoya Galeano y Andrea Vargas Loaiza):**
  * Levantamiento de requerimientos y entrevista con el docente.
  * Análisis, especificación y redacción de los documentos docs/requisitos.md, docs/diseno.md, trazabilidad.md, etc.
  * Redacción, estructuración y consolidación final del README.md (**PR #5**).

* **Andrea Vargas Loaiza (Desarrollo Backend y Base de Datos):**
  * Arquitectura del backend en FastAPI, modelado de base de datos relacional en SQLite (mesa_soporte.db), script de datos iniciales (seed.py) y configuración de seguridad con tokens JWT y *scopes*.
  * Implementación de todos los endpoints REST y reglas de negocio del ciclo de vida de reportes (**PR #1** y **PR #2**).

* **Samuel Montoya Galeano (Desarrollo Frontend y Pruebas):**
  * Desarrollo completo de la interfaz web (frontend/templates/ y frontend/static/js/) e integración cliente-servidor mediante tokens JWT (**PR #3** y **PR #4**).
  * Diseño, ejecución, captura de evidencias y documentación de las 12 pruebas funcionales de API, reglas de negocio e integración (CP-01 a CP-12).


## 9. Conclusiones y limitaciones
### Cumplimiento de las condiciones del problema
* **Cobertura total de requisitos y condiciones obligatorias:** Se implementó y verificó el 100 % de las historias de usuario (HU-01 a HU-07), requisitos funcionales (RF-01 a RF-11), requisitos no funcionales (RNF-01 a RNF-06) y condiciones de aceptación obligatorias (CA-01 a CA-06), respaldados por la ejecución aprobada de las 12 pruebas funcionales (CP-01 a CP-12).
* **Centralización y trazabilidad verificable:** La solución reemplaza la gestión informal por un registro unificado en base de datos relacional (SQLite), garantizando que cada reporte tenga un responsable identificable, un estado operativo claro (`reportado` → `asignado` → `en_reparacion` → `terminado` → `cerrado`), una bitácora cronológica inalterable de intervenciones técnicas y una vista consolidada para coordinación.
* **Integración cliente-servidor funcional:** La interfaz web desacoplada por roles (*Solicitante*, *Técnico* y *Coordinador*) se comunica de forma efectiva con la API REST en FastAPI mediante autenticación basada en tokens JWT.

### Dificultades técnicas verificadas y soluciones aplicadas
* **Control granular de propiedad sobre los recursos:** Más allá de validar el rol general en el token JWT (*scopes*), era necesario impedir que un técnico interviniera casos asignados a otro compañero o que un solicitante consultara o calificara reportes ajenos. **Solución:** Se implementaron validaciones cruzadas en la capa de servicios (services/reportes.py) comparando el id del usuario autenticado contra solicitante_id y tecnico_id, respondiendo de forma controlada con 403 Forbidden.
* **Consistencia de la máquina de estados y bloqueo tras el cierre:** Garantizar que no ocurrieran saltos inválidos de estado ni modificaciones posteriores al cierre definitivo (RN-03, RN-05). **Solución:** Se encapsularon las reglas de transición en utils/reglas.py, bloqueando cualquier edición o nueva intervención una vez el reporte alcanza el estado cerrado.
* **Gestión de sesiones y enrutamiento por rol en el frontend:** Mantener la sesión activa entre vistas HTML estáticas (login, solicitante, tecnico, coordinador) y manejar respuestas de error de la API sin romper la experiencia de usuario. **Solución:** Se centralizó el consumo HTTP en JavaScript adjuntando automáticamente la cabecera Authorization: Bearer <token>, validando la sesión contra GET /api/auth/me y mostrando mensajes claros ante errores 401, 403, 404, 409 y 422.

### Restricciones y limitaciones del sistema

* **Comportamientos pendientes dentro del alcance aprobado:** No quedan funcionalidades pendientes dentro del alcance acordado; todos los flujos aprobados se encuentran operativos y probados.
* **Limitaciones técnicas y operativas propias del alcance:**
  * **Persistencia y despliegue local:** El sistema opera con SQLite (mesa_soporte.db) sobre servidor local Uvicorn, orientado a entornos de demostración y prueba institucional controlada.
  * **Inmutabilidad de casos cerrados:** Por regla de negocio (RN-05), un caso cerrado no puede reabrirse ni eliminarse físicamente; los reportes duplicados o erróneos se gestionan mediante cierre administrativo con observación.
  * **Integraciones externas excluidas:** Conforme a la delimitación aprobada, la solución no envía notificaciones automáticas por correo electrónico (SMTP) ni admite la carga de archivos adjuntos binarios en los reportes.