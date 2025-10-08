"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapViewProps } from "./MapView";

interface ApiResponse extends MapViewProps {}

interface FormState {
  rawPoints: string;
  loading: boolean;
  error: string | null;
  result: ApiResponse | null;
}

const MapView = dynamic(() => import("./MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <div className="map-container">Loading map...</div>,
});

const DEFAULT_EXAMPLE = JSON.stringify(
  {
    points: [
      { lat: 19.4326, lng: -99.1332 },
      { lat: 40.7128, lng: -74.006 },
      { lat: 35.6895, lng: 139.6917 },
    ],
  },
  null,
  2,
);

const API_URL = process.env.NEXT_PUBLIC_NEST_API_URL ?? "http://localhost:3001";

function parsePoints(input: string) {
  try {
    const parsed = JSON.parse(input);
    if (!parsed || !Array.isArray(parsed.points)) {
      throw new Error();
    }
    return parsed.points;
  } catch {
    return null;
  }
}

function centroidToText(result: ApiResponse | null): string {
  if (!result) return "";
  const { centroid, bounds } = result;
  return [
    `Centroid:\nlat=${centroid.lat.toFixed(6)} lng=${centroid.lng.toFixed(6)}`,
    `\nBounds:\nnorth=${bounds.north.toFixed(6)}, south=${bounds.south.toFixed(6)},\neast=${bounds.east.toFixed(6)}, west=${bounds.west.toFixed(6)}`,
  ].join("\n");
}

export default function GeoProcessorApp() {
  const [state, setState] = useState<FormState>({
    rawPoints: DEFAULT_EXAMPLE,
    loading: false,
    error: null,
    result: null,
  });

  const pointsPreview = useMemo(() => parsePoints(state.rawPoints), [state.rawPoints]);

  const handleSubmit = useCallback(
    async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`${API_URL}/geo/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: pointsPreview }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.detail ?? payload?.message ?? "Unknown error";
          throw new Error(typeof message === "string" ? message : JSON.stringify(payload));
        }

        const payload = (await response.json()) as ApiResponse;
        setState((prev) => ({ ...prev, result: payload, loading: false }));
      } catch (error) {
        console.error("Error calling gateway", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    },
    [pointsPreview],
  );

  return (
    <>
      <header>
        <h1>Geo Processor UI</h1>
        <p>
          Enter coordinates and get the centroid and bounding box calculated by the NestJS gateway and the
          FastAPI service.
        </p>
      </header>

      <section className="card">
        <div className="form-container">
          <label htmlFor="points">Points (JSON)</label>
          <textarea
            id="points"
            value={state.rawPoints}
            onChange={(event) => setState((prev) => ({ ...prev, rawPoints: event.target.value }))}
            aria-describedby="points-help"
          />
          <div id="points-help">
            Valid example:
            <pre>{DEFAULT_EXAMPLE}</pre>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={state.loading || !pointsPreview?.length}
          >
            {state.loading ? "Processing..." : "Process"}
          </button>
        </div>
      </section>

      {state.error && (
        <section className="card error" role="alert">
          <strong>Error:</strong> {state.error}
        </section>
      )}

      {state.result && (
        <section className="card success">
          <h2>Result</h2>
          <div className="results-grid">
            <div>
              <h3>Centroid</h3>
              <p>Lat: {state.result.centroid.lat.toFixed(6)}</p>
              <p>Lng: {state.result.centroid.lng.toFixed(6)}</p>
            </div>
            <div>
              <h3>Bounds</h3>
              <p>North: {state.result.bounds.north.toFixed(6)}</p>
              <p>South: {state.result.bounds.south.toFixed(6)}</p>
              <p>East: {state.result.bounds.east.toFixed(6)}</p>
              <p>West: {state.result.bounds.west.toFixed(6)}</p>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Map</h2>
        {state.result ? (
          <MapView
            points={pointsPreview ?? []}
            centroid={state.result.centroid}
            bounds={state.result.bounds}
          />
        ) : (
          <div className="map-container" aria-hidden>
            <p style={{ padding: "1rem" }}>Process a set of points to visualize the map.</p>
          </div>
        )}
      </section>

      {state.result && (
        <section className="card">
          <h2>Output JSON</h2>
          <textarea value={JSON.stringify(state.result, null, 2)} readOnly />
          <h3>Summary</h3>
          <pre className="summary-output">{centroidToText(state.result)}</pre>
        </section>
      )}
    </>
  );
}
