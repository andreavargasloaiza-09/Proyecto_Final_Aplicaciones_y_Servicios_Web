"use strict";
/*
 * Pantalla del técnico: atiende los casos que le asignaron (CA-02, CA-04).
 * Iniciar reparación, registrar intervenciones y terminar con su respuesta. El cierre lo hace la coordinación.
 */

(async function () {
  const sesion = iniciarPagina("tecnico");
  if (!sesion) return;

  const contenedorLista = document.getElementById("lista-casos");
  const filtro = document.getElementById("filtro-estado");
  const titulo = document.getElementById("dlg-titulo");
  const cuerpo = document.getElementById("dlg-cuerpo");

  /* ---------------------------------------------------------- lista */
  async function cargarLista() {
    try {
      const casos = await API.listar({ estado: filtro.value });
      contenedorLista.innerHTML = tablaCasos(casos, { tecnico: false });
    } catch (e) {
      contenedorLista.innerHTML = '<p class="error">' + esc(e.message) + "</p>";
    }
  }
  filtro.addEventListener("change", cargarLista);
  document.getElementById("btn-actualizar").addEventListener("click", cargarLista);

  document.addEventListener("click", (ev) => {
    const boton = ev.target.closest("[data-ver]");
    if (boton) abrirCaso(boton.dataset.ver);
  });

  async function abrirCaso(id) {
    try {
      mostrarDetalle(await API.detalle(id));
    } catch (e) {
      avisar(e.message, "error");
    }
  }

  /* ---------------------------------------------------------- acciones según el estado */
  function panelAcciones(caso) {
    if (caso.estado === "cerrado") {
      return '<p class="aviso">Este caso está cerrado: no admite más cambios ni intervenciones.</p>';
    }
    let html = "<h3>Acciones</h3>";

    if (caso.estado === "asignado") {
      html += '<div class="bloque"><button type="button" id="btn-iniciar">Iniciar reparación</button></div>';
    }

    html +=
      '<form id="form-intervencion" class="bloque" novalidate>' +
      '<label for="texto-intervencion">Registrar una intervención</label>' +
      '<textarea id="texto-intervencion" rows="3" maxlength="2000" placeholder="¿Qué hizo sobre este caso?"></textarea>' +
      '<button type="submit">Agregar al historial</button></form>';

    if (caso.estado === "en_reparacion") {
      html +=
        '<form id="form-terminar" class="bloque" novalidate>' +
        '<label for="texto-respuesta">Respuesta para el solicitante</label>' +
        '<textarea id="texto-respuesta" rows="3" maxlength="2000" placeholder="Resultado de la atención"></textarea>' +
        '<button type="submit">Marcar como terminado</button></form>';
    }

    if (caso.estado === "terminado") {
      html += '<p class="aviso">Terminó este caso. Queda pendiente de cierre por la coordinación.</p>';
    }
    return html;
  }

  function mostrarDetalle(caso) {
    titulo.textContent = "Caso #" + caso.id;
    cuerpo.innerHTML = renderDetalle(caso) + panelAcciones(caso);
    enlazarAcciones(caso);
    abrirDialogo("dlg-detalle");
  }

  /** Ejecuta una acción, vuelve a leer el caso y refresca el detalle y la lista. */
  async function accion(boton, id, tarea, mensajeOk) {
    await ejecutar(boton, async () => {
      try {
        await tarea();
        avisar(mensajeOk);
        mostrarDetalle(await API.detalle(id));
        await cargarLista();
      } catch (e) {
        avisar(e.message, "error");
      }
    });
  }

  function enlazarAcciones(caso) {
    const btnIniciar = document.getElementById("btn-iniciar");
    if (btnIniciar) {
      btnIniciar.addEventListener("click", () =>
        accion(btnIniciar, caso.id, () => API.iniciar(caso.id), "Reparación iniciada.")
      );
    }

    const formInterv = document.getElementById("form-intervencion");
    if (formInterv) {
      formInterv.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const texto = document.getElementById("texto-intervencion").value.trim();
        if (texto.length < 3) return avisar("Describa la intervención (mínimo 3 caracteres).", "error");
        accion(formInterv.querySelector("button"), caso.id, () => API.intervenir(caso.id, texto), "Intervención registrada.");
      });
    }

    const formTerminar = document.getElementById("form-terminar");
    if (formTerminar) {
      formTerminar.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const texto = document.getElementById("texto-respuesta").value.trim();
        if (texto.length < 5) return avisar("Escriba la respuesta para el solicitante (mínimo 5 caracteres).", "error");
        accion(formTerminar.querySelector("button"), caso.id, () => API.terminar(caso.id, texto), "Caso marcado como terminado.");
      });
    }

  }

  await cargarLista();
})();
