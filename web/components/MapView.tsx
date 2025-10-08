"use client";

import { useMemo } from "react";
import {
  MapContainer,
  Rectangle,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { StaticImageData } from "next/image";

// Fix icon paths for Leaflet when bundling with Next.js
import iconRetinaAsset from "leaflet/dist/images/marker-icon-2x.png";
import iconAsset from "leaflet/dist/images/marker-icon.png";
import shadowAsset from "leaflet/dist/images/marker-shadow.png";

export interface Point {
  lat: number;
  lng: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewProps {
  points: Point[];
  bounds: Bounds;
  centroid: Point;
}

// Ensure Leaflet default icon assets are properly resolved in Next.js
const resolveAssetUrl = (asset: string | StaticImageData): string =>
  typeof asset === "string" ? asset : asset.src;

const DefaultIcon = L.icon({
  iconRetinaUrl: resolveAssetUrl(iconRetinaAsset),
  iconUrl: resolveAssetUrl(iconAsset),
  shadowUrl: resolveAssetUrl(shadowAsset),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapViewComponent({ points, bounds, centroid }: MapViewProps) {
  const mapBounds = useMemo<LatLngExpression[]>(() => {
    if (!bounds) {
      return [
        [0, 0],
        [0, 0],
      ];
    }
    return [
      [bounds.south, bounds.west],
      [bounds.north, bounds.east],
    ];
  }, [bounds]);

  const centroidLatLng: LatLngExpression = useMemo(
    () => [centroid.lat, centroid.lng],
    [centroid.lat, centroid.lng],
  );

  if (!points?.length) {
    return (
      <div className="map-container">
        <MapContainer center={[0, 0]} zoom={2} className="leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
    );
  }

  const multiPointCenter: LatLngExpression = centroidLatLng;

  return (
    <div className="map-container">
      <MapContainer
        key={JSON.stringify(mapBounds)}
        bounds={mapBounds as any}
        center={multiPointCenter}
        zoom={points.length === 1 ? 12 : undefined}
        className="leaflet-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Rectangle
          bounds={mapBounds as any}
          pathOptions={{ color: "#38bdf8", weight: 2 }}
        />

        {points.map((point, idx) => (
          <CircleMarker
            key={`point-${idx}`}
            center={[point.lat, point.lng]}
            radius={6}
            pathOptions={{ color: "#f97316", weight: 2, fillOpacity: 0.8 }}
          >
            <Popup>
              Punto {idx + 1}
              <br />
              Lat: {point.lat.toFixed(6)}
              <br />
              Lng: {point.lng.toFixed(6)}
            </Popup>
          </CircleMarker>
        ))}

        <Marker position={centroidLatLng}>
          <Popup>
            Centroid
            <br />
            Lat: {centroid.lat.toFixed(6)}
            <br />
            Lng: {centroid.lng.toFixed(6)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export const MapView = MapViewComponent;

export default MapViewComponent;

