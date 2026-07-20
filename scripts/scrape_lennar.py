#!/usr/bin/env python3
"""
scrape_lennar.py — Saca comunidades + modelos de casa de NewHomeSource
y los guarda en 2 CSV con el formato exacto del importador de Previax.

Fuente: NewHomeSource (agrega el inventario de los builders y se actualiza
a diario). Es público. Sé respetuoso: el script hace pausas entre requests.

USO:
    python3 scrape_lennar.py

No requiere instalar nada (solo librería estándar de Python 3).

CONFIG rápida (más abajo en MARKETS / BUILDER):
- Cambia BUILDER_SLUG / BUILDER_ID para otro builder.
- Agrega o quita mercados en MARKETS.

SALIDA (en la carpeta desde donde lo corras):
- comunidades-scraped.csv   -> columnas: builder, community_name, city,
      description, main_highlight, amenities, lenders, tags, youtube_url
- modelos-scraped.csv        -> columnas: community, name, description,
      youtube_url, price, bedrooms, bathrooms, sqft

Las listas dentro de una celda (amenities, tags) usan ';' — igual que el
importador de Previax.
"""

import csv
import json
import re
import sys
import time
import urllib.request
import urllib.error

# ------------------------------------------------------------------ CONFIG
BUILDER_NAME = "Lennar"            # como aparecerá en la columna "builder"
BUILDER_SLUG = "lennar"           # slug en la URL de NewHomeSource
BUILDER_ID   = "644"              # id del builder en NewHomeSource
DEFAULT_LENDER = "Lennar Mortgage"

# (estado, slug-de-mercado). Agrega los que quieras.
MARKETS = [
    ("nc", "greensboro-winston-salem-high-point-area"),
    ("nc", "charlotte-area"),
    ("nc", "raleigh-durham-chapel-hill-area"),
]

BASE = "https://www.newhomesource.com"
SLEEP_SECONDS = 1.5               # pausa entre requests (sé amable)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")

