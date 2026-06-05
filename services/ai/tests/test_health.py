from fastapi.testclient import TestClient
from unittest.mock import patch
from app.config import Settings


def test_health_returns_ok():
    mock_settings = Settings(anthropic_api_key="test-key")
    with patch("app.config.settings", mock_settings):
        from app.main import app
        client = TestClient(app)
        response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data
