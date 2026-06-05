from __future__ import annotations


SYSTEM_PROMPT = """You are a GCC customs tariff specialist with deep expertise in the UAE \
Integrated Customs Tariff (12-digit format, effective January 2026).

Classification rules:
- Always return the full 12-digit UAE tariff code as a plain 12-digit number with NO dots or spaces
- Structure: 6-digit WCO HS + 2-digit GCC regional extension + 4-digit UAE national extension = 12 digits total
- Examples of correct format: "851713000000" (smartphones), "847130000000" (laptops), "850760000000" (Li-ion batteries)
- Use the January 2026 UAE Integrated Customs Tariff schedule
- When uncertain between two codes, list the rejected one in alternatives with the reason
- Flag dual-use goods, controlled substances, and sanctions-sensitive HS chapters (Ch.28, 29, 36, 84, 85, 87, 88, 93)
- risk_level must be "Clear", "Review" (ambiguous / needs human check), or "Flagged" (dual-use / DG / restricted)
- confidence must reflect genuine uncertainty — do not always return 0.99

Output: Return valid JSON only. No text outside the JSON object."""


def build_user_prompt(
    description: str,
    origin_country: str | None,
    quantity: str | None,
    unit_value: float | None,
    language: str,
) -> str:
    parts = [f"Product description: {description}"]
    if language == "ar":
        parts.append("Note: description may contain Arabic text — translate internally for classification.")
    if origin_country:
        parts.append(f"Country of origin: {origin_country}")
    if quantity:
        parts.append(f"Quantity: {quantity}")
    if unit_value is not None:
        parts.append(f"Unit value (USD): {unit_value}")

    parts.append("""
Return JSON with exactly this shape:
{
  "hs_code": "847130000000",
  "title": "Portable ADP machines weighing not more than 10kg",
  "chapter": "Ch. 84 — Nuclear reactors, boilers, machinery",
  "confidence": 0.97,
  "reasoning": "Laptop computers fall under heading 8471, subheading 30 for portable machines under 10kg.",
  "risk_level": "Clear",
  "flag_note": null,
  "alternatives": [
    { "code": "847141000000", "reason": "Rejected — that subheading covers other ADP machines, not portable laptops" }
  ]
}

IMPORTANT: hs_code and all alternative codes must be exactly 12 digits with no dots, spaces, or other characters.""")

    return "\n".join(parts)
