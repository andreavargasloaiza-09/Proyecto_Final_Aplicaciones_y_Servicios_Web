"""Gestión de usuarios por la coordinación (RF-12)."""
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.entities.usuario import Usuario
from src.schemas.usuario import UsuarioCrear
from src.utils.security import hashear_password

MENSAJE_CORREO_REPETIDO = "Ya existe un usuario con ese correo"


def listar_usuarios(db: Session, rol: Optional[str] = None):
    consulta = select(Usuario).order_by(Usuario.rol, Usuario.nombre)
    if rol:
        consulta = consulta.where(Usuario.rol == rol)
    return db.execute(consulta).scalars().all()


def crear_usuario(db: Session, datos: UsuarioCrear) -> Usuario:
    if db.execute(select(Usuario).where(Usuario.correo == datos.correo)).scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail=MENSAJE_CORREO_REPETIDO)
    usuario = Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        rol=datos.rol,
        password_hash=hashear_password(datos.password),   # solo se guarda el hash, nunca la contraseña
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:      # dos solicitudes simultáneas con el mismo correo
        db.rollback()
        raise HTTPException(status_code=409, detail=MENSAJE_CORREO_REPETIDO)
    db.refresh(usuario)
    return usuario
