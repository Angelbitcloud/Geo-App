# Geo Processor Monorepo

Monorepo project hosting three coordinated services:
- `python-service`: FastAPI service that calculates centroids and bounds for geographic point collections.
- `nest-api`: NestJS gateway (validation, caching, and proxy to FastAPI).
- `web`: Next.js frontend with Leaflet for visualization.

## Folder Structure

```
geo-processor/
├─ README.md
├─ docker-compose.yml
├─ python-service/
│  ├─ app/
│  │  ├─ __init__.py
│  │  ├─ main.py
│  │  └─ schemas.py
│  ├─ tests/
│  │  └─ test_process.py
│  ├─ pyproject.toml
│  └─ uvicorn.ini
├─ nest-api/
│  ├─ src/
│  │  ├─ main.ts
│  │  ├─ app.module.ts
│  │  └─ geo/
│  │     ├─ geo.controller.ts
│  │     ├─ geo.dto.ts
│  │     └─ geo.service.ts
│  ├─ tsconfig.json
│  ├─ tsconfig.build.json
│  ├─ package.json
│  ├─ jest.config.js
│  └─ test/
│     └─ geo.service.spec.ts
└─ web/
   ├─ app/
   │  ├─ layout.tsx
   │  ├─ page.tsx
   │  └─ globals.css
   ├─ components/
   │  ├─ GeoProcessorApp.tsx
   │  └─ MapView.tsx
   ├─ public/
   │  └─ favicon.ico
   ├─ package.json
   ├─ tsconfig.json
   ├─ next.config.js
   └─ next-env.d.ts
```

## Phase 1: FastAPI Service

### Installation and Local Environment

```bash
cd python-service
python3 -m venv .venv
. .venv/bin/activate
pip install -e .
```

### Run Tests

```bash
cd python-service
. .venv/bin/activate
pytest
```

### Run the Service

```bash
cd python-service
. .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Contract

- **Endpoint**: `POST /process`
- **Input** (`application/json`):

```json
{
  "points": [
    {"lat": 10.0, "lng": 20.0},
    {"lat": -5.0, "lng": 12.5}
  ]
}
```

- **400 Errors**: Clear message when `points` is missing, empty, or contains non-numeric values.

### curl Example

Request:

```bash
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {"lat": 10.0, "lng": 20.0},
      {"lat": -5.0, "lng": 12.5},
      {"lat": 7.5, "lng": -3.5}
    ]
  }'
```

Response:

```json
{
  "centroid": {"lat": 4.1666666667, "lng": 9.6666666667},
  "bounds": {"north": 10.0, "south": -5.0, "east": 20.0, "west": -3.5}
}
```

## Phase 2: NestJS Gateway

### Installation and Local Environment

```bash
cd nest-api
npm install
```

### Environment Variables

- `PYTHON_SERVICE_URL` (default `http://localhost:8000`).
- `NEST_CACHE_TTL` in seconds (default `60`).
- `CORS_ORIGINS` comma-separated list (default `http://localhost:3000`).

### Run in Development

```bash
cd nest-api
npm run start:dev
```

### Build and Run in Local Production

```bash
cd nest-api
npm run build
node dist/main.js
```

### Run Tests

```bash
cd nest-api
npm test
```

### Gateway Contract

- **Endpoint**: `POST /geo/process`
- **Forward**: Proxies body to FastAPI `/process`.
- **200 Code**: Proxies successful response.
- **400 Errors**: FastAPI responses are returned intact.
- **502 Errors**: Network failures or different status codes are reported as `{"statusCode":502,"message":"Upstream error"}`.
- **Cache**: Configurable TTL; `sha256` hash of body as key.

### curl Example

```bash
curl -X POST http://localhost:3001/geo/process \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {"lat": 10.0, "lng": 20.0},
      {"lat": -5.0, "lng": 12.5},
      {"lat": 7.5, "lng": -3.5}
    ]
  }'
```

Expected response:

```json
{
  "centroid": {"lat": 4.1666666667, "lng": 9.6666666667},
  "bounds": {"north": 10.0, "south": -5.0, "east": 20.0, "west": -3.5}
}
```

## Phase 3: Next.js Frontend

### Installation and Local Environment

```bash
cd web
npm install
```

### Environment Variables

- `NEXT_PUBLIC_NEST_API_URL` (default `http://localhost:3001`).

### Run in Development

```bash
cd web
npm run dev
```

### Production Build

```bash
cd web
npm run build
npm start
```

### Usage Flow

1. Start the backend (`python-service` on :8000 and `nest-api` on :3001).
2. Enter a JSON with `points` in the UI (textarea).
3. Press "Process" to call the gateway.
4. Visualize numeric results and map with Leaflet (points, bounding box, centroid).
5. Review the output JSON for debugging or sharing.

## docker-compose

`docker-compose.yml` file ready to launch the entire solution:

```bash
docker compose up --build
```

Exposed services:

- `python-service`: http://localhost:8000
- `nest-api`: http://localhost:3001 (uses internal `python-service`)
- `web`: http://localhost:3000 (consumes NestJS)

Default variables included in `docker-compose.yml`:

- `PYTHON_SERVICE_URL=http://python-service:8000`
- `NEST_CACHE_TTL=60`
- `CORS_ORIGINS=http://localhost:3000`
- `NEXT_PUBLIC_NEST_API_URL=http://localhost:3001`