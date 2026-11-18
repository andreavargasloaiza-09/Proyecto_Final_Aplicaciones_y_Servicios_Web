"use strict";
/*
 * Comunicación con la API REST y manejo de la sesión (token JWT).
 * Es el ÚNICO archivo que habla con el servidor: las demás páginas llaman a las funciones de API.
 */

// El frontend se sirve desde el mismo servidor que la API, por eso la ruta base es relativa.
const API_BASE = "/api";
const CLAVE_SESION = "mesa_soporte_sesion";

const ETIQUETAS_ESTADO = {
  reportado: "Reportado",
  asignado: "Asignado",
  en_reparacion: "En reparación",
  terminado: "Terminado",
  cerrado: "Cerrado",
};
const ETIQUETAS_MOTIVO = {
  resuelto: "Resuelto",
  error: "Caso erróneo",
  duplicado: "Caso duplicado",
};
const ETIQUETAS_ROL = {
  solicitante: "Solicitante",
  tecnico: "Técnico",
  coordinador: "Coordinador",
};
const PAGINAS_POR_ROL = {
  solicitante: "/solicitante",
  tecnico: "/tecnico",
  coordinador: "/coordinador",
};
const NOMBRES_CAMPO = {
  descripcion: "Descripción",
  placa: "Placa",
  telefono: "Teléfono",
  nombre_solicitante: "Nombre",
  area: "Área",
  categoria_id: "Categoría",
  tecnico_id: "Técnico",
  respuesta: "Respuesta",
  observacion: "Observación",
  motivo: "Motivo",
  puntuacion: "Puntuación",
  comentario: "Comentario",
  nombre: "Nombre",
  correo: "Correo",
  password: "Contraseña",
  rol: "Rol",
};

class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

/* ------------------------------------------------------------------ sesión */
const Sesion = {
  guardar(datos) {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
  },
  leer() {
    try {
      return JSON.parse(sessionStorage.getItem(CLAVE_SESION));
    } catch (e) {
      return null;
    }
  },
  cerrar() {
    sessionStorage.removeItem(CLAVE_SESION);
    window.location.href = "/";
  },
};

/* ------------------------------------------------------------------ errores legibles */
function traducirErrorValidacion(e) {
  const clave = e.loc && e.loc.length ? e.loc[e.loc.length - 1] : "";
  const campo = NOMBRES_CAMPO[clave] || clave || "Dato";
  const ctx = e.ctx || {};
  switch (e.type) {
    case "missing":
      return campo + ": es obligatorio";
    case "string_too_short":
      return campo + ": debe tener al menos " + ctx.min_length + " caracteres";
    case "string_too_long":
      return campo + ": no puede superar " + ctx.max_length + " caracteres";
    case "value_error":
      return String(e.msg).replace(/^Value error, /, "");
    default:
      return campo + ": valor no válido";
  }
}

function mensajeDeError(datos, estado) {
  if (datos && typeof datos.detail === "string") return datos.detail;
  if (datos && Array.isArray(datos.detail)) return datos.detail.map(traducirErrorValidacion).join(" · ");
  if (estado === 403) return "No tiene permisos para esta operación";
  if (estado === 404) return "No se encontró lo solicitado";
  return "Ocurrió un error inesperado (código " + estado + ")";
}

/* ------------------------------------------------------------------ petición base */
async function peticion(metodo, ruta, cuerpo) {
  const sesion = Sesion.leer();
  const cabeceras = {};
  if (sesion) cabeceras["Authorization"] = "Bearer " + sesion.token;

  const opciones = { method: metodo, headers: cabeceras };
  if (cuerpo instanceof URLSearchParams) {
    opciones.body = cuerpo;                       // el navegador pone el Content-Type del formulario
  } else if (cuerpo !== undefined) {
    cabeceras["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(API_BASE + ruta, opciones);
  } catch (e) {
    throw new ErrorApi(0, "No se pudo conectar con el servidor");
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (e) {
    datos = null;
  }

  if (respuesta.status === 401 && sesion) {       // token vencido o inválido
    Sesion.cerrar();
    throw new ErrorApi(401, "Su sesión venció. Ingrese de nuevo.");
  }
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, mensajeDeError(datos, respuesta.status));
  return datos;
}

/* ------------------------------------------------------------------ operaciones de la API */
const API = {
  login(correo, clave) {
    return peticion("POST", "/auth/login", new URLSearchParams({ username: correo, password: clave }));
  },
  categorias() {
    return peticion("GET", "/categorias");
  },
  tecnicos() {
    return peticion("GET", "/usuarios/tecnicos");
  },
  usuarios(filtros) {
    const rol = filtros && filtros.rol ? "?rol=" + encodeURIComponent(filtros.rol) : "";
    return peticion("GET", "/usuarios" + rol);
  },
  crearUsuario(datos) {
    return peticion("POST", "/usuarios", datos);
  },
  listar(filtros) {
    const f = filtros || {};
    const q = new URLSearchParams();
    if (f.estado) q.set("estado", f.estado);
    if (f.grupo) q.set("grupo", f.grupo);
    const texto = q.toString();
    return peticion("GET", "/reportes" + (texto ? "?" + texto : ""));
  },
  detalle(id) {
    return peticion("GET", "/reportes/" + id);
  },
  crear(datos) {
    return peticion("POST", "/reportes", datos);
  },
  asignar(id, tecnicoId) {
    return peticion("PATCH", "/reportes/" + id + "/asignar", { tecnico_id: tecnicoId });
  },
  iniciar(id) {
    return peticion("PATCH", "/reportes/" + id + "/iniciar");
  },
  intervenir(id, descripcion) {
    return peticion("POST", "/reportes/" + id + "/intervenciones", { descripcion: descripcion });
  },
  terminar(id, respuesta) {
    return peticion("PATCH", "/reportes/" + id + "/terminar", { respuesta: respuesta });
  },
  cerrar(id, motivo, observacion) {
    return peticion("PATCH", "/reportes/" + id + "/cerrar", { motivo: motivo, observacion: observacion });
  },
  calificar(id, puntuacion, comentario) {
    return peticion("POST", "/reportes/" + id + "/calificacion", { puntuacion: puntuacion, comentario: comentario });
  },
  consolidado() {
    return peticion("GET", "/consolidado");
  },
};
