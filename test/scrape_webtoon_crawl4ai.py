# -*- coding: utf-8 -*-
r"""
Scraper Madara/WP-Manga (chapitres + images)
OPTION B : Full ScrapeOps (HTML + images) avec throttle anti-429 et retries.

Toujours présent dans le code (au cas où) :
- Crawl4AI (Playwright) et toutes ses options (profil persistant, CDP, stealth, undetected, proxy)
  MAIS on ne lance le navigateur que si tu utilises --series-via/--chapters-via=browser/auto.

Exemple recommandé (full ScrapeOps):
  setx SCRAPEOPS_API_KEY "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  python test/scrape_webtoon_crawl4ai.py --start "https://manga-scantrad.io/manga/regressor-instruction-manual/" ^
    --series-via scrapeops --chapters-via scrapeops --images-via scrapeops ^
    --scrapeops-country fr --scrapeops-render-js ^
    --scrapeops-qps 1 --scrapeops-max-retries 8 ^
    --concurrency 2 --out .\webtoon_out
"""
import asyncio
import argparse
import os
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from lxml import html
from tqdm.asyncio import tqdm_asyncio

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from crawl4ai.async_configs import CacheMode, VirtualScrollConfig

# Facultatif: undetected adapter (selon version Crawl4AI)
try:
    from crawl4ai import UndetectedAdapter
    from crawl4ai.async_crawler_strategy import AsyncPlaywrightCrawlerStrategy
except Exception:
    UndetectedAdapter = None
    AsyncPlaywrightCrawlerStrategy = None

# =========================
#         PATTERNS
# =========================

CHAPTER_PATTERNS = [
    r"/(chapitre-\d+)(/|$)",
    r"/(chapter-\d+)(/|$)",
    r"/(ch-\d+)(/|$)",
    r"/(vol-\d+-ch-\d+)(/|$)",
    r"/(v\d+-c\d+)(/|$)",
]

IMG_EXT_RE = re.compile(r"\.(jpg|jpeg|png|webp)$", re.I)

SERIES_XPATHS = [
    "//li[contains(@class,'wp-manga-chapter')]/a/@href",
    "//div[contains(@class,'listing-chapters') or contains(@class,'chapter-list')]//a/@href",
    "//ul[contains(@class,'main') or contains(@class,'version-chap')]//a/@href",
    "//div[@id='manga-chapters-holder']//a/@href",
    "//div[@id='chapterlist']//a/@href",
    # fallbacks
    "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'chapitre')]/@href",
    "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'chapter')]/@href",
    "//a[contains(., 'Ch.') or contains(., 'Ch-')]/@href",
    "//a[contains(translate(@href,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'/ch-')]/@href",
    "//a[contains(translate(@href,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'/vol-')]/@href",
]

IMAGE_XPATHS = [
    "//div[contains(@class,'reading-content')]//img",
    "//div[contains(@class,'read-container') or contains(@class,'chapter-content')]//img",
    "//div[contains(@class,'readerarea') or contains(@class,'image-container')]//img",
    "//img"
]

# =========================
#        HELPERS
# =========================

def slugify(s: str) -> str:
    s = re.sub(r"[^\w\-\.]+", "_", s.strip())
    return re.sub(r"_+", "_", s).strip("_")

def extract_chapter_number(url: str) -> int:
    m = re.search(r"(?:chapitre-|chapter-|ch-|v\d+-c)(\d+)", url, re.I)
    return int(m.group(1)) if m else -1

def is_chapter_url(u: str) -> bool:
    return any(re.search(p, u) for p in CHAPTER_PATTERNS)

def normalize_url(u: str, base: str) -> str:
    if not u:
        return ""
    u = u.strip()
    if u.startswith("//"):
        u = "https:" + u
    elif not bool(urlparse(u).scheme):
        u = urljoin(base, u)
    return u

