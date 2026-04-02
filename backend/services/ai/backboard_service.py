# Backboard.io integration — commented out, re-enable when ready.
#
# import httpx
# from typing import Optional
# from config import settings
#
# class BackboardService:
#     BASE_URL = "https://api.backboard.io/v1"
#
#     def __init__(self, api_key: Optional[str] = None):
#         self.api_key = api_key or settings.backboard_api_key
#         self.headers = {
#             "Authorization": f"Bearer {self.api_key}",
#             "Content-Type": "application/json"
#         }
#
#     async def generate_completion(
#         self,
#         prompt: str,
#         model: str = "gpt-4o-mini",
#         assistant_id: Optional[str] = None,
#         thread_id: Optional[str] = None
#     ) -> str:
#         if not self.api_key:
#             raise ValueError("Backboard API key not found")
#
#         async with httpx.AsyncClient() as client:
#             thread_resp = await client.post(f"{self.BASE_URL}/threads", headers=self.headers, json={})
#             thread_resp.raise_for_status()
#             curr_thread_id = thread_resp.json()["id"]
#
#             msg_resp = await client.post(
#                 f"{self.BASE_URL}/threads/{curr_thread_id}/messages",
#                 headers=self.headers,
#                 data={"role": "user", "content": prompt}
#             )
#             msg_resp.raise_for_status()
#
#             run_payload = {"assistant_id": assistant_id or "default"}
#             if model:
#                 run_payload["model"] = model
#             run_resp = await client.post(
#                 f"{self.BASE_URL}/threads/{curr_thread_id}/runs",
#                 headers=self.headers, json=run_payload
#             )
#             run_resp.raise_for_status()
#             run_id = run_resp.json()["id"]
#
#             import asyncio
#             for _ in range(30):
#                 status_resp = await client.get(
#                     f"{self.BASE_URL}/threads/{curr_thread_id}/runs/{run_id}",
#                     headers=self.headers
#                 )
#                 status_data = status_resp.json()
#                 if status_data["status"] == "completed":
#                     msgs_data = (await client.get(
#                         f"{self.BASE_URL}/threads/{curr_thread_id}/messages",
#                         headers=self.headers
#                     )).json()
#                     for msg in msgs_data.get("data", []):
#                         if msg["role"] == "assistant":
#                             return msg["content"][0]["text"]["value"]
#                     return "No response from assistant"
#                 elif status_data["status"] in ["failed", "cancelled", "expired"]:
#                     raise Exception(f"Backboard run failed: {status_data['status']}")
#                 await asyncio.sleep(1)
#
#             raise Exception("Backboard request timed out")
#
# backboard = BackboardService()
