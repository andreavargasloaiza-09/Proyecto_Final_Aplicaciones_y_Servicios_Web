"""
Muestra el contenido de la base de datos (solo lectura; no modifica nada).

Uso (desde la raíz del proyecto):
    python ver_base_datos.py              # todas las tablas
    python ver_base_datos.py reportes     # una sola tabla
"""
import sqlite3
import sys
from pathlib import Path

RUTA_BD = Path(__file__).resolve().parent / "backend" / "mesa_soporte.db"
ORDEN = ["usuarios", "categorias", "reportes", "intervenciones"]
OCULTAR = {"password_hash"}     # nunca se muestra, ni siquiera el hash
ANCHO_MAXIMO = 38


def formatear(valor, columna):
    if columna in OCULTAR:
        return "(oculto)"
    if valor is None:
        return "NULL"
    texto = str(valor).replace("\n", " ")
    return texto if len(texto) <= ANCHO_MAXIMO else texto[: ANCHO_MAXIMO - 3] + "..."


def mostrar_tabla(conexion, tabla):
    cursor = conexion.execute(f'SELECT * FROM "{tabla}"')
    columnas = [d[0] for d in cursor.description]
    filas = [[formatear(v, c) for v, c in zip(fila, columnas)] for fila in cursor.fetchall()]
    anchos = [max([len(c)] + [len(f[i]) for f in filas]) for i, c in enumerate(columnas)]
    print(f"\n=== {tabla} ({len(filas)} filas) ===")
    print(" | ".join(c.ljust(a) for c, a in zip(columnas, anchos)))
    print("-+-".join("-" * a for a in anchos))
    for fila in filas:
        print(" | ".join(v.ljust(a) for v, a in zip(fila, anchos)))


def main():
    if not RUTA_BD.exists():
        sys.exit("No existe backend/mesa_soporte.db. Ejecute primero:  cd backend  ->  python seed.py")
    conexion = sqlite3.connect(RUTA_BD.as_uri() + "?mode=ro", uri=True)    # abierta solo para leer
    existentes = [f[0] for f in conexion.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
    tablas = sorted(existentes, key=lambda t: ORDEN.index(t) if t in ORDEN else len(ORDEN))
    if len(sys.argv) > 1:
        if sys.argv[1] not in existentes:
            sys.exit(f"La tabla '{sys.argv[1]}' no existe. Tablas disponibles: {', '.join(tablas)}")
        tablas = [sys.argv[1]]
    for tabla in tablas:
        mostrar_tabla(conexion, tabla)
    conexion.close()


if __name__ == "__main__":
    main()
