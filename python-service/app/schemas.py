from pydantic import BaseModel, Field, field_validator
from typing import List

class Point(BaseModel):
    lat: float = Field(..., description="Latitude in decimal degrees")
    lng: float = Field(..., description="Longitude in decimal degrees")

class PointsRequest(BaseModel):
    points: List[Point] = Field(..., min_length=1, description="Non-empty list of points")

    @field_validator("points")
    @classmethod
    def validate_points_non_empty(cls, v: List[Point]):
        if not isinstance(v, list) or len(v) == 0:
            raise ValueError("points must be a non-empty array of {lat,lng}.")
        return v

class Bounds(BaseModel):
    north: float
    south: float
    east: float
    west: float

class Centroid(BaseModel):
    lat: float
    lng: float

class PointsResponse(BaseModel):
    centroid: Centroid
    bounds: Bounds
