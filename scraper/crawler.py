from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass, field
from datetime import date
from typing import Iterable, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

try:
    from crawl4ai import WebCrawler
except ImportError:  # pragma: no cover
    WebCrawler = None

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    )
}


@dataclass
class ScrapedChapter:
    title: str
    chapter_number: int
    url: str
    images: List[str] = field(default_factory=list)
    release_date: Optional[date] = None


@dataclass
class ScrapeOutput:
    title: str
    chapters: List[ScrapedChapter]
    cover_image: Optional[str] = None


def scrape_webtoon(url: str, timeout: int = 15) -> ScrapeOutput:
    """
    Scrape un webtoon depuis l'URL fournie.

    Tente d'utiliser crawl4ai si disponible, sinon bascule sur une analyse BeautifulSoup.
    """

    if WebCrawler:  # pragma: no cover - dépend de l'environnement
        try:
            return asyncio.run(_scrape_with_crawl4ai(url, timeout))
        except Exception as exc:  # noqa: broad-except
            logger.warning("crawl4ai a échoué (%s), fallback BeautifulSoup activé.", exc)

    return _scrape_with_bs(url, timeout)


async def _scrape_with_crawl4ai(url: str, timeout: int) -> ScrapeOutput:
    async with WebCrawler() as crawler:  # type: ignore[misc]
        result = await crawler.run(url)

    title = result.get('title') or result.get('page_title') or 'Webtoon'
    chapters = []
    for index, item in enumerate(result.get('chapters', []), start=1):
        chapter_title = item.get('title') or f'Chapitre {index}'
        chapter_url = item.get('url') or url
        images = item.get('images') or []
        chapters.append(
            ScrapedChapter(
                title=chapter_title,
                chapter_number=_parse_chapter_number(chapter_title, index),
                url=chapter_url,
                images=images,
            )
        )

    if not chapters:
        # Fallback pour récupérer au moins la page principale
        bs_output = _scrape_with_bs(url, timeout)
        return ScrapeOutput(title=title, chapters=bs_output.chapters, cover_image=bs_output.cover_image)

    return ScrapeOutput(title=title, chapters=chapters, cover_image=result.get('cover'))


def _scrape_with_bs(url: str, timeout: int) -> ScrapeOutput:
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    title = soup.find('h1')
    title_text = title.get_text(strip=True) if title else 'Webtoon'

    chapters = _extract_chapter_links(soup, url)
    scraped_chapters: List[ScrapedChapter] = []
    for idx, (chapter_url, chapter_title) in enumerate(chapters, start=1):
        chapter_number = _parse_chapter_number(chapter_title, idx)
        images = _extract_images(session, chapter_url, timeout)
        scraped_chapters.append(
            ScrapedChapter(
                title=chapter_title,
                chapter_number=chapter_number,
                url=chapter_url,
                images=images,
            )
        )

    cover = None
    cover_el = soup.find('img', {'class': re.compile('cover', re.I)})
    if cover_el and cover_el.get('src'):
        cover = cover_el['src']

    return ScrapeOutput(title=title_text, chapters=scraped_chapters, cover_image=cover)


def _extract_chapter_links(soup: BeautifulSoup, base_url: str) -> List[tuple[str, str]]:
    chapters: List[tuple[str, str]] = []

    # WP Manga Reader structure
    for element in soup.select('.wp-manga-chapter a'):
        href = element.get('href')
        if not href:
            continue
        title = element.get_text(strip=True)
        chapters.append((urljoin(base_url, href), title))

    # fallback on generic link list
    if not chapters:
        for element in soup.select('a'):
            text = element.get_text(strip=True)
            if re.search(r'chapitre|chapter', text, re.IGNORECASE):
                href = element.get('href')
                if href:
                    chapters.append((urljoin(base_url, href), text))

    chapters.reverse()  # WP Manga lists newest first; invert to chronological
    return chapters


def _extract_images(session: requests.Session, url: str, timeout: int) -> List[str]:
    try:
        response = session.get(url, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Impossible de récupérer %s (%s)", url, exc)
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    images: List[str] = []
    for img in soup.select('img'):
        src = img.get('data-src') or img.get('data-original') or img.get('src')
        if not src:
            continue
        if src.startswith('//'):
            src = f'https:{src}'
        images.append(src)
    return images


def _parse_chapter_number(title: str, default: int) -> int:
    match = re.search(r'(\d+(?:\.\d+)?)', title.replace(',', '.'))
    if match:
        try:
            return int(float(match.group(1)))
        except ValueError:
            return default
    return default
