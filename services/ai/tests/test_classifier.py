import json
import pytest
from unittest.mock import AsyncMock, patch
from app.services.classifier import classify_description, _pick_model


LAPTOP_RESPONSE = json.dumps({
    "hs_code": "8471.30.00.00",
    "title": "Portable ADP machines weighing not more than 10kg",
    "chapter": "Ch. 84 — Nuclear reactors, boilers, machinery",
    "confidence": 0.97,
    "reasoning": "Laptop computers fall under heading 8471.",
    "risk_level": "Clear",
    "flag_note": None,
    "alternatives": [],
})


@pytest.mark.asyncio
async def test_classifies_laptop_correctly():
    with patch("app.services.classifier.complete", AsyncMock(return_value=LAPTOP_RESPONSE)):
        result = await classify_description("Dell Latitude 5440 laptop", origin_country="CN")

    assert result.hs_code == "8471.30.00.00"
    assert result.confidence == 0.97
    assert result.risk_level == "Clear"
    assert result.source_model == "claude-haiku-4-5-20251001"


@pytest.mark.asyncio
async def test_routes_chemicals_to_sonnet():
    assert _pick_model("Sodium hydroxide 99% purity") == "claude-sonnet-4-6"


@pytest.mark.asyncio
async def test_routes_standard_goods_to_haiku():
    assert _pick_model("Cotton t-shirts, men's, assorted sizes") == "claude-haiku-4-5-20251001"


@pytest.mark.asyncio
async def test_routes_weapons_to_sonnet():
    assert _pick_model("9mm pistol ammunition, 500 rounds") == "claude-sonnet-4-6"
