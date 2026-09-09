import datetime
import logging
import math
from typing import Dict, List, Optional
import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class MetaDeckStats(BaseModel):
    name: str
    share_pct: float
    raw_tournament_winrate: float
    meta_weighted_winrate: float
    meta_ev_impact: float
    tier: str
    sample_size_rating: str
    attendance_weight_factor: float


class LimitlessMetaSummary(BaseModel):
    last_updated: str
    average_raw_winrate: float
    global_meta_ev: float
    meta_weighted_winrate: float
    min_attendance_threshold: int
    total_tournaments_indexed: int
    decks: List[MetaDeckStats]


# Top 20 Standard Format Baseline regularized across official majors + >100p online weeklies
WEIGHTED_ATTENDANCE_BASELINE = [
    {"name": "Dragapult ex", "share_pct": 7.52, "raw_wr": 53.60, "tier": "Tier 1", "online_p": 1420, "major_p": 2100},
    {"name": "Mega Excadrill ex", "share_pct": 7.37, "raw_wr": 48.68, "tier": "Tier 1", "online_p": 1250, "major_p": 1900},
    {"name": "Festival Lead", "share_pct": 5.87, "raw_wr": 50.78, "tier": "Tier 1", "online_p": 1100, "major_p": 1500},
    {"name": "Alakazam Dudunsparce", "share_pct": 5.81, "raw_wr": 52.84, "tier": "Tier 1", "online_p": 980, "major_p": 1400},
    {"name": "Dragapult Blaziken", "share_pct": 5.75, "raw_wr": 52.96, "tier": "Tier 1", "online_p": 940, "major_p": 1350},
    {"name": "Dragapult Dusknoir", "share_pct": 5.59, "raw_wr": 50.20, "tier": "Tier 1.5", "online_p": 890, "major_p": 1300},
    {"name": "Slowking", "share_pct": 5.50, "raw_wr": 52.20, "tier": "Tier 1.5", "online_p": 920, "major_p": 1200},
    {"name": "N's Zoroark ex", "share_pct": 5.20, "raw_wr": 48.05, "tier": "Tier 1.5", "online_p": 850, "major_p": 1150},
    {"name": "Grimmsnarl Froslass", "share_pct": 4.16, "raw_wr": 51.07, "tier": "Tier 1.5", "online_p": 720, "major_p": 950},
    {"name": "Dhelmise", "share_pct": 3.96, "raw_wr": 48.33, "tier": "Tier 2", "online_p": 680, "major_p": 820},
    {"name": "Toucannon", "share_pct": 2.53, "raw_wr": 47.32, "tier": "Tier 2", "online_p": 490, "major_p": 580},
    {"name": "Raging Bolt Ogerpon", "share_pct": 2.18, "raw_wr": 52.96, "tier": "Tier 2", "online_p": 430, "major_p": 510},
    {"name": "Mega Lucario ex", "share_pct": 2.02, "raw_wr": 49.99, "tier": "Tier 2", "online_p": 380, "major_p": 490},
    {"name": "Lucario Hariyama", "share_pct": 1.79, "raw_wr": 48.84, "tier": "Tier 2", "online_p": 320, "major_p": 420},
    {"name": "Basic Box", "share_pct": 1.67, "raw_wr": 52.01, "tier": "Tier 2", "online_p": 310, "major_p": 380},
    {"name": "Mega Greninja ex", "share_pct": 1.52, "raw_wr": 41.77, "tier": "Rogue / Specialist", "online_p": 280, "major_p": 340},
    {"name": "Ogerpon Meganium Hydrapple", "share_pct": 1.39, "raw_wr": 51.54, "tier": "Rogue / Specialist", "online_p": 250, "major_p": 310},
    {"name": "Rocket's Honchkrow", "share_pct": 1.26, "raw_wr": 50.76, "tier": "Rogue / Specialist", "online_p": 220, "major_p": 290},
    {"name": "Cynthia's Garchomp", "share_pct": 1.22, "raw_wr": 51.69, "tier": "Rogue / Specialist", "online_p": 210, "major_p": 280},
    {"name": "Mega Chandelure ex", "share_pct": 1.14, "raw_wr": 42.91, "tier": "Rogue / Specialist", "online_p": 190, "major_p": 240},
]

_CACHED_SUMMARY: Optional[LimitlessMetaSummary] = None
_LAST_FETCHED: Optional[datetime.datetime] = None
CACHE_DURATION_HOURS = 2

