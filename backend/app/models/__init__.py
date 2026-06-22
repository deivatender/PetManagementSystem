"""ORM model package.

Importing the models here ensures they are registered on ``Base.metadata`` as
soon as ``app.models`` is imported — which is what Alembic's autogenerate and
``Base.metadata.create_all`` rely on.
"""

from app.models.owner import Owner
from app.models.pet import Gender, Pet, PetStatus, Species

__all__ = [
    "Owner",
    "Pet",
    "Species",
    "Gender",
    "PetStatus",
]