def pick_best_src_from_imgnode(img_el) -> str | None:
    srcset = img_el.get("srcset") or img_el.get("data-srcset")
    if srcset:
        parts = [p.strip().split(" ")[0] for p in srcset.split(",") if p.strip()]
        if parts:
            return parts[-1]
    for attr in ("data-src", "data-lazy-src", "data-original", "data-cfsrc", "src"):
        if img_el.get(attr):
            return img_el.get(attr)
    return None

# =========================
#   HTTPX CLIENT COMPAT
# =========================

def _env_proxy_fallback(proxy: str | None):
    if proxy:
        os.environ.setdefault("HTTP_PROXY", proxy)
        os.environ.setdefault("HTTPS_PROXY", proxy)

class _HttpxCompat:
    """Fabrique de clients httpx.AsyncClient compatible avec anciennes versions (sans proxies/limits/http2)."""
    @staticmethod
    def client_kwargs(timeout=60, http2=True, proxy: str | None = None, limits=None):
        base = dict(timeout=timeout)
        variants = []
        v = dict(base); v["http2"] = http2
        if proxy: v["proxies"] = proxy
        if limits is not None: v["limits"] = limits
        variants.append(v)
        v2 = dict(base); v2["http2"] = http2
        if proxy: v2["proxies"] = proxy
        variants.append(v2)
        v3 = dict(base)
        if proxy: v3["proxies"] = proxy
        if limits is not None: v3["limits"] = limits
        variants.append(v3)
        variants.append(dict(base))
        return variants

    @staticmethod
    async def open(timeout=60, http2=True, proxy: str | None = None, limits=None):
        for kw in _HttpxCompat.client_kwargs(timeout, http2, proxy, limits):
            try:
                return httpx.AsyncClient(**kw)
            except TypeError:
                continue
        _env_proxy_fallback(proxy)
        return httpx.AsyncClient(timeout=timeout)

# =========================
#   SCRAPEOPS (Proxy API)
# =========================

SCRAPEOPS_ENDPOINT = "https://proxy.scrapeops.io/v1/"

async def _scrapeops_get(client: httpx.AsyncClient, url: str, api_key: str, country: str, render_js: bool) -> httpx.Response:
    params = {"api_key": api_key, "url": url, "country": country}
    if render_js:
        params["render_js"] = "true"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}
    return await client.get(SCRAPEOPS_ENDPOINT, params=params, headers=headers)

async def so_fetch_html(url: str, api_key: str, *, country: str="fr", render_js: bool=False, proxy: str | None = None) -> str:
    client = await _HttpxCompat.open(timeout=180, http2=False, proxy=proxy)
    async with client:
        delay = 1.0
        for attempt in range(4):
            try:
                r = await _scrapeops_get(client, url, api_key, country, render_js)
                r.raise_for_status()
                return r.text
            except (httpx.ReadTimeout, httpx.ConnectError, httpx.RemoteProtocolError):
                if attempt == 3:
                    raise
                await asyncio.sleep(delay); delay = min(delay * 2, 15.0)
            except httpx.HTTPStatusError:
                raise

async def so_fetch_bytes(url: str, api_key: str, *, country: str="fr", render_js: bool=False, proxy: str | None = None) -> bytes:
    client = await _HttpxCompat.open(timeout=180, http2=False, proxy=proxy)
    async with client:
        delay = 1.0
        for attempt in range(4):
            try:
                r = await _scrapeops_get(client, url, api_key, country, render_js)
                r.raise_for_status()
                return r.content
            except (httpx.ReadTimeout, httpx.ConnectError, httpx.RemoteProtocolError):
                if attempt == 3:
                    raise
                await asyncio.sleep(delay); delay = min(delay * 2, 15.0)
            except httpx.HTTPStatusError:
                raise

# =========================
#   RATE LIMITER (Option B)
# =========================