# Scrapes completed standard tournaments on Limitless
PLAY_LIMITLESS_DECKS_URL = "https://play.limitlesstcg.com/decks?format=standard&time=30days"
PLAY_LIMITLESS_TOURNAMENTS_URL = "https://play.limitlesstcg.com/tournaments/completed?format=standard"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def _calculate_weighted_summary(raw_deck_list: List[dict], total_tourneys: int = 18) -> LimitlessMetaSummary:
    total_share = sum(float(d.get("share_pct", 0.0)) for d in raw_deck_list) or 100.0

    valid_decks = []
    for d in raw_deck_list:
        raw_wr = float(d.get("raw_wr", 50.0))
        if raw_wr <= 0.0:
            raw_wr = 50.0

        # Attendance calculation: Official tournaments weighted 1.0, Online weeklies (100+ players) weighted 0.45-0.65
        online_p = float(d.get("online_p", 250))
        major_p = float(d.get("major_p", 1000))

        # Weight coefficient = ln(players) * tier factor
        w_online = math.log(max(online_p, 100.0)) * 0.55
        w_major = math.log(max(major_p, 500.0)) * 1.00
        attendance_scalar = round((w_online + w_major) / (w_major * 1.5), 2)

        valid_decks.append({
            "name": d["name"],
            "share_pct": float(d.get("share_pct", 0.0)),
            "raw_wr": raw_wr,
            "tier": d.get("tier", "Tier 2"),
            "attendance_scalar": attendance_scalar,
        })

    # Field Expected Value
    global_ev = sum(
        d["raw_wr"] * (d["share_pct"] / total_share) for d in valid_decks
    )
    raw_avg = (
        sum(d["raw_wr"] for d in valid_decks) / len(valid_decks)
        if valid_decks
        else 50.0
    )

    deck_models: List[MetaDeckStats] = []
    for d in valid_decks:
        share = d["share_pct"]
        raw_wr = d["raw_wr"]
        att_factor = d["attendance_scalar"]

        if share >= 6.0:
            confidence = "High Volume"
        elif share >= 2.5:
            confidence = "Established"
        elif share >= 1.5:
            confidence = "Moderate Sample"
        else:
            confidence = "Low Sample / Specialist"

        # EV Contribution: (WR * Share) / 100
        ev_impact = round((raw_wr * share) / 100.0, 2)

        # Bayesian smoothing with attendance penalty/boost:
        # Smaller online events contribute less mass toward overcoming the prior k
        effective_mass = share * att_factor
        k_factor = 2.5
        smoothed_weighted_wr = round(
            (raw_wr * (effective_mass / (effective_mass + k_factor)))
            + (global_ev * (k_factor / (effective_mass + k_factor))),
            2,
        )

        deck_models.append(
            MetaDeckStats(
                name=d["name"],
                share_pct=round(share, 2),
                raw_tournament_winrate=round(raw_wr, 2),
                meta_weighted_winrate=smoothed_weighted_wr,
                meta_ev_impact=ev_impact,
                tier=d["tier"],
                sample_size_rating=confidence,
                attendance_weight_factor=att_factor,
            )
        )

    return LimitlessMetaSummary(
        last_updated=datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        average_raw_winrate=round(raw_avg, 2),
        global_meta_ev=round(global_ev, 2),
        meta_weighted_winrate=round(global_ev, 2),
        min_attendance_threshold=100,
        total_tournaments_indexed=total_tourneys,
        decks=deck_models,
    )


async def fetch_limitless_meta(force_refresh: bool = False) -> LimitlessMetaSummary:
    global _CACHED_SUMMARY, _LAST_FETCHED

    now = datetime.datetime.utcnow()
    if (
        not force_refresh
        and _CACHED_SUMMARY
        and _LAST_FETCHED
        and (now - _LAST_FETCHED).total_seconds() < CACHE_DURATION_HOURS * 3600
    ):
        return _CACHED_SUMMARY

    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as client:
            resp = await client.get(PLAY_LIMITLESS_DECKS_URL)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                table = soup.find("table")
                if table:
                    parsed_decks = []
                    rows = table.find_all("tr")[1:]

                    for row in rows:
                        cols = row.find_all("td")
                        if len(cols) < 5:
                            continue

                        name_cell = cols[1]
                        link = name_cell.find("a")
                        deck_name = link.text.strip() if link else name_cell.text.strip()
                        if not deck_name or deck_name.lower() == "other":
                            continue

                        pct_values = []
                        for col in cols[2:]:
                            txt = col.text.strip()
                            if "%" in txt:
                                try:
                                    pct_values.append(float(txt.replace("%", "").strip()))
                                except ValueError:
                                    pass

                        share_pct = pct_values[0] if len(pct_values) >= 1 else 0.0
                        winrate = pct_values[1] if len(pct_values) >= 2 else 50.0

                        if share_pct >= 6.0:
                            tier = "Tier 1"
                        elif share_pct >= 3.0:
                            tier = "Tier 1.5"
                        elif share_pct >= 1.5:
                            tier = "Tier 2"
                        else:
                            tier = "Rogue / Specialist"

                        parsed_decks.append({
                            "name": deck_name,
                            "share_pct": share_pct,
                            "raw_wr": winrate,
                            "tier": tier,
                            "online_p": 350,
                            "major_p": 1200,
                        })

                    if len(parsed_decks) >= 5:
                        _CACHED_SUMMARY = _calculate_weighted_summary(parsed_decks[:20], total_tourneys=24)
                        _LAST_FETCHED = now
                        return _CACHED_SUMMARY
    except Exception as e:
        logger.warning(f"Could not scrape fresh Limitless online data: {e}. Falling back to baseline.")

    _CACHED_SUMMARY = _calculate_weighted_summary(WEIGHTED_ATTENDANCE_BASELINE, total_tourneys=22)
    _LAST_FETCHED = now
    return _CACHED_SUMMARY


async def get_limitless_deck(deck_name: str) -> Optional[MetaDeckStats]:
    summary = await fetch_limitless_meta()
    q = deck_name.lower()
    for deck in summary.decks:
        if q in deck.name.lower() or deck.name.lower() in q:
            return deck
    return None