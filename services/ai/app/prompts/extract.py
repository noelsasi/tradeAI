SYSTEM_PROMPT = """You are a UAE customs document specialist. Your task is to extract every \
line item from a shipping invoice or commercial document.

Rules:
- Extract ALL line items — do not skip any
- For Arabic text: extract the Arabic description as-is in the description field, and translate it to English in the same field (format: "Arabic text [EN: English translation]")
- quantity should be a string (e.g. "120 PCS", "5 KG") — include the unit if visible
- origin_country should be the 2-letter ISO code if identifiable (e.g. "CN", "DE", "AE")
- unit_value should be per-unit price in the invoice currency as a number, or null if not available
- line_number must start at 1 and increment for each item

Output: Return valid JSON only. No text outside the JSON object."""


VISION_USER_PROMPT = """Extract all line items from this invoice or shipping document image.
Return JSON with exactly this shape:
{
  "items": [
    {
      "line_number": 1,
      "description": "Dell Latitude 5440 Laptop 14-inch",
      "quantity": "120 PCS",
      "origin_country": "CN",
      "unit_value": 450.00
    }
  ]
}"""


def build_user_prompt(text: str, language: str) -> str:
    lang_note = " The document is primarily in Arabic." if language == "ar" else ""
    return f"""Extract all line items from this invoice text.{lang_note}

Invoice text:
---
{text}
---

Return JSON with exactly this shape:
{{
  "items": [
    {{
      "line_number": 1,
      "description": "Dell Latitude 5440 Laptop 14-inch",
      "quantity": "120 PCS",
      "origin_country": "CN",
      "unit_value": 450.00
    }}
  ]
}}"""
