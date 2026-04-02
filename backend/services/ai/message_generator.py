"""
Generates personalized outreach messages using templates.
AI-based generation (Gemini, Backboard) is commented out — re-enable when needed.
"""

# from services.ai.backboard_service import backboard
# import httpx
# from config import settings, Settings
#
# BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
#
# MODELS_TO_TRY = [
#     "gemini-2.0-flash",
#     "gemini-2.0-flash-lite",
#     "gemini-2.5-flash",
# ]


def _template_message(user: dict, target_person: dict, target_company: str, context: dict) -> str:
    """Generate a personalized message using the person's name, role, and company."""
    name = target_person.get("name", "").split()[0]  # First name
    title = target_person.get("title", "")
    degree = target_person.get("degree", 1)
    is_recruiter = target_person.get("is_recruiter", False)
    bridge = context.get("bridge_person")
    sender = user.get("name", "")

    if is_recruiter:
        return (
            f"Hi {name},\n\n"
            f"I came across your profile and saw you're recruiting at {target_company}. "
            f"I'm really interested in the work being done there"
            f"{' and ' + bridge.get('name','') + ' suggested I reach out' if bridge else ''}. "
            f"Would you be open to a quick coffee chat sometime?\n\n"
            f"Best,\n{sender}"
        )
    elif degree == 2 and bridge:
        bridge_name = bridge.get("name", "our mutual connection").split()[0]
        return (
            f"Hi {name},\n\n"
            f"I noticed we're connected through {bridge_name}, "
            f"and I've been really impressed by the {title} work at {target_company}. "
            f"I'd love to learn more about your experience there. "
            f"Would you be open to a quick coffee chat?\n\n"
            f"Best,\n{sender}"
        )
    else:
        return (
            f"Hi {name},\n\n"
            f"Great to connect! I've been following what {target_company} is building "
            f"and your work as {title} really caught my eye. "
            f"I'd love to hear about your experience there. "
            f"Would you be open to grabbing a coffee chat sometime?\n\n"
            f"Best,\n{sender}"
        )


async def generate_outreach_message(
    user: dict,
    target_person: dict,
    target_company: str,
    context: dict
) -> str:
    return _template_message(user, target_person, target_company, context)


# --- AI generation (re-enable when ready) ---
#
# async def _generate_with_ai(user, target_person, target_company, context) -> str:
#     bridge = context.get("bridge_person")
#     degree = target_person.get("degree", 1)
#     title = target_person.get("title", "")
#     is_recruiter = target_person.get("is_recruiter", False)
#     sender = user.get("name", "someone")
#
#     parts = [f"Write a short 3-4 line LinkedIn message from {sender} to {target_person['name']}"]
#     if title:
#         parts.append(f"who is a {title}")
#     parts.append(f"at {target_company}.")
#     if bridge:
#         parts.append(f"Mention mutual connection {bridge.get('name','')}.")
#     if is_recruiter:
#         parts.append("They are a recruiter - ask about open roles.")
#     elif degree == 1:
#         parts.append("They are already connected - reconnect and ask about their experience.")
#     else:
#         parts.append("Ask for a referral.")
#     parts.append("End by asking for a coffee chat. Be warm, genuine, no generic openers, and NEVER use em dashes. Return only the message:")
#     prompt = " ".join(parts)
#
#     # Try Backboard.io first
#     try:
#         text = await backboard.generate_completion(prompt, model="gpt-4o-mini")
#         if text and len(text) > 30:
#             return text
#     except Exception as e:
#         print(f"Backboard failed: {e}, falling back to Gemini")
#
#     # Fallback to Gemini REST API
#     api_key = Settings().gemini_api_key
#     if not api_key or api_key.startswith("your_"):
#         return _template_message(user, target_person, target_company, context)
#
#     payload = {
#         "contents": [{"parts": [{"text": prompt}]}],
#         "generationConfig": {"maxOutputTokens": 150, "temperature": 0.8}
#     }
#     for model in MODELS_TO_TRY:
#         url = f"{BASE_URL}/models/{model}:generateContent?key={api_key}"
#         try:
#             async with httpx.AsyncClient() as client:
#                 resp = await client.post(url, json=payload, timeout=30.0)
#                 data = resp.json()
#                 if "error" in data:
#                     continue
#                 text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
#                 if len(text) > 30:
#                     return text
#         except Exception:
#             continue
#
#     return _template_message(user, target_person, target_company, context)
