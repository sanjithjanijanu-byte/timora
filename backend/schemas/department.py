from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str


class DepartmentUpdate(BaseModel):
    name: str | None = None


class DepartmentOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}
