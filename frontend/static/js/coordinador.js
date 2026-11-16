"use strict";
/*
 * Pantalla de coordinación:
 *   - asignar técnico a los casos reportados (CA-02, HU-03)
 *   - revisar los casos terminados por el técnico y cerrarlos (RN-03, RN-05, HU-07)
 *   - ver todos los casos con su estado y responsable (CA-03)
 *   - consolidado de casos abiertos y cerrados (CA-06, HU-06)
 */

(async function () {
  const sesion = iniciarPagina("coordinador");
  if (!sesion) return;

  const PANELES = ["por-asignar", "por-cerrar", "todos", "consolidado"];
  const listaPorAsignar = document.getElementById("lista-por-asignar");
  const listaPorCerrar = document.getElementById("lista-por-cerrar");
  const listaTodos = document.getElementById("lista-todos");
  const filtroEstado = document.getElementById("filtro-estado");
  const titulo = document.getElementById("dlg-titulo");
  const cuerpo = document.getElementById("dlg-cuerpo");
  const pestanas = document.querySelectorAll(".tab");
  let tecnicos = [];
  let pestanaActual = "por-asignar";

  /* ---------------------------------------------------------- pestañas */
  function activarPestana(nombre) {
    pestanaActual = nombre;
    pestanas.forEach((t) => t.classList.toggle("activa", t.dataset.tab === nombre));
    PANELES.forEach((p) => {
      document.getElementById("panel-" + p).hidden = p !== nombre;
    });
    return cargarPestana();
  }
  pestanas.forEach((t) => t.addEventListener("click", () => activarPestana(t.dataset.tab)));
  document.getElementById("btn-actualizar").addEventListener("click", () => cargarPestana());
  filtroEstado.addEventListener("change", () => cargarPestana());

  function cargarPestana() {
    if (pestanaActual === "por-asignar") return cargarPorAsignar();
    if (pestanaActual === "por-cerrar") return cargarPorCerrar();
    if (pestanaActual === "todos") return cargarTodos();
    return cargarConsolidado();
  }

  /* ---------------------------------------------------------- por asignar */
  function accionesAsignar(caso) {
    const opciones = tecnicos.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.nombre) + "</option>").join("");
    return (
      '<select data-tecnico-de="' + esc(caso.id) + '" aria-label="Técnico para el caso ' + esc(caso.id) + '">' +
      '<option value="">Técnico…</option>' + opciones + "</select>" +
      '<button type="button" data-asignar="' + esc(caso.id) + '">Asignar</button>' +
      '<button type="button" class="btn-sec" data-ver="' + esc(caso.id) + '">Ver</button>'
    );
  }

  async function cargarPorAsignar() {
    try {
      const casos = await API.listar({ estado: "reportado" });
      listaPorAsignar.innerHTML = tablaCasos(casos, { tecnico: false, extra: accionesAsignar });
    } catch (e) {
      listaPorAsignar.innerHTML = '<p class="error">' + esc(e.message) + "</p>";
    }
  }

  async function asignar(id, boton) {
    const select = document.querySelector('[data-tecnico-de="' + id + '"]');
    if (!select || !select.value) return avisar("Seleccione un técnico para el caso #" + id + ".", "error");
    await ejecutar(boton, async () => {
      try {
        const caso = await API.asignar(id, Number(select.value));
        avisar("Caso #" + caso.id + " asignado a " + caso.tecnico.nombre + ".");
        await cargarPorAsignar();
      } catch (e) {
        avisar(e.message, "error");
      }
    });
  }

  /* ---------------------------------------------------------- por cerrar (HU-07) */
  async function cargarPorCerrar() {
    try {
      const casos = await API.listar({ estado: "terminado" });
      listaPorCerrar.innerHTML = tablaCasos(casos, {
        extra: (c) => '<button type="button" data-ver="' + esc(c.id) + '">Revisar y cerrar</button>',
      });
    } catch (e) {
      listaPorCerrar.innerHTML = '<p class="error">' + esc(e.message) + "</p>";
    }
  }

  /** Formulario de cierre. "Resuelto" solo aplica a casos terminados; error y duplicado, a cualquier caso abierto. */
  function formularioCierre(caso) {
    if (caso.estado === "cerrado") return "";
    const terminado = caso.estado === "terminado";
    const motivos = terminado ? ["resuelto", "error", "duplicado"] : ["error", "duplicado"];
    return (
      '<form id="form-cerrar" class="bloque" novalidate>' +
      "<h3>" + (terminado ? "Cerrar el caso" : "Cerrar sin resolución (caso erróneo o duplicado)") + "</h3>" +
      '<label for="motivo-cierre">Motivo</label>' +
      '<select id="motivo-cierre">' +
      motivos.map((m) => '<option value="' + m + '">' + esc(ETIQUETAS_MOTIVO[m]) + "</option>").join("") +
      "</select>" +
      '<label for="obs-cierre">Observación final</label>' +
      '<textarea id="obs-cierre" rows="2" maxlength="1000"></textarea>' +
      '<button type="submit" class="btn-peligro">Cerrar caso</button></form>'
    );
  }

  function enlazarCierre(caso) {
    const form = document.getElementById("form-cerrar");
    if (!form) return;
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const motivo = document.getElementById("motivo-cierre").value;
      const observacion = document.getElementById("obs-cierre").value.trim();
      if (observacion.length < 3) return avisar("Escriba la observación final (mínimo 3 caracteres).", "error");
      if (!window.confirm("Un caso cerrado no se puede reabrir ni modificar. ¿Desea cerrarlo?")) return;
      await ejecutar(form.querySelector("button[type=submit]"), async () => {
        try {
          await API.cerrar(caso.id, motivo, observacion);
          avisar("Caso #" + caso.id + " cerrado.");
          mostrarDetalle(await API.detalle(caso.id));
          await cargarPestana();
        } catch (e) {
          avisar(e.message, "error");
        }
      });
    });
  }

  function mostrarDetalle(caso) {
    titulo.textContent = "Caso #" + caso.id;
    cuerpo.innerHTML = renderDetalle(caso) + formularioCierre(caso);
    enlazarCierre(caso);
    abrirDialogo("dlg-detalle");
  }

  /* ---------------------------------------------------------- todos los casos */
  async function cargarTodos() {
    try {
      const casos = await API.listar({ estado: filtroEstado.value });
      listaTodos.innerHTML = tablaCasos(casos);
    } catch (e) {
      listaTodos.innerHTML = '<p class="error">' + esc(e.message) + "</p>";
    }
  }

  /* ---------------------------------------------------------- consolidado */
  async function cargarConsolidado() {
    try {
      const d = await API.consolidado();
      const porEstado = Object.keys(d.por_estado)
        .map(
          (estado) =>
            '<div class="metrica"><span class="num">' + esc(d.por_estado[estado]) + "</span><small>" +
            esc(ETIQUETAS_ESTADO[estado] || estado) + "</small></div>"
        )
        .join("");
      document.getElementById("resumen").innerHTML =
        '<div class="metrica"><span class="num">' + esc(d.total) + "</span><small>Total de casos</small></div>" +
        '<div class="metrica"><span class="num">' + esc(d.abiertos) + "</span><small>Abiertos</small></div>" +
        '<div class="metrica"><span class="num">' + esc(d.cerrados) + "</span><small>Cerrados</small></div>" +
        porEstado;
      document.getElementById("tabla-abiertos").innerHTML = tablaCasos(d.casos_abiertos);
      document.getElementById("tabla-cerrados").innerHTML = tablaCasos(d.casos_cerrados);
    } catch (e) {
      document.getElementById("resumen").innerHTML = '<p class="error">' + esc(e.message) + "</p>";
    }
  }

  /* ---------------------------------------------------------- clics de la página */
  document.addEventListener("click", async (ev) => {
    const botonAsignar = ev.target.closest("[data-asignar]");
    if (botonAsignar) return asignar(botonAsignar.dataset.asignar, botonAsignar);

    const botonVer = ev.target.closest("[data-ver]");
    if (botonVer) {
      try {
        mostrarDetalle(await API.detalle(botonVer.dataset.ver));
      } catch (e) {
        avisar(e.message, "error");
      }
    }
  });

  /* ---------------------------------------------------------- arranque */
  try {
    tecnicos = await API.tecnicos();
  } catch (e) {
    avisar("No se pudo cargar la lista de técnicos: " + e.message, "error");
  }
  await cargarPorAsignar();
})();
