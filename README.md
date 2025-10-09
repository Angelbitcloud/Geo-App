# Geo Processor Monorepo

Monorepo project hosting three coordinated services:
- `python-service`: FastAPI service that calculates centroids and bounds for geographic point collections.
- `nest-api`: NestJS gateway (validation, caching, and proxy to FastAPI).
- `web`: Next.js frontend with Leaflet for visualization and dual input modes.

## ✨ Key Features

### 🎨 Dual Input Modes
- **JSON Mode**: Advanced textarea for developers to paste JSON directly
- **Form Mode**: User-friendly interface with individual lat/lng input fields

### 🗺️ Interactive Visualization
- Real-time Leaflet map with points, centroid marker, and bounding box
- Integrated results display below the map
- Responsive design for desktop and mobile

### ✅ Comprehensive Validation
- Real-time client-side validation with inline error messages
- Range validation (lat: -90 to 90, lng: -180 to 180)
- Type validation and error prevention

### 📊 Point Management
- Add, edit, and delete individual points
- Bulk operations (select multiple, delete selected, clear all)
- Interactive table with visual feedback
- Maximum 1000 points limit

### 🎯 Professional UI/UX
- Dark theme with gradient buttons
- Bordered result cards with 2x2 grid layout
- Smooth animations and transitions
- Accessibility-focused design

## Folder Structure

