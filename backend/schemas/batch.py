from pydantic import BaseModel


class BatchCreate(BaseModel):
    section_id: int
    name: str
    size: int


class BatchUpdate(BaseModel):
    section_id: int | None = None
    name: str | None = None
    size: int | None = None


class BatchOut(BaseModel):
    id: int
    section_id: int
    section_name: str | None = None
    class_name: str | None = None
    name: str
    size: int

    model_config = {"from_attributes": True}


class AutoBatchRequest(BaseModel):
    """Request to automatically divide a section into batches."""
    section_id: int
    max_batch_size: int = 35
