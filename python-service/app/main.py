from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from .schemas import PointsRequest, PointsResponse, Bounds, Centroid

app = FastAPI(
    title="Geo Processor",
    version="1.0.0",
    description="Stateless processor for lat/lng arrays: bounds + centroid",
)

# CORS (permitir a Nest/Next en desarrollo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# Mapear errores de validación (422) a 400 con mensaje claro (requisito del contrato)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    # Mensaje genérico y claro según requisitos
    return JSONResponse(status_code=400, content={"detail": "points must be a non-empty array of {lat,lng}."})

@app.exception_handler(ValueError)
async def value_error_handler(_, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})

@app.post(
    "/process",
    response_model=PointsResponse,
    responses={
        400: {
            "description": "Bad Request",
            "content": {"application/json": {"example": {"detail": "points must be a non-empty array of {lat,lng}."}}},
        }
    },
)
def process_points(payload: PointsRequest):
    pts = payload.points

    lats = [p.lat for p in pts]
    lngs = [p.lng for p in pts]

    # Chequeo defensivo adicional (aunque Pydantic ya tipa)
    if any(v is None for v in lats + lngs):
        raise HTTPException(status_code=400, detail="All points must include numeric lat and lng.")

    bounds = Bounds(
        north=max(lats),
        south=min(lats),
        east=max(lngs),
        west=min(lngs),
    )
    centroid = Centroid(
        lat=sum(lats) / len(lats),
        lng=sum(lngs) / len(lngs),
    )
    return PointsResponse(centroid=centroid, bounds=bounds)