# ------------------------------------------------------------------ HTTP
def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            print(f"  ! intento {attempt+1} falló para {url}: {e}", file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    return ""

def get_next_data(html):
    """NewHomeSource es Next.js: los datos vienen en __NEXT_DATA__ (JSON)."""
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None

# ------------------------------------------------------------------ helpers de parseo
def walk(obj):
    """Recorre recursivamente un objeto JSON produciendo cada dict."""
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from walk(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v)

def fuzzy(d, *needles):
    """Devuelve el primer valor cuyo nombre de clave contenga alguno de los needles."""
    for k, v in d.items():
        kl = k.lower()
        if any(n in kl for n in needles) and v not in (None, "", []):
            return v
    return None

def strip_tags(html):
    html = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', html, flags=re.S)
    text = re.sub(r'<[^>]+>', '\n', html)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&#39;|&rsquo;', "'", text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n+', '\n', text)
    return text

# ------------------------------------------------------------------ descubrir comunidades
def discover_community_urls(state, market):
    """Devuelve URLs únicas de detalle de comunidad para el builder en un mercado."""
    urls, page = [], 1
    seen = set()
    while True:
        list_url = (f"{BASE}/communities/{state}/{market}/"
                    f"builder-{BUILDER_SLUG}-{BUILDER_ID}?page={page}")
        html = fetch(list_url)
        time.sleep(SLEEP_SECONDS)
        found = re.findall(r'href="(/community/[a-z]{2}/[^"]+?/\d+)"', html)
        new = [u for u in found if u not in seen]
        for u in new:
            seen.add(u); urls.append(BASE + u)
        # si esta página no agregó nada nuevo, terminamos
        if not new or page > 10:
            break
        page += 1
    return urls

# ------------------------------------------------------------------ parsear una comunidad
def parse_community(url):
    html = fetch(url)
    time.sleep(SLEEP_SECONDS)
    data = get_next_data(html)

    community = {"builder": BUILDER_NAME, "url": url}
    plans = []

    # --- Estrategia A: __NEXT_DATA__ (lo más confiable) ---
    if data:
        # nombre + ciudad + precio de la comunidad
        for d in walk(data):
            if community.get("name"):
                break
            name = fuzzy(d, "communityname", "community_name")
            if name and isinstance(name, str):
                community["name"] = name
                community["city"] = fuzzy(d, "city") or ""
                community["state"] = fuzzy(d, "stateabbr", "state") or ""
                community["price"] = fuzzy(d, "startingprice", "fromprice", "minprice", "price")
                community["description"] = fuzzy(d, "description", "overview") or ""
        # planes: dicts con beds + baths + sqft + nombre
        for d in walk(data):
            beds = fuzzy(d, "bedroom", "beds")
            sqft = fuzzy(d, "squarefoot", "sqft", "squarefeet")
            pname = fuzzy(d, "planname", "name")
            if beds and sqft and pname and isinstance(pname, str):
                plans.append({
                    "name": pname,
                    "price": fuzzy(d, "startingprice", "fromprice", "price"),
                    "beds": beds,
                    "baths": fuzzy(d, "bathroom", "baths"),
                    "sqft": sqft,
                })

    # --- Estrategia B: fallback por texto visible ---
    if not community.get("name") or not plans:
        text = strip_tags(html)
        if not community.get("name"):
            m = re.search(r'\n([^\n]+?)\n[\d]+ [^\n]*?,\s*[A-Z]{2},\s*\d{5}', text)
            community.setdefault("name", (m.group(1).strip() if m else url.rsplit("/",2)[-2]))
        if not community.get("city"):
            m = re.search(r',\s*([A-Za-z .\-]+),\s*([A-Z]{2}),\s*\d{5}', text)
            if m:
                community["city"] = m.group(1).strip()
                community["state"] = m.group(2)
        if community.get("price") in (None, ""):
            m = re.search(r'From \$([\d,]+)', text)
            community["price"] = m.group(1).replace(",", "") if m else ""
        if not plans:
            # bloque de "Floor plans" hasta "Quick move-ins" o "Neighborhood"
            block = text
            s = re.search(r'Floor plans?\s*\(\d+\)', text)
            e = re.search(r'(Quick move-ins|Neighborhood|Amenities)', text)
            if s:
                block = text[s.end(): e.start() if e else len(text)]
            for pm in re.finditer(
                r'\n([A-Z][A-Za-z0-9&\'\.\- ]{1,40}?)\n+From \$([\d,]+)'
                r'[\s\S]{0,80}?(\d+)\s*Beds[\s\S]{0,40}?([\d.]+)\s*Baths'
                r'[\s\S]{0,80}?([\d,]+)\s*(?:SqFt|Sq Ft)',
                block):
                plans.append({
                    "name": pm.group(1).strip(),
                    "price": pm.group(2).replace(",", ""),
                    "beds": pm.group(3),
                    "baths": pm.group(4),
                    "sqft": pm.group(5).replace(",", ""),
                })

    # amenities + youtube (del texto)
    text = strip_tags(html)
    am = re.search(r'Community amenities([\s\S]{0,300}?)(About|Get more)', text)
    amenities = []
    if am:
        for line in am.group(1).split("\n"):
            line = line.strip("-• \t")
            if 2 < len(line) < 30 and line[0:1].isupper():
                amenities.append(line)
    community["amenities"] = ";".join(dict.fromkeys(amenities))
    yt = re.search(r'(?:youtube\.com/(?:embed/|watch\?v=)|img\.youtube\.com/vi/)([\w-]{11})', html)
    community["youtube"] = f"https://www.youtube.com/watch?v={yt.group(1)}" if yt else ""

    # limpiar precio
    p = str(community.get("price") or "").replace(",", "").replace("$", "")
    community["price"] = re.sub(r"\D", "", p)

    # tag por tipo
    n = (community.get("name") or "").lower()
    community["tags"] = ("townhomes" if "townes" in n or "townhome" in n
                         else "55-plus" if "55+" in n or "active adult" in n
                         else "single-family")
    return community, plans

# ------------------------------------------------------------------ main
def main():
    comm_rows, model_rows = [], []
    seen_comm = set()

    for state, market in MARKETS:
        print(f"\n== Mercado: {market} ({state}) ==")
        urls = discover_community_urls(state, market)
        print(f"   {len(urls)} comunidades encontradas")
        for i, url in enumerate(urls, 1):
            c, plans = parse_community(url)
            name = c.get("name", "").strip()
            if not name or name in seen_comm:
                continue
            seen_comm.add(name)
            city = c.get("city", "")
            st = c.get("state", state.upper())
            city_full = f"{city}, {st}".strip(", ")
            price = c.get("price", "")
            comm_rows.append({
                "builder": BUILDER_NAME,
                "community_name": name,
                "city": city_full,
                "description": (c.get("description") or "")[:500],
                "main_highlight": f"Desde ${int(price):,}" if price.isdigit() else "",
                "amenities": c.get("amenities", ""),
                "lenders": DEFAULT_LENDER,
                "tags": c.get("tags", ""),
                "youtube_url": c.get("youtube", ""),
            })
            for p in plans:
                pr = re.sub(r"\D", "", str(p.get("price") or ""))
                model_rows.append({
                    "community": name,
                    "name": p["name"],
                    "description": "",
                    "youtube_url": "",
                    "price": pr,
                    "bedrooms": p.get("beds", ""),
                    "bathrooms": p.get("baths", ""),
                    "sqft": re.sub(r"\D", "", str(p.get("sqft") or "")),
                })
            print(f"   [{i}/{len(urls)}] {name}: {len(plans)} modelos")

    with open("comunidades-scraped.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=[
            "builder","community_name","city","description",
            "main_highlight","amenities","lenders","tags","youtube_url"])
        w.writeheader(); w.writerows(comm_rows)

    with open("modelos-scraped.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=[
            "community","name","description","youtube_url",
            "price","bedrooms","bathrooms","sqft"])
        w.writeheader(); w.writerows(model_rows)

    print(f"\n✅ Listo: {len(comm_rows)} comunidades, {len(model_rows)} modelos.")
    print("   -> comunidades-scraped.csv")
    print("   -> modelos-scraped.csv")

if __name__ == "__main__":
    main()
