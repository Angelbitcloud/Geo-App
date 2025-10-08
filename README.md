# Geo Processor Monorepo

Proyecto monorepo que aloja tres servicios coordinados:
- `python-service`: servicio FastAPI que calcula centroides y bounds para colecciones de puntos geográficos.
- `nest-api`: gateway NestJS (validación, caché y proxy hacia FastAPI).
- `web`: frontend Next.js con Leaflet para visualización.

## Estructura de carpetas

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

## Fase 1: Servicio FastAPI

### Instalación y entorno local

```bash
cd /home/luis/geo-processor/python-service
python3 -m venv .venv
. .venv/bin/activate
pip install -e .
```

### Ejecutar tests

```bash
cd /home/luis/geo-processor/python-service
. .venv/bin/activate
pytest
```

### Ejecutar el servicio

```bash
cd /home/luis/geo-processor/python-service
. .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Contrato de la API

- **Endpoint**: `POST /process`
- **Input** (`application/json`):

```
{
  "points": [
    {"lat": 10.0, "lng": 20.0},
    {"lat": -5.0, "lng": 12.5}
  ]
}
```

- **Errores 400**: mensaje claro cuando `points` falta, está vacío o contiene valores no numéricos.

### Ejemplo curl

Solicitud:

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

Respuesta:

```
{
  "centroid": {"lat": 4.1666666667, "lng": 9.6666666667},
  "bounds": {"north": 10.0, "south": -5.0, "east": 20.0, "west": -3.5}
}
```

## Fase 2: Gateway NestJS

### Instalación y entorno local

```bash
cd /home/luis/geo-processor/nest-api
npm install
```

### Variables de entorno

- `PYTHON_SERVICE_URL` (por defecto `http://localhost:8000`).
- `NEST_CACHE_TTL` en segundos (por defecto `60`).
- `CORS_ORIGINS` lista separada por comas (por defecto `http://localhost:3000`).

### Ejecutar en desarrollo

```bash
cd /home/luis/geo-processor/nest-api
npm run start:dev
```

### Construir y ejecutar en producción local

```bash
cd /home/luis/geo-processor/nest-api
npm run build
node dist/main.js
```

### Ejecutar tests

```bash
cd /home/luis/geo-processor/nest-api
npm test
```

### Contrato del gateway

- **Endpoint**: `POST /geo/process`
- **Forward**: proxya cuerpo al FastAPI `/process`.
- **Código 200**: proxy de respuesta exitosa.
- **Errores 400**: respuestas de FastAPI se devuelven intactas.
- **Errores 502**: fallos de red o códigos diferentes se reportan como `{"statusCode":502,"message":"Upstream error"}`.
- **Caché**: TTL configurable; hash `sha256` del body como clave.

### Ejemplo `curl`

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

Respuesta esperada:

```
{
  "centroid": {"lat": 4.1666666667, "lng": 9.6666666667},
  "bounds": {"north": 10.0, "south": -5.0, "east": 20.0, "west": -3.5}
}
```

## Fase 3: Frontend Next.js

### Instalación y entorno local

```bash
cd /home/luis/geo-processor/web
npm install
```

### Variables de entorno

- `NEXT_PUBLIC_NEST_API_URL` (por defecto `http://localhost:3001`).

### Ejecutar en desarrollo

```bash
cd /home/luis/geo-processor/web
npm run dev
```

### Build de producción

```bash
cd /home/luis/geo-processor/web
npm run build
npm start
```

### Flujo de uso

1. Levantar el backend (`python-service` en :8000 y `nest-api` en :3001).
2. Ingresar un JSON con `points` en la UI (textarea).
3. Presionar “Procesar” para llamar al gateway.
4. Visualizar resultados numéricos y mapa con Leaflet (puntos, bounding box, centroid).
5. Revisar el JSON de salida para depurar o compartir.

## docker-compose

Archivo `docker-compose.yml` listo para levantar toda la solución:

```bash
docker compose up --build
```

Servicios expuestos:

- `python-service`: http://localhost:8000
- `nest-api`: http://localhost:3001 (usa `python-service` interno)
- `web`: http://localhost:3000 (consume NestJS)

Variables incluidas por defecto en el `docker-compose.yml`:

- `PYTHON_SERVICE_URL=http://python-service:8000`
- `NEST_CACHE_TTL=60`
- `CORS_ORIGINS=http://localhost:3000`
- `NEXT_PUBLIC_NEST_API_URL=http://localhost:3001`

## Próximos pasos

- [ ] Documentar snapshots/screenshots opcionales.

Este README se irá actualizando conforme avancemos en las siguientes tareas.