```
geo-processor/
├─ README.md
├─ docker-compose.yml
├─ scripts/
│  ├─ test.bat
│  ├─ test-coverage.bat
│  └─ test-watch.bat
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
   │  ├─ MapView.tsx
   │  └─ PointInputForm.tsx
   ├─ __tests__/
   │  ├─ GeoProcessorApp.test.tsx
   │  └─ PointInputForm.test.tsx
   ├─ public/
   │  └─ favicon.ico
   ├─ package.json
   ├─ tsconfig.json
   ├─ next.config.js
   ├─ next-env.d.ts
   ├─ jest.config.js
   ├─ jest.setup.js
   └─ Dockerfile.test
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

### 🎨 Frontend Features

#### **Dual Input Modes**

The frontend offers two ways to input geographic points:

##### 1. JSON Mode (Left Card)
- **Target Users**: Developers and advanced users
- **Features**:
  - Direct JSON textarea input
  - Fast bulk point entry
  - Syntax validation
  - Example JSON provided
- **Format**:
  ```json
  {
    "points": [
      {"lat": 19.4326, "lng": -99.1332},
      {"lat": 40.7128, "lng": -74.0060},
      {"lat": 35.6895, "lng": 139.6917}
    ]
  }
  ```

##### 2. Form Mode (Right Card)
- **Target Users**: Regular users
- **Features**:
  - Individual latitude/longitude input fields
  - Real-time validation with inline error messages
  - Interactive points table with edit/delete actions
  - Bulk operations (select, delete selected, clear all)
  - Visual feedback and error prevention
  - Maximum 1000 points limit
- **Validation Rules**:
  - Latitude: -90 to 90 (numeric)
  - Longitude: -180 to 180 (numeric)
  - 6 decimal precision
  - Required fields

#### **Point Management Table**

When using Form Mode, points are displayed in an interactive table:

| Feature | Description |
|---------|-------------|
| **Checkboxes** | Select individual or all points |
| **Edit** | Click ✏️ to modify point coordinates |
| **Delete** | Click 🗑️ to remove individual points |
| **Bulk Delete** | Delete multiple selected points at once |
| **Clear All** | Remove all points with confirmation |
| **Visual Feedback** | Row highlighting on hover and during edit |

#### **Map Visualization**

After processing points, the map displays:

- **Interactive Leaflet Map**: Pan, zoom, and explore
- **Point Markers**: Blue circles for each coordinate
- **Centroid Marker**: Red marker showing the calculated center
- **Bounding Box**: Rectangle showing the geographic bounds
- **Popups**: Click markers to see exact coordinates

#### **Results Display**

Results are integrated below the map in a clean, bordered layout:

```
┌─────────────────────────────────────────┐
│              Map Card                    │
├─────────────────────────────────────────┤
│         [Interactive Map]                │
├─────────────────────────────────────────┤
│   ┌─────────────┐    ┌──────────────┐  │
│   │  CENTROID   │    │    BOUNDS    │  │
│   ├─────────────┤    ├──────┬───────┤  │
│   │    LAT:     │    │NORTH │ SOUTH │  │
│   │  40.712800  │    ├──────┼───────┤  │
│   ├─────────────┤    │ EAST │ WEST  │  │
│   │    LNG:     │    └──────┴───────┘  │
│   │ -74.006000  │                       │
│   └─────────────┘                       │
└─────────────────────────────────────────┘
```

**Features**:
- Centered layout with 2x2 grid for bounds
- 3px borders with consistent styling
- Large, monospace values for precision
- Uppercase labels for clarity
- Responsive design (stacks on mobile)

#### **Output JSON**

A separate card displays:
- Full JSON response from the API
- Formatted summary text
- Read-only textareas for easy copying

### Usage Flow

#### **Option 1: JSON Mode**
1. Start the backend (`python-service` on :8000 and `nest-api` on :3001)
2. Paste JSON with `points` in the textarea (left card)
3. Click "Process" to call the gateway
4. View results: map with visualization and numeric data below
5. Review the output JSON for debugging or sharing

#### **Option 2: Form Mode**
1. Start the backend services
2. Enter latitude and longitude in the input fields (right card)
3. Click "Add Point" to add to the table
4. Repeat to add multiple points
5. Edit or delete points as needed using table actions
6. Click "Calculate (X points)" to process
7. View results: map with visualization and numeric data below
8. Review the output JSON for debugging or sharing

### 🎨 UI/UX Highlights

- **Dark Theme**: Professional dark color scheme
- **Gradient Buttons**: Eye-catching cyan-purple-pink gradients
- **Responsive Layout**: 2-column grid on desktop, single column on mobile
- **Smooth Animations**: Hover effects and transitions
- **Error Handling**: Clear, actionable error messages
- **Loading States**: Visual feedback during API calls
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Confirmation Dialogs**: Prevent accidental data loss

### 🔧 Technical Details

**Components**:
- `GeoProcessorApp.tsx`: Main application logic and state management
- `MapView.tsx`: Leaflet map integration with React
- `PointInputForm.tsx`: User-friendly point input interface

**State Management**:
- React hooks (useState, useCallback, useMemo)
- Shared processing logic between input modes
- Optimized re-renders with memoization

**Styling**:
- CSS modules with global styles
- Flexbox and Grid layouts
- Media queries for responsiveness
- CSS variables for theming

### 🧪 Testing

The frontend includes comprehensive unit tests using Jest and React Testing Library.

#### **Test Coverage**

- **GeoProcessorApp**: Main application logic, API integration, error handling
- **MapView**: Map rendering, markers, bounds, and popups
- **PointInputForm**: Form validation, point management, bulk operations

#### **Running Tests with Docker**

Tests run in an isolated Docker container with all dependencies:

```bash
# Run all tests
docker-compose --profile test run --rm web-test npm test

# Run tests with coverage
docker-compose --profile test run --rm web-test npm run test:coverage

# Run tests in watch mode (for development)
docker-compose --profile test run --rm web-test npm run test:watch
```

#### **Using Test Scripts (Windows)**

Convenient batch scripts are provided in the `scripts/` directory:

```bash
# Run all tests
.\scripts\test.bat

# Run with coverage
.\scripts\test-coverage.bat

# Run in watch mode
.\scripts\test-watch.bat
```

#### **Test Configuration**

- **Jest Config**: `web/jest.config.js`
- **Setup File**: `web/jest.setup.js`
- **Test Files**: `web/__tests__/*.test.tsx`

#### **What's Tested**

✅ **Component Rendering**
- Initial state and UI elements
- Conditional rendering based on state
- Dynamic content updates

✅ **User Interactions**
- Form submissions and validations
- Button clicks and input changes
- Point management (add, edit, delete)
- Bulk operations (select all, delete selected)

✅ **API Integration**
- Successful API calls and responses
- Error handling and error messages
- Loading states

✅ **Map Functionality**
- Map rendering with points
- Centroid and bounds display
- Marker popups and interactions

✅ **Edge Cases**
- Empty states
- Invalid inputs
- Network failures
- Maximum limits (1000 points)

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