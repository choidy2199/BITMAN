from pydantic import BaseModel


class MergeJobResponse(BaseModel):
    id: int
    status: str
    output_path: str | None = None
    warnings: list[str] | None = None
    error: str | None = None

    class Config:
        from_attributes = True