class RateLimiter:
    def __init__(self, qps: float):
        self.interval = 1.0 / max(qps, 0.001)
        self._lock = asyncio.Lock()
        self._last = 0.0

    async def wait(self):
        async with self._lock:
            now = asyncio.get_event_loop().time()
            wait = max(0.0, self._last + self.interval - now)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = asyncio.get_event_loop().time()

# =========================
#   CRAWL4AI CONFIGS (si besoin)
# =========================

def build_browser_config(
    downloads_dir: Path,
    headless: bool = True,
    profile_dir: str | None = None,
    use_managed: bool = False,
    cdp_url: str | None = None,
    stealth: bool = False,
    proxy: str | None = None,
) -> BrowserConfig:
    bc_kwargs = dict(
        browser_type="chromium",
        headless=headless,
        viewport_width=1440,
        viewport_height=2400,
        user_agent_mode="random",
        ignore_https_errors=True,
        accept_downloads=False,
        downloads_path=str(downloads_dir),
        java_script_enabled=True,
        headers={"Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8"},
        enable_stealth=stealth,
        use_persistent_context=True,
    )
    if use_managed and profile_dir:
        bc_kwargs.update({"use_managed_browser": True, "user_data_dir": profile_dir})
    if cdp_url:
        bc_kwargs.update({"cdp_url": cdp_url})
    if proxy:
        bc_kwargs.update({"proxy_config": {"server": proxy}})
    return BrowserConfig(**bc_kwargs)

def make_crawler(browser_config: BrowserConfig, use_undetected: bool):
    if use_undetected and UndetectedAdapter and AsyncPlaywrightCrawlerStrategy:
        adapter = UndetectedAdapter()
        strategy = AsyncPlaywrightCrawlerStrategy(browser_config=browser_config, browser_adapter=adapter)
        return AsyncWebCrawler(crawler_strategy=strategy, config=browser_config)
    return AsyncWebCrawler(config=browser_config)

def build_series_run_config(respect_robots: bool) -> CrawlerRunConfig:
    return CrawlerRunConfig(
        check_robots_txt=respect_robots,
        cache_mode=CacheMode.BYPASS,
        wait_until="networkidle",
        scan_full_page=True,
        wait_for_images=False,
        scroll_delay=0.35,
        mean_delay=0.45,
        max_range=0.9,
        magic=True,
        simulate_user=True,
        virtual_scroll_config=VirtualScrollConfig(
            container_selector="body",
            scroll_count=14,
            wait_after_scroll=0.25
        ),
        js_code=r"""
            (()=>{
              const tab = document.querySelector('[data-tab="manga-chapters-holder"], a[href*="#manga-chapters-holder"]');
              if (tab) { try{ tab.click(); }catch(e){} }

              const clickAll = (sel) => document.querySelectorAll(sel).forEach(b=>{ try{ b.click(); }catch(e){} });
              clickAll('[aria-label*="Accept"], [aria-label*="Accepter"], button.cookie, .cky-btn-accept, .cm-btn-inverted, .fc-cta-consent');

              let i=0;
              const tryLoadMore = ()=>{
                const btns = Array.from(document.querySelectorAll(
                  '.btn-load-chapters, .load-more, button[aria-label*="more"], a[aria-label*="more"]'
                ));
                if(btns.length){ btns.forEach(b=>{ try{ b.click(); }catch(e){} }); }
                if(++i<20) setTimeout(tryLoadMore, 600);
              };
              tryLoadMore();
            })();
        """,
        verbose=False,
    )

