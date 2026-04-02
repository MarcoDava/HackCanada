"""
On-demand profile enrichment using Scrapfly.
Only called for the top 3-5 most relevant bridge nodes — not bulk scraping.
"""
from scrapfly import ScrapflyClient, ScrapeConfig
from bs4 import BeautifulSoup
from config import settings

scrapfly = ScrapflyClient(key=settings.scrapfly_api_key)

async def enrich_profile(profile_url: str) -> dict:
    """Fetch and parse a LinkedIn profile for enrichment data."""
    if not profile_url or not profile_url.startswith("https://www.linkedin.com/in/"):
        return {}

    try:
        result = await scrapfly.async_scrape(ScrapeConfig(
            url=profile_url,
            asp=True,
            render_js=True,
            country="US",
            cache=True,             # Cache responses to avoid repeat calls
            cache_ttl=86400,        # 24h cache — profiles don't change that fast
        ))
        return _parse_profile(result.content)
    except Exception as e:
        print(f"Enrichment failed for {profile_url}: {e}")
        return {}

def _parse_profile(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    def text(selector):
        el = soup.select_one(selector)
        return el.get_text(strip=True) if el else ""

    return {
        "headline": text("h2.top-card-layout__headline"),
        "location": text(".top-card__subline-item"),
        "experience": [
            el.get_text(strip=True)
            for el in soup.select(".experience-item__title")
        ][:5],
        "education": [
            el.get_text(strip=True)
            for el in soup.select(".education__school-name")
        ][:3],
        "enriched": True
    }
