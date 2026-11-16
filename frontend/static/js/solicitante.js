"use strict";
/*
 * Pantalla del solicitante:
 *   - reportar un caso (CA-01, HU-02)
 *   - consultar sus casos: estado, responsable, resultado e historial (CA-03, CA-04, CA-05)
 *   - calificar la atención cuando el caso está cerrado (RF-11)
 */

(async function () {
  const sesion = iniciarPagina("solicitante");
  if (!sesion) return;

  const form = document.getElementById("form-reporte");
  const errorForm = document.getElementById("reporte-error");
  const contenedorLista = document.getElementById("lista-casos");
  const filtro = document.getElementById("filtro-grupo");
  const titulo = document.getElementById("dlg-titulo");
  const cuerpo = document.getElementById("dlg-cuerpo");

  /* ---------------------------------------------------------- categorías */
  async function cargarCategorias() {
    const categorias = await API.categorias();
    const grupos = { incidente: [], solicitud: [] };
    categorias.forEach((c) => grupos[c.tipo].push(c));
    const etiquetas = [["incidente", "Incidentes"], ["solicitud", "Solicitudes"]];
    document.getElementById("categoria").innerHTML =
      '<option value="">Seleccione…</option>' +
      etiquetas
        .map(
          ([tipo, rotulo]) =>
            '<optgroup label="' + rotulo + '">' +
            grupos[tipo].map((c) => '<option value="' + esc(c.id) + '">' + esc(c.nombre) + "</option>").join("") +
            "</optgroup>"
        )
        .join("");
  }

  /* ---------------------------------------------------------- validación del formulario (RNF-03) */
  function validar(d) {
    const errores = [];
    if (!d.categoria_id) errores.push("Seleccione una categoría.");
    if (d.descripcion.length < 5) errores.push("La descripción debe tener al menos 5 caracteres.");
    if (!d.placa) errores.push("Indique la placa del equipo o recurso.");
    if (d.nombre_solicitante.length < 2) errores.push("Indique su nombre.");
    if (d.area.length < 2) errores.push("Indique su área.");
    if (!/^\+?\d{7,15}$/.test(d.telefono.replace(/[\s-]/g, ""))) {
      errores.push("El teléfono debe tener entre 7 y 15 dígitos.");
    }
    return errores;
  }

  function limpiarFormulario() {
    form.reset();
    document.getElementById("nombre").value = sesion.usuario.nombre;
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    ocultar(errorForm);
    const datos = {
      categoria_id: Number(document.getElementById("categoria").value),
      descripcion: document.getElementById("descripcion").value.trim(),
      placa: document.getElementById("placa").value.trim(),
      nombre_solicitante: document.getElementById("nombre").value.trim(),
      area: document.getElementById("area").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
    };
    const errores = validar(datos);
    if (errores.length) {
      mostrarError(errorForm, errores.join(" "));
      return;
    }
    await ejecutar(form.querySelector("button[type=submit]"), async () => {
      try {
        const caso = await API.crear(datos);
        avisar("Caso #" + caso.id + " registrado correctamente.");
        limpiarFormulario();
        await cargarLista();
        mostrarDetalle(caso);
      } catch (e) {
        mostrarError(errorForm, e.message);
      }
    });
  });

  /* ---------------------------------------------------------- lista de casos */
  async function cargarLista() {
    try {
      const casos = await API.listar({ grupo: filtro.value });
      contenedorLista.innerHTML = tablaCasos(casos, { solicitante: false });
    } catch (e) {
      contenedorLista.innerHTML = '<p class="error">' + esc(e.message) + "</p>";
    }
  }

  filtro.addEventListener("change", cargarLista);
  document.getElementById("btn-actualizar").addEventListener("click", cargarLista);

  document.addEventListener("click", async (ev) => {
    const boton = ev.target.closest("[data-ver]");
    if (!boton) return;
    try {
      mostrarDetalle(await API.detalle(boton.dataset.ver));
    } catch (e) {
      avisar(e.message, "error");
    }
  });

  /* ---------------------------------------------------------- detalle y calificación */
  function formularioCalificacion() {
    return (
      '<form id="form-calificar" class="bloque" novalidate>' +
      "<h3>Califique la atención recibida</h3>" +
      '<label for="puntuacion">Puntuación</label>' +
      '<select id="puntuacion">' +
      '<option value="5">5 · Excelente</option><option value="4">4 · Buena</option>' +
      '<option value="3">3 · Regular</option><option value="2">2 · Mala</option>' +
      '<option value="1">1 · Muy mala</option></select>' +
      '<label for="comentario-cal">Comentario (opcional)</label>' +
      '<textarea id="comentario-cal" rows="2" maxlength="500"></textarea>' +
      '<p id="cal-error" class="error" hidden></p>' +
      '<button type="submit">Enviar calificación</button>' +
      "</form>"
    );
  }

  function mostrarDetalle(caso) {
    titulo.textContent = "Caso #" + caso.id;
    let html = renderDetalle(caso);
    if (caso.estado === "cerrado" && (caso.calificacion === null || caso.calificacion === undefined)) {
      html += formularioCalificacion();
    }
    cuerpo.innerHTML = html;
    const formCal = document.getElementById("form-calificar");
    if (formCal) formCal.addEventListener("submit", (ev) => enviarCalificacion(ev, caso.id));
    abrirDialogo("dlg-detalle");
  }

  async function enviarCalificacion(ev, id) {
    ev.preventDefault();
    const errorEl = document.getElementById("cal-error");
    ocultar(errorEl);
    const puntuacion = Number(document.getElementById("puntuacion").value);
    const comentario = document.getElementById("comentario-cal").value.trim();
    await ejecutar(ev.target.querySelector("button[type=submit]"), async () => {
      try {
        const caso = await API.calificar(id, puntuacion, comentario || null);
        avisar("¡Gracias por su calificación!");
        mostrarDetalle(caso);
      } catch (e) {
        mostrarError(errorEl, e.message);
      }
    });
  }

  /* ---------------------------------------------------------- arranque */
  document.getElementById("nombre").value = sesion.usuario.nombre;
  try {
    await cargarCategorias();
  } catch (e) {
    mostrarError(errorForm, "No se pudieron cargar las categorías: " + e.message);
  }
  await cargarLista();
})();
