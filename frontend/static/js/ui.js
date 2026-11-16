"use strict";
/*
 * Utilidades de presentación compartidas: escapado de texto, fechas, tablas, detalle del caso,
 * ventana de detalle y avisos. Depende de api.js.
 */

const ETIQUETAS_TIPO_EVENTO = {
  registro: "Reporte",
  asignacion: "Asignación",
  nota: "Intervención",
  estado: "Cambio de estado",
  cierre: "Cierre",
};

/** Escapa texto del usuario antes de insertarlo como HTML (evita inyección de código). */
function esc(valor) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(valor === null || valor === undefined ? "" : valor).replace(/[&<>"']/g, (c) => mapa[c]);
}

function formatearFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function tipoDeCaso(caso) {
  return caso.categoria.tipo === "incidente" ? "Incidente" : "Solicitud";
}

function badgeEstado(estado) {
  return '<span class="badge badge-' + esc(estado) + '">' + esc(ETIQUETAS_ESTADO[estado] || estado) + "</span>";
}

/* ------------------------------------------------------------------ avisos y errores */
let temporizadorAviso = null;
function avisar(mensaje, tipo) {
  const el = document.getElementById("toast");
  el.textContent = mensaje;
  el.className = "toast " + (tipo === "error" ? "toast-error" : "toast-ok");
  el.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => {
    el.hidden = true;
  }, 5000);
}
function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.hidden = false;
}
function ocultar(elemento) {
  elemento.hidden = true;
  elemento.textContent = "";
}

/** Desactiva el botón mientras se ejecuta la tarea (evita enviar dos veces). */
async function ejecutar(boton, tarea) {
  boton.disabled = true;
  try {
    await tarea();
  } finally {
    boton.disabled = false;
  }
}

/* ------------------------------------------------------------------ ventana de detalle */
function abrirDialogo(id) {
  const dialogo = document.getElementById(id);
  if (!dialogo.open) dialogo.showModal();
}
function cerrarDialogo(id) {
  const dialogo = document.getElementById(id);
  if (dialogo.open) dialogo.close();
}

/* ------------------------------------------------------------------ páginas protegidas */
/** Verifica la sesión y el rol. Devuelve la sesión, o null si redirige a otra página. */
function iniciarPagina(rolEsperado) {
  const sesion = Sesion.leer();
  if (!sesion) {
    window.location.href = "/";
    return null;
  }
  if (sesion.usuario.rol !== rolEsperado) {
    window.location.href = PAGINAS_POR_ROL[sesion.usuario.rol] || "/";
    return null;
  }
  document.getElementById("usuario-nombre").textContent = sesion.usuario.nombre;
  document.getElementById("btn-salir").addEventListener("click", () => Sesion.cerrar());
  document.getElementById("btn-volver").addEventListener("click", () => cerrarDialogo("dlg-detalle"));
  return sesion;
}

/* ------------------------------------------------------------------ tabla de casos */
/**
 * opciones: { solicitante: bool, tecnico: bool, extra: (caso) => html de la última columna }
 * Sin "extra", la última columna trae el botón "Ver" (atributo data-ver).
 */
function tablaCasos(casos, opciones) {
  const o = Object.assign({ solicitante: true, tecnico: true, extra: null }, opciones || {});
  if (!casos.length) return '<p class="vacio">No hay casos para mostrar.</p>';

  const filas = casos
    .map((c) => {
      const celdaSolicitante = o.solicitante
        ? "<td>" + esc(c.nombre_solicitante) + "<br><small>" + esc(c.area) + "</small></td>"
        : "";
      const celdaTecnico = o.tecnico
        ? "<td>" + (c.tecnico ? esc(c.tecnico.nombre) : '<span class="tenue">Sin asignar</span>') + "</td>"
        : "";
      const acciones = o.extra
        ? o.extra(c)
        : '<button type="button" class="btn-sec" data-ver="' + esc(c.id) + '">Ver</button>';
      return (
        "<tr>" +
        "<td>#" + esc(c.id) + "</td>" +
        "<td>" + esc(c.categoria.nombre) + "<br><small>" + esc(tipoDeCaso(c)) + "</small></td>" +
        celdaSolicitante +
        celdaTecnico +
        "<td>" + badgeEstado(c.estado) + "</td>" +
        "<td>" + esc(formatearFecha(c.creado_en)) + "</td>" +
        '<td class="acciones">' + acciones + "</td>" +
        "</tr>"
      );
    })
    .join("");

  return (
    '<div class="tabla-scroll"><table><thead><tr>' +
    "<th>N.º</th><th>Categoría</th>" +
    (o.solicitante ? "<th>Solicitante</th>" : "") +
    (o.tecnico ? "<th>Técnico</th>" : "") +
    "<th>Estado</th><th>Reportado</th><th></th>" +
    "</tr></thead><tbody>" + filas + "</tbody></table></div>"
  );
}

