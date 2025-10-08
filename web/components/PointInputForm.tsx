"use client";

import { useState, useCallback } from "react";

interface Point {
  lat: number;
  lng: number;
}

interface PointInputFormProps {
  onProcess: (points: Point[]) => void;
  loading: boolean;
}

const MAX_POINTS = 1000;

export default function PointInputForm({ onProcess, loading }: PointInputFormProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [latError, setLatError] = useState<string | null>(null);
  const [lngError, setLngError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());

  const validateLat = (value: string): string | null => {
    if (!value.trim()) return "Latitude is required";
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < -90 || num > 90) return "Must be between -90 and 90";
    return null;
  };

  const validateLng = (value: string): string | null => {
    if (!value.trim()) return "Longitude is required";
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < -180 || num > 180) return "Must be between -180 and 180";
    return null;
  };

  const handleLatChange = (value: string) => {
    setLatInput(value);
    setLatError(value.trim() ? validateLat(value) : null);
  };

  const handleLngChange = (value: string) => {
    setLngInput(value);
    setLngError(value.trim() ? validateLng(value) : null);
  };

  const handleAddPoint = useCallback(() => {
    const latErr = validateLat(latInput);
    const lngErr = validateLng(lngInput);

    setLatError(latErr);
    setLngError(lngErr);

    if (latErr || lngErr) return;

    if (points.length >= MAX_POINTS) {
      alert(`Maximum ${MAX_POINTS} points allowed`);
      return;
    }

    const lat = parseFloat(parseFloat(latInput).toFixed(6));
    const lng = parseFloat(parseFloat(lngInput).toFixed(6));

    if (editingIndex !== null) {
      const newPoints = [...points];
      newPoints[editingIndex] = { lat, lng };
      setPoints(newPoints);
      setEditingIndex(null);
    } else {
      setPoints([...points, { lat, lng }]);
    }

    setLatInput("");
    setLngInput("");
    setLatError(null);
    setLngError(null);
  }, [latInput, lngInput, points, editingIndex]);

  const handleEdit = (index: number) => {
    const point = points[index];
    setLatInput(point.lat.toString());
    setLngInput(point.lng.toString());
    setEditingIndex(index);
    setLatError(null);
    setLngError(null);
  };

  const handleDelete = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setLatInput("");
      setLngInput("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setLatInput("");
    setLngInput("");
    setLatError(null);
    setLngError(null);
  };

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selectedPoints);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPoints(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedPoints.size === 0) return;
    if (!confirm(`Delete ${selectedPoints.size} selected point(s)?`)) return;
    
    setPoints(points.filter((_, i) => !selectedPoints.has(i)));
    setSelectedPoints(new Set());
  };

  const handleClearAll = () => {
    if (points.length === 0) return;
    if (!confirm("Clear all points?")) return;
    
    setPoints([]);
    setSelectedPoints(new Set());
    setEditingIndex(null);
    setLatInput("");
    setLngInput("");
  };

  const handleProcess = () => {
    if (points.length === 0) return;
    onProcess(points);
  };

  const canAddPoint = latInput.trim() && lngInput.trim() && !latError && !lngError;

  return (
    <div className="point-input-form">
      <h2>Add Points</h2>
      <p className="subtitle">Enter coordinates individually</p>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-group">
          <label htmlFor="lat-input">
            Latitude
            {latError && <span className="error-inline"> • {latError}</span>}
          </label>
          <input
            id="lat-input"
            type="number"
            step="any"
            placeholder="-90 to 90"
            value={latInput}
            onChange={(e) => handleLatChange(e.target.value)}
            className={latError ? "input-error" : ""}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label htmlFor="lng-input">
            Longitude
            {lngError && <span className="error-inline"> • {lngError}</span>}
          </label>
          <input
            id="lng-input"
            type="number"
            step="any"
            placeholder="-180 to 180"
            value={lngInput}
            onChange={(e) => handleLngChange(e.target.value)}
            className={lngError ? "input-error" : ""}
            disabled={loading}
          />
        </div>

        <div className="button-group">
          <button
            type="button"
            onClick={handleAddPoint}
            disabled={!canAddPoint || loading}
            className="btn-add"
          >
            {editingIndex !== null ? "Update" : "Add Point"}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Points List */}
      {points.length > 0 && (
        <div className="points-list">
          <div className="list-header">
            <h3>Points ({points.length})</h3>
            <div className="list-actions">
              {selectedPoints.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="btn-danger-small"
                  disabled={loading}
                >
                  Delete Selected ({selectedPoints.size})
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                className="btn-secondary-small"
                disabled={loading}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="points-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedPoints.size === points.length && points.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPoints(new Set(points.map((_, i) => i)));
                        } else {
                          setSelectedPoints(new Set());
                        }
                      }}
                      disabled={loading}
                    />
                  </th>
                  <th>#</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point, index) => (
                  <tr key={index} className={editingIndex === index ? "editing" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPoints.has(index)}
                        onChange={() => handleToggleSelect(index)}
                        disabled={loading}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>{point.lat.toFixed(6)}</td>
                    <td>{point.lng.toFixed(6)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          onClick={() => handleEdit(index)}
                          className="btn-icon"
                          title="Edit"
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(index)}
                          className="btn-icon btn-icon-danger"
                          title="Delete"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Process Button */}
      <button
        type="button"
        onClick={handleProcess}
        disabled={points.length === 0 || loading}
        className="btn-process"
      >
        {loading ? "Processing..." : `Calculate (${points.length} point${points.length !== 1 ? "s" : ""})`}
      </button>

      {points.length === 0 && (
        <p className="empty-message">No points added yet. Add at least one point to calculate.</p>
      )}
    </div>
  );
}