def build_chapter_run_config(respect_robots: bool) -> CrawlerRunConfig:
    return CrawlerRunConfig(
        check_robots_txt=respect_robots,
        cache_mode=CacheMode.BYPASS,
        wait_until="networkidle",
        scan_full_page=True,
        wait_for_images=True,
        scroll_delay=0.35,
        mean_delay=0.5,
        max_range=1.0,
        magic=True,
        simulate_user=True,
        remove_overlay_elements=True,
        js_code=r"""
            (()=>{
              document.querySelectorAll('img[loading], img[data-src], img[data-lazy-src], img[data-original], img[data-cfsrc]')
                .forEach(img => { 
                  try {
                    img.loading='eager'; 
                    img.decoding='sync'; 
                    if(img.dataset) { 
                      img.src = img.dataset.src || img.dataset.lazySrc || img.dataset.original || img.dataset.cfsrc || img.src; 
                    }
                  } catch(e){}
                });
              let y=0, k=0;
              const tick=()=>{ window.scrollTo(0, y+=800); if(++k<30) setTimeout(tick, 250); };
              tick();
            })();
        """,
        verbose=False,
    )

# =========================
#   EXTRACTION SERIE/HTML
# =========================

def extract_chapter_links_from_html(html_src: str, base_url: str) -> list[str]:
    if not html_src:
        return []
    root = html.fromstring(html_src)
    hrefs = []
    for xp in SERIES_XPATHS:
        try:
            hrefs.extend(root.xpath(xp))
        except Exception:
            pass
    out, seen = [], set()
    for h in hrefs:
        u = normalize_url(h, base_url)
        if u and is_chapter_url(u) and u not in seen:
            seen.add(u); out.append(u)
    out = sorted(out, key=lambda u: extract_chapter_number(u))
    return out

async def collect_chapter_links_via_browser(crawler: AsyncWebCrawler, start_url: str, respect_robots: bool) -> list[str]:
    result = await crawler.arun(url=start_url, config=build_series_run_config(respect_robots))
    if not result.success:
        raise RuntimeError(f"Échec série (browser): {result.error_message}")
    internal = [normalize_url((ln.get('href') or ''), start_url) for ln in result.links.get('internal', [])]
    by_links = [u for u in internal if is_chapter_url(u)]
    by_html = extract_chapter_links_from_html(result.cleaned_html or result.html or "", start_url)
    all_u = sorted(set(by_links + by_html), key=lambda u: extract_chapter_number(u))
    return all_u

async def collect_chapter_links_via_scrapeops(start_url: str, api_key: str, country: str, render_js: bool, proxy: str | None) -> list[str]:
    html_src = await so_fetch_html(start_url, api_key, country=country, render_js=render_js, proxy=proxy)
    return extract_chapter_links_from_html(html_src, start_url)

# =========================
#   EXTRACTION IMAGES
# =========================

def extract_images_from_html(chapter_url: str, html_src: str) -> list[str]:
    imgs = []
    if not html_src:
        return imgs
    try:
        root = html.fromstring(html_src)
        for xp in IMAGE_XPATHS:
            for el in root.xpath(xp):
                src = pick_best_src_from_imgnode(el)
                if src:
                    imgs.append(normalize_url(src, chapter_url))
    except Exception:
        pass
    seen, ordered = set(), []
    for u in imgs:
        if u and u not in seen:
            seen.add(u); ordered.append(u)
    return ordered

async def extract_images_via_scrapeops(chapter_url: str, api_key: str, country: str, render_js: bool, proxy: str | None) -> list[str]:
    html_src = await so_fetch_html(chapter_url, api_key, country=country, render_js=render_js, proxy=proxy)
    return extract_images_from_html(chapter_url, html_src)

# =========================
#   DOWNLOAD IMAGES
# =========================

async def download_one(client: httpx.AsyncClient, url: str, dest: Path, referer: str, idx: int):
    idx_name = f"{idx:03d}"
    ext = os.path.splitext(urlparse(url).path)[1]
    if not IMG_EXT_RE.search(ext):
        ext = ".jpg"
    out = dest / f"{idx_name}{ext}"
    for attempt in range(3):
        try:
            r = await client.get(url, headers={"Referer": referer}, timeout=60)
            r.raise_for_status()
            out.write_bytes(r.content)
            return
        except Exception:
            if attempt == 2:
                raise

