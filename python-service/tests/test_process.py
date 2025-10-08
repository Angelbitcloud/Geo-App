from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_process_points_success():
    payload = {
        "points": [
            {"lat": 10.0, "lng": 20.0},
            {"lat": -5.0, "lng": 12.5},
            {"lat": 7.5, "lng": -3.5},
        ]
    }

    response = client.post("/process", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["bounds"] == {"north": 10.0, "south": -5.0, "east": 20.0, "west": -3.5}
    assert data["centroid"] == {"lat": (10.0 - 5.0 + 7.5) / 3, "lng": (20.0 + 12.5 - 3.5) / 3}


def test_process_points_missing_points_field():
    response = client.post("/process", json={})

    assert response.status_code == 400
    assert response.json()["detail"] == "points must be a non-empty array of {lat,lng}."


def test_process_points_empty_points_array():
    response = client.post("/process", json={"points": []})

    assert response.status_code == 400
    assert response.json()["detail"] == "points must be a non-empty array of {lat,lng}."


def test_process_points_with_non_numeric_coordinates():
    payload = {"points": [{"lat": "not-a-number", "lng": 20.0}]}

    response = client.post("/process", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "points must be a non-empty array of {lat,lng}."