/* ------------------------------------------------------------------ detalle del caso */
function renderHistorial(intervenciones) {
  if (!intervenciones.length) return '<p class="vacio">Sin actuaciones registradas.</p>';
  const items = intervenciones
    .map((i) => {
      const cambio =
        i.estado_anterior && i.estado_nuevo
          ? " · " + esc(ETIQUETAS_ESTADO[i.estado_anterior]) + " → " + esc(ETIQUETAS_ESTADO[i.estado_nuevo])
          : "";
      return (
        "<li>" +
        '<div class="cabecera-ev"><span class="tipo-ev">' + esc(ETIQUETAS_TIPO_EVENTO[i.tipo] || i.tipo) + "</span>" +
        cambio + " · " + esc(i.autor.nombre) + " · " + esc(formatearFecha(i.creado_en)) + "</div>" +
        '<div class="texto">' + esc(i.descripcion) + "</div>" +
        "</li>"
      );
    })
    .join("");
  return '<ol class="historial">' + items + "</ol>";
}

/** Información completa de un caso: datos, estado, responsable, resultado e historial. */
function renderDetalle(c) {
  let html =
    '<div class="detalle-grid">' +
    '<div><span class="etq">Estado</span>' + badgeEstado(c.estado) + "</div>" +
    '<div><span class="etq">Tipo y categoría</span>' + esc(tipoDeCaso(c)) + " · " + esc(c.categoria.nombre) + "</div>" +
    '<div><span class="etq">Técnico responsable</span>' +
      (c.tecnico ? esc(c.tecnico.nombre) : '<span class="tenue">Sin asignar</span>') + "</div>" +
    '<div><span class="etq">Solicitante</span>' + esc(c.nombre_solicitante) + " (" + esc(c.area) + ")</div>" +
    '<div><span class="etq">Teléfono</span>' + esc(c.telefono) + "</div>" +
    '<div><span class="etq">Placa del equipo o recurso</span>' + esc(c.placa) + "</div>" +
    '<div><span class="etq">Reportado</span>' + esc(formatearFecha(c.creado_en)) + "</div>" +
    '<div><span class="etq">Última actualización</span>' + esc(formatearFecha(c.actualizado_en)) + "</div>" +
    "</div>" +
    "<h3>Descripción del fallo</h3>" +
    '<p class="texto">' + esc(c.descripcion) + "</p>";

  if (c.respuesta_tecnica) {
    html += "<h3>Respuesta del técnico</h3>" + '<p class="texto">' + esc(c.respuesta_tecnica) + "</p>";
  }
  if (c.estado === "cerrado") {
    html +=
      "<h3>Cierre</h3>" +
      '<p class="texto">' + esc(ETIQUETAS_MOTIVO[c.motivo_cierre] || c.motivo_cierre) +
      " · " + esc(formatearFecha(c.cerrado_en)) + "\n" + esc(c.observacion_cierre) + "</p>";
    if (c.calificacion !== null && c.calificacion !== undefined) {
      html +=
        "<h3>Calificación del solicitante</h3>" +
        '<p class="texto">' + esc(c.calificacion) + " de 5" +
        (c.comentario_calificacion ? "\n" + esc(c.comentario_calificacion) : "") + "</p>";
    }
  }
  html += "<h3>Historial</h3>" + renderHistorial(c.intervenciones);
  return html;
}
