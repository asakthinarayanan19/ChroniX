from pydantic import BaseModel
from typing import List

class Evidence(BaseModel):
    source: str
    type: str
    content: str

class TimelineEvent(BaseModel):
    time: str
    event: str
    source: str
    classification: str
