import os
import time
import logging
from io import StringIO
import csv

import httpx
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory TTL cache
_cache: dict[str, tuple[float, list[dict]]] = {}

OPENSKY_URL = "https://opensky-network.org/api/states/all"
USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
FIRMS_MAP_KEY = os.environ.get("FIRMS_MAP_KEY", "")
FIRMS_URL = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/world/1" if FIRMS_MAP_KEY else ""

FLIGHTS_TTL = 60        # 1 minute — high update frequency
EARTHQUAKES_TTL = 1800  # 30 minutes — relatively stable
FIRES_TTL = 1800        # 30 minutes — NASA FIRMS updates hourly


def _is_cache_valid(key: str, ttl: int) -> bool:
    """Check if a cache entry exists and has not expired."""
    if key not in _cache:
        return False
    cached_time, _ = _cache[key]
    return (time.time() - cached_time) < ttl


def _parse_bounds(bounds: Optional[str]) -> Optional[tuple[float, float, float, float]]:
    """Parse and validate geographic bounds (west,south,east,north).

    Returns None if bounds are absent or invalid.
    """
    if not bounds:
        return None
    try:
        parts = [float(p) for p in bounds.split(",")]
    except (ValueError, TypeError):
        return None
    if len(parts) != 4:
        return None

    west, south, east, north = parts

    if not (-180 <= west <= 180 and -180 <= east <= 180):
        return None
    if not (-90 <= south <= 90 and -90 <= north <= 90):
        return None
    if north < south:
        return None

    return (west, south, east, north)


def _filter_by_bounds(
    features: list[dict],
    bounds: Optional[str],
) -> list[dict]:
    """Filter features to those within geographic bounds (west,south,east,north)."""
    parsed = _parse_bounds(bounds)
    if parsed is None:
        return features

    west, south, east, north = parsed

    def in_bounds(lon: float, lat: float) -> bool:
        if not (south <= lat <= north):
            return False
        # Handle antimeridian crossing (e.g. west=170, east=-170)
        if west <= east:
            return west <= lon <= east
        return lon >= west or lon <= east

    return [
        f for f in features
        if in_bounds(f["coordinates"][0], f["coordinates"][1])
    ]


@router.get("/geo/flights")
async def get_flights(
    bounds: Optional[str] = Query(default=None, description="west,south,east,north"),
):
    """Fetch live flight positions from OpenSky Network."""
    cache_key = "flights"

    if not _is_cache_valid(cache_key, FLIGHTS_TTL):
        features = await _fetch_flights()
        _cache[cache_key] = (time.time(), features)
    else:
        _, features = _cache[cache_key]

    filtered = _filter_by_bounds(features, bounds)
    return {"type": "flights", "count": len(filtered), "features": filtered}


@router.get("/geo/earthquakes")
async def get_earthquakes(
    bounds: Optional[str] = Query(default=None, description="west,south,east,north"),
):
    """Fetch recent earthquakes from USGS."""
    cache_key = "earthquakes"

    if not _is_cache_valid(cache_key, EARTHQUAKES_TTL):
        features = await _fetch_earthquakes()
        _cache[cache_key] = (time.time(), features)
    else:
        _, features = _cache[cache_key]

    filtered = _filter_by_bounds(features, bounds)
    return {"type": "earthquakes", "count": len(filtered), "features": filtered}


@router.get("/geo/fires")
async def get_fires(
    bounds: Optional[str] = Query(default=None, description="west,south,east,north"),
):
    """Fetch active fire data from NASA FIRMS."""
    cache_key = "fires"

    if not _is_cache_valid(cache_key, FIRES_TTL):
        features = await _fetch_fires()
        _cache[cache_key] = (time.time(), features)
    else:
        _, features = _cache[cache_key]

    filtered = _filter_by_bounds(features, bounds)
    return {"type": "fires", "count": len(filtered), "features": filtered}


