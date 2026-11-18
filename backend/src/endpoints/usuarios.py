"""Gestión de usuarios: solo la coordinación puede listarlos y crear técnicos y solicitantes (RF-12)."""
from typing import Optional

from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session

from src.database.connection import get_db
from src.schemas.base import RolUsuario
from src.schemas.usuario import UsuarioCrear, UsuarioSalida
from src.services import usuarios as servicios
from src.utils.security import Sesion, obtener_sesion

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UsuarioSalida], summary="Listar usuarios (solo coordinación)")
def listar(rol: Optional[RolUsuario] = None, db: Session = Depends(get_db),
           sesion: Sesion = Security(obtener_sesion, scopes=["usuarios:listar"])):
    return servicios.listar_usuarios(db, rol)


@router.post("", response_model=UsuarioSalida, status_code=201,
             summary="Crear un técnico o un solicitante (solo coordinación)")
def crear(datos: UsuarioCrear, db: Session = Depends(get_db),
          sesion: Sesion = Security(obtener_sesion, scopes=["usuarios:crear"])):
    return servicios.crear_usuario(db, datos)
