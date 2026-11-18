"""Esquemas de usuario y de inicio de sesión."""
import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from src.schemas.base import SalidaBase


class UsuarioCrear(BaseModel):
    """RF-12: la coordinación crea técnicos y solicitantes. El rol coordinador NO se puede crear por la API.

    No hereda de EntradaBase a propósito: la contraseña no se recorta (se guarda exactamente como se escribe).
    """

    nombre: str = Field(min_length=2, max_length=120)
    correo: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=72, description="Contraseña inicial del usuario")
    rol: Literal["solicitante", "tecnico"]

    @field_validator("nombre", "correo", mode="before")
    @classmethod
    def recortar(cls, valor):
        return valor.strip() if isinstance(valor, str) else valor

    @field_validator("correo")
    @classmethod
    def validar_correo(cls, valor: str) -> str:
        valor = valor.lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", valor):
            raise ValueError("El correo no tiene un formato válido")
        return valor


class UsuarioSalida(SalidaBase):
    id: int
    nombre: str
    correo: str
    rol: str


class TokenSalida(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSalida
    scopes: list[str]