@router.get("/geo/health")
async def geo_health():
    """Return cache status for all geo layers."""
    now = time.time()
    status: dict[str, dict] = {}

    for key, ttl in [("flights", FLIGHTS_TTL), ("earthquakes", EARTHQUAKES_TTL), ("fires", FIRES_TTL)]:
        if key in _cache:
            cached_time, features = _cache[key]
            age = now - cached_time
            status[key] = {
                "cached": True,
                "age_seconds": round(age, 1),
                "ttl_seconds": ttl,
                "valid": age < ttl,
                "feature_count": len(features),
            }
        else:
            status[key] = {
                "cached": False,
                "age_seconds": None,
                "ttl_seconds": ttl,
                "valid": False,
                "feature_count": 0,
            }

    return {"status": "ok", "cache": status}


async def _fetch_flights() -> list[dict]:
    """Fetch and normalize flight data from OpenSky Network."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
            resp = await client.get(OPENSKY_URL)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.error("Failed to fetch flights from OpenSky: %s", exc)
        return []

    states = data.get("states") or []
    features: list[dict] = []

    for state in states:
        # state indices: 0=icao24, 1=callsign, 2=origin_country, 3=time_position,
        # 4=last_contact, 5=longitude, 6=latitude, 7=baro_altitude, 8=on_ground,
        # 9=velocity, 10=true_track, 11=vertical_rate, 12=sensors, 13=geo_altitude
        icao24 = state[0]
        longitude = state[5]
        latitude = state[6]

        if longitude is None or latitude is None:
            continue

        callsign = (state[1] or "").strip()
        origin_country = state[2] or ""
        velocity = state[9]
        altitude = state[13] if state[13] is not None else state[7]

        features.append({
            "id": icao24,
            "layerType": "flights",
            "coordinates": [longitude, latitude],
            "properties": {
                "callsign": callsign,
                "origin_country": origin_country,
                "velocity": velocity,
                "altitude": altitude,
            },
            "timestamp": state[4],
        })

    return features


async def _fetch_earthquakes() -> list[dict]:
    """Fetch and normalize earthquake data from USGS GeoJSON feed."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
            resp = await client.get(USGS_URL)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.error("Failed to fetch earthquakes from USGS: %s", exc)
        return []

    raw_features = data.get("features") or []
    features: list[dict] = []

    for feat in raw_features:
        props = feat.get("properties") or {}
        geometry = feat.get("geometry") or {}
        coords = geometry.get("coordinates") or []

        if len(coords) < 2:
            continue

        features.append({
            "id": feat.get("id", ""),
            "layerType": "earthquakes",
            "coordinates": [coords[0], coords[1]],
            "properties": {
                "mag": props.get("mag"),
                "place": props.get("place"),
                "type": props.get("type"),
                "time": props.get("time"),
                "url": props.get("url"),
            },
            "timestamp": props.get("time"),
        })

    return features


async def _fetch_fires() -> list[dict]:
    """Fetch and normalize active fire data from NASA FIRMS CSV."""
    if not FIRMS_MAP_KEY:
        logger.warning("FIRMS_MAP_KEY not configured, fires endpoint disabled")
        return []

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
            resp = await client.get(FIRMS_URL)
            resp.raise_for_status()
            text = resp.text
    except Exception as exc:
        logger.error("Failed to fetch fires from NASA FIRMS: %s", exc)
        return []

    features: list[dict] = []
    reader = csv.DictReader(StringIO(text))

    for i, row in enumerate(reader):
        if i >= 2000:
            break

        try:
            lat = float(row["latitude"])
            lon = float(row["longitude"])
        except (KeyError, ValueError, TypeError):
            continue

        acq_date = row.get("acq_date", "")
        acq_time = row.get("acq_time", "")

        features.append({
            "id": f"fire-{lat}-{lon}-{acq_date}-{acq_time}",
            "layerType": "fires",
            "coordinates": [lon, lat],
            "properties": {
                "brightness": row.get("bright_ti4"),
                "confidence": row.get("confidence"),
                "acq_date": acq_date,
                "satellite": row.get("satellite"),
                "frp": row.get("frp"),
            },
            "timestamp": f"{acq_date}T{acq_time}",
        })

    return features