async def download_images(images: list[str], out_dir: Path, referer: str, concurrency: int = 8, proxy: str | None = None):
    """Téléchargement DIRECT (pas ScrapeOps)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    limits = httpx.Limits(max_connections=concurrency)
    client = await _HttpxCompat.open(timeout=60, http2=True, proxy=proxy, limits=limits)
    async with client:
        tasks = [download_one(client, img_url, out_dir, referer, i) for i, img_url in enumerate(images, start=1)]
        await tqdm_asyncio.gather(*tasks, desc=f"Téléchargement ({out_dir.name})", leave=False)

# -------- Option B : Full ScrapeOps + throttle anti-429 --------

async def download_one_via_scrapeops_with_client(
    client: httpx.AsyncClient,
    url: str,
    dest: Path,
    idx: int,
    api_key: str,
    country: str,
    render_js: bool,
    limiter: "RateLimiter",
    max_retries: int,
):
    idx_name = f"{idx:03d}"
    ext = os.path.splitext(urlparse(url).path)[1]
    if not IMG_EXT_RE.search(ext):
        ext = ".jpg"
    out = dest / f"{idx_name}{ext}"

    backoff = 1.0
    for attempt in range(max_retries):
        await limiter.wait()
        resp = await _scrapeops_get(client, url, api_key, country, render_js)
        status = resp.status_code

        if status == 200:
            out.write_bytes(resp.content)
            return

        if status == 429:
            ra = resp.headers.get("Retry-After")
            try:
                sleep_for = float(ra)
            except (TypeError, ValueError):
                sleep_for = backoff
                backoff = min(backoff * 1.8, 15.0)
            await asyncio.sleep(sleep_for)
            continue

        if 500 <= status < 600:
            await asyncio.sleep(backoff)
            backoff = min(backoff * 1.8, 15.0)
            continue

        resp.raise_for_status()

    raise RuntimeError(f"ScrapeOps: dépassement des retries pour {url}")

async def download_images_scrapeops(
    images: list[str],
    out_dir: Path,
    concurrency: int,
    api_key: str,
    country: str,
    render_js: bool,
    proxy: str | None,
    qps: float = 1.0,
    max_retries: int = 6,
):
    """Téléchargement via ScrapeOps (throttlé pour éviter 429)."""
    out_dir.mkdir(parents=True, exist_ok=True)

    limiter = RateLimiter(qps)
    sem = asyncio.Semaphore(max(1, min(concurrency, 3)))  # limite la pression côté API

    client = await _HttpxCompat.open(timeout=180, http2=False, proxy=proxy)
    async with client:
        async def _task(i, url):
            async with sem:
                await download_one_via_scrapeops_with_client(
                    client, url, out_dir, i, api_key, country, render_js, limiter, max_retries
                )

        await tqdm_asyncio.gather(
            *[_task(i, u) for i, u in enumerate(images, start=1)],
            desc=f"Téléchargement ({out_dir.name})", leave=False
        )

# =========================
#        PIPELINE
# =========================

async def scrape_series(args, out_root: Path):
    # Si ScrapeOps est demandé quelque part, vérifie la clé
    if (args.series_via in ("auto","scrapeops")
        or args.chapters_via in ("auto","scrapeops")
        or args.images_via == "scrapeops"):
        if not (args.scrapeops_key or os.getenv("SCRAPEOPS_API_KEY")):
            raise RuntimeError("ScrapeOps requis mais aucune clé fournie (--scrapeops-key ou env SCRAPEOPS_API_KEY).")

    # Ne crée le navigateur que si nécessaire
    need_browser = (args.series_via in ("auto","browser")) or (args.chapters_via in ("auto","browser"))
    if need_browser:
        downloads_dir = out_root / "_tmp_dl"
        bcfg = build_browser_config(
            downloads_dir,
            headless=not args.headless_off,
            profile_dir=args.profile_dir,
            use_managed=args.use_managed,
            cdp_url=args.cdp,
            stealth=args.stealth,
            proxy=args.proxy,
        )
        crawler_cm = make_crawler(bcfg, use_undetected=args.undetected)
    else:
        downloads_dir = None
        bcfg = None
        crawler_cm = None

    # ----- Collecte chapitres -----
    chapter_urls = []
    if args.series_via in ("auto", "browser"):
        try:
            async with crawler_cm as crawler:
                chapter_urls = await collect_chapter_links_via_browser(crawler, args.start, respect_robots=(not args.no_robots))
        except Exception as e:
            if args.series_via == "browser":
                print(f"[series via browser] erreur: {e}")
            else:
                print(f"[auto] browser KO, tentative ScrapeOps …")

    api_key = args.scrapeops_key or os.getenv("SCRAPEOPS_API_KEY", "")
    country = args.scrapeops_country
    render_js = bool(args.scrapeops_render_js)
    forward_proxy = args.proxy

    if (not chapter_urls) and args.series_via in ("auto", "scrapeops"):
        chapter_urls = await collect_chapter_links_via_scrapeops(args.start, api_key, country, render_js, forward_proxy)

    if not chapter_urls:
        print("Aucun chapitre détecté.")
        return

    if args.max:
        chapter_urls = chapter_urls[:args.max]

    series_slug = slugify(urlparse(args.start).path.strip("/").split("/")[-1] or "serie")
    series_dir = out_root / series_slug
    series_dir.mkdir(parents=True, exist_ok=True)

    # ----- Extraction + téléchargement images -----
    if args.chapters_via in ("auto", "browser"):
        async with make_crawler(bcfg, use_undetected=args.undetected) as crawler:
            for chap_url in chapter_urls:
                chap_no = extract_chapter_number(chap_url)
                chap_name = f"chapitre_{chap_no:03d}" if chap_no > 0 else slugify(chap_url.rstrip('/').split('/')[-1])
                chap_dir = series_dir / chap_name
                print(f"→ Chapitre: {chap_name} | {chap_url}")

                # HTML via navigateur, mais téléchargement selon images_via
                result = await crawler.arun(url=chap_url, config=build_chapter_run_config(respect_robots=(not args.no_robots)))
                if not result.success:
                    print(f"  ! Échec chapitre (browser): {result.error_message}")
                    continue

                imgs = []
                for img in result.media.get("images", []):
                    src = img.get("src")
                    if src:
                        imgs.append(normalize_url(src, chap_url))
                html_src = result.cleaned_html or result.html or ""
                imgs += extract_images_from_html(chap_url, html_src)

                seen, ordered = set(), []
                for u in imgs:
                    if u and u not in seen:
                        seen.add(u); ordered.append(u)

                if not ordered:
                    print("  ! Aucune image trouvée.")
                    continue

                try:
                    if args.images_via == "scrapeops":
                        await download_images_scrapeops(
                            ordered, chap_dir,
                            concurrency=args.concurrency,
                            api_key=api_key,
                            country=country,
                            render_js=render_js,
                            proxy=forward_proxy,
                            qps=args.scrapeops_qps,
                            max_retries=args.scrapeops_max_retries,
                        )
                    else:
                        await download_images(ordered, chap_dir, referer=chap_url, concurrency=args.concurrency, proxy=forward_proxy)
                    print(f"  ✓ {len(ordered)} images (browser) → {chap_dir}")
                except Exception as e:
                    print(f"  ! Download error: {e}")
    else:
        # Full ScrapeOps (Option B)
        for chap_url in chapter_urls:
            chap_no = extract_chapter_number(chap_url)
            chap_name = f"chapitre_{chap_no:03d}" if chap_no > 0 else slugify(chap_url.rstrip('/').split('/')[-1])
            chap_dir = series_dir / chap_name
            print(f"→ Chapitre: {chap_name} | {chap_url}")

            images = await extract_images_via_scrapeops(chap_url, api_key, country, render_js, forward_proxy)
            if not images:
                print("  ! Aucune image trouvée.")
                continue

            try:
                await download_images_scrapeops(
                    images, chap_dir,
                    concurrency=args.concurrency,
                    api_key=api_key,
                    country=country,
                    render_js=render_js,
                    proxy=forward_proxy,
                    qps=args.scrapeops_qps,
                    max_retries=args.scrapeops_max_retries,
                )
                print(f"  ✓ {len(images)} images (scrapeops) → {chap_dir}")
            except Exception as e:
                print(f"  ! Download error: {e}")

    # Nettoyage
    try:
        if downloads_dir and downloads_dir.exists():
            for f in downloads_dir.glob("*"):
                f.unlink()
            downloads_dir.rmdir()
    except Exception:
        pass

# =========================
#          CLI
# =========================

def main():
    p = argparse.ArgumentParser(description="Scraper Madara/WP-Manga (chapitres + images) — FULL ScrapeOps throttle (Option B)")
    # requis
    p.add_argument("--start", required=True, help="URL série (ex: https://manga-scantrad.io/manga/regressor-instruction-manual/)")
    p.add_argument("--out", default="data_out", help="Dossier de sortie")

    # règles / limites
    p.add_argument("--no-robots", action="store_true", help="Ne pas respecter robots.txt")
    p.add_argument("--max", type=int, default=None, help="Limiter le nombre de chapitres")
    p.add_argument("--concurrency", type=int, default=2, help="Téléchargements concurrents (2 recommandé en full ScrapeOps)")

    # navigateur / anti-bot (non utilisés en full ScrapeOps, mais disponibles)
    p.add_argument("--headless-off", action="store_true", help="Voir le navigateur")
    p.add_argument("--stealth", action="store_true", help="Activer le mode furtif (Playwright stealth)")
    p.add_argument("--undetected", action="store_true", help="Utiliser l'adapter undetected (si dispo)")
    p.add_argument("--profile-dir", help="Dossier profil Playwright")
    p.add_argument("--use-managed", action="store_true", help="Utiliser navigateur géré (profil persistant)")
    p.add_argument("--cdp", help="CDP URL (attacher à un Chrome déjà ouvert)")
    p.add_argument("--proxy", help="Proxy forward (ex: http://user:pass@host:port ou socks5://host:port)")

    # voies de récupération (pour Option B: tous sur ScrapeOps)
    p.add_argument("--series-via", choices=["auto", "browser", "scrapeops"], default="scrapeops",
                   help="Comment récupérer la liste des chapitres")
    p.add_argument("--chapters-via", choices=["auto", "browser", "scrapeops"], default="scrapeops",
                   help="Comment récupérer les pages chapitres")
    p.add_argument("--images-via", choices=["direct", "scrapeops"], default="scrapeops",
                   help="Comment télécharger les images")

    # ScrapeOps
    p.add_argument("--scrapeops-key", help="Clé API ScrapeOps (sinon SCRAPEOPS_API_KEY)")
    p.add_argument("--scrapeops-country", default="fr", help="Pays ScrapeOps (fr, us, ...)")
    p.add_argument("--scrapeops-render-js", action="store_true", help="Activer le rendu JS côté ScrapeOps")
    p.add_argument("--scrapeops-qps", type=float, default=1.0, help="Requêtes/seconde max vers ScrapeOps (images)")
    p.add_argument("--scrapeops-max-retries", type=int, default=8, help="Nombre max de tentatives par image via ScrapeOps")

    args = p.parse_args()

    out_root = Path(args.out).resolve()
    out_root.mkdir(parents=True, exist_ok=True)

    try:
        asyncio.run(scrape_series(args, out_root))
    except KeyboardInterrupt:
        print("\nInterrompu.")
        sys.exit(1)

if __name__ == "__main__":
    main()
