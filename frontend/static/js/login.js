"use strict";
/* Pantalla de ingreso: valida credenciales contra la API y redirige según el rol (HU-01). */

(function () {
  const sesionActiva = Sesion.leer();
  if (sesionActiva) {
    window.location.href = PAGINAS_POR_ROL[sesionActiva.usuario.rol] || "/";
    return;
  }

  const form = document.getElementById("form-login");
  const error = document.getElementById("login-error");
  const boton = document.getElementById("btn-login");

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    ocultar(error);
    const correo = document.getElementById("correo").value.trim();
    const clave = document.getElementById("clave").value;
    if (!correo || !clave) {
      mostrarError(error, "Escriba su correo y su contraseña.");
      return;
    }
    await ejecutar(boton, async () => {
      try {
        const datos = await API.login(correo, clave);
        Sesion.guardar({ token: datos.access_token, usuario: datos.usuario, scopes: datos.scopes });
        window.location.href = PAGINAS_POR_ROL[datos.usuario.rol] || "/";
      } catch (e) {
        mostrarError(error, e.message);
      }
    });
  });
})();
