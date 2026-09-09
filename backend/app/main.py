from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import Match, User
from .schemas import (
    LogIngestRequest,
    ManualMatchRequest,
    MatchResponse,
    DeckAnalyticsResponse,
    TurnOrderStats,
    MatchupStat,
    UserAuthRequest,
    AuthResponse,
    UserResponse,
)
from .classifier import detect_archetype
from .parser import PTCGLogParser
from .limitless import fetch_limitless_meta, get_limitless_deck, MetaDeckStats, LimitlessMetaSummary
from .auth import hash_password, verify_password, create_access_token, get_current_user

# Auto-create SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PocketMeta API", version="0.1.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "PocketMeta API is running"}


@app.post("/api/matches/ingest-log", response_model=MatchResponse)
def ingest_ptcgl_log(
    request: LogIngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parser = PTCGLogParser(request.raw_log)
    match_data = parser.parse()
    opp_archetype = detect_archetype(match_data["opponent_cards_played"])

    new_match = Match(
        user_id=current_user.id,
        source="ptcgl",
        player_deck=request.my_deck_name,
        opponent_deck=opp_archetype,
        result=match_data["result"],
        went_first=match_data["went_first"],
        prizes_taken=match_data["prizes_taken"],
        prizes_conceded=match_data["prizes_conceded"],
        turns=match_data["turns"],
        notes="Imported from PTCGL log",
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    return new_match


@app.post("/api/matches/manual", response_model=MatchResponse)
def create_manual_match(
    request: ManualMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_match = Match(
        user_id=current_user.id,
        source="locals",
        player_deck=request.my_deck,
        opponent_deck=request.opp_archetype,
        result=request.result.lower(),
        went_first=request.went_first,
        prizes_taken=request.player_prizes,
        prizes_conceded=request.opp_prizes,
        turns=request.turns,
        notes=request.notes,
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    return {
        "id": new_match.id,
        "user_id": new_match.user_id,
        "source": new_match.source,
        "my_deck": new_match.player_deck,
        "opp_archetype": new_match.opponent_deck,
        "result": new_match.result,
        "went_first": new_match.went_first,
        "player_prizes": new_match.prizes_taken,
        "opp_prizes": new_match.prizes_conceded,
        "total_turns": new_match.turns or 0,
        "win_condition": "manual",  # <-- Add this required field
        "notes": new_match.notes,
        "played_at": new_match.played_at,
    }


@app.get("/api/matches", response_model=List[MatchResponse])
def get_matches(
    source: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Match).filter(Match.user_id == current_user.id)
    if source and source != "all":
        query = query.filter(Match.source == source)
    
    matches = query.order_by(Match.played_at.desc()).all()
    
    # Map raw SQLAlchemy Match rows into dictionaries matching MatchResponse schema
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "source": m.source,
            "my_deck": m.player_deck,
            "opp_archetype": m.opponent_deck,
            "result": m.result,
            "went_first": m.went_first,
            "player_prizes": m.prizes_taken,
            "opp_prizes": m.prizes_conceded,
            "total_turns": m.turns or 0,
            "win_condition": "manual",
            "notes": m.notes,
            "played_at": m.played_at,
        }
        for m in matches
    ]


@app.get("/api/analytics/{deck_name}", response_model=DeckAnalyticsResponse)
def get_deck_analytics(
    deck_name: str,
    source: str = "locals",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    matches = (
        db.query(Match)
        .filter(Match.user_id == current_user.id, Match.source == source, Match.player_deck == deck_name)
        .all()
    )

    total_games = len(matches)
    if total_games == 0:
        return DeckAnalyticsResponse(
            deck_name=deck_name,
            total_games=0,
            wins=0,
            losses=0,
            overall_winrate=0.0,
            avg_prizes_taken=0.0,
            avg_prizes_conceded=0.0,
            turn_order_stats=TurnOrderStats(),
            matchups=[],
        )

    wins = sum(1 for m in matches if m.result.lower() == "win")
    losses = total_games - wins
    overall_winrate = round((wins / total_games) * 100, 1)
    avg_prizes_taken = round(sum(m.prizes_taken or 0 for m in matches) / total_games, 2)
    avg_prizes_conceded = round(sum(m.prizes_conceded or 0 for m in matches) / total_games, 2)

    games_first = sum(1 for m in matches if m.went_first)
    wins_first = sum(1 for m in matches if m.went_first and m.result.lower() == "win")
    winrate_first = round((wins_first / games_first * 100), 1) if games_first > 0 else 0.0

    games_second = total_games - games_first
    wins_second = sum(1 for m in matches if not m.went_first and m.result.lower() == "win")
    winrate_second = round((wins_second / games_second * 100), 1) if games_second > 0 else 0.0

    matchups_dict = {}
    for m in matches:
        opp = m.opponent_deck or "Unknown"
        if opp not in matchups_dict:
            matchups_dict[opp] = {"games": 0, "wins": 0, "prizes": 0}
        matchups_dict[opp]["games"] += 1
        if m.result.lower() == "win":
            matchups_dict[opp]["wins"] += 1
        matchups_dict[opp]["prizes"] += (m.prizes_taken or 0)

    matchup_stats = []
    for opp, data in matchups_dict.items():
        g = data["games"]
        w = data["wins"]
        matchup_stats.append(
            MatchupStat(
                opp_archetype=opp,
                total_games=g,
                wins=w,
                losses=g - w,
                winrate=round((w / g * 100), 1) if g > 0 else 0.0,
                avg_prizes_taken=round(data["prizes"] / g, 2) if g > 0 else 0.0,
            )
        )

    return DeckAnalyticsResponse(
        deck_name=deck_name,
        total_games=total_games,
        wins=wins,
        losses=losses,
        overall_winrate=overall_winrate,
        avg_prizes_taken=avg_prizes_taken,
        avg_prizes_conceded=avg_prizes_conceded,
        turn_order_stats=TurnOrderStats(
            games_first=games_first,
            wins_first=wins_first,
            winrate_first=winrate_first,
            games_second=games_second,
            wins_second=wins_second,
            winrate_second=winrate_second,
        ),
        matchups=matchup_stats,
    )


# --- Authentication Endpoints ---
@app.post("/api/auth/register", response_model=AuthResponse)
def register(req: UserAuthRequest, db: Session = Depends(get_db)):
    clean_username = req.username.strip()
    if len(clean_username) < 3 or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Username min 3 chars, password min 4 chars")

    existing = db.query(User).filter(User.username == clean_username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    user = User(username=clean_username, password_hash=hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.username)
    return AuthResponse(token=token, user=UserResponse.from_orm(user))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: UserAuthRequest, db: Session = Depends(get_db)):
    clean_username = req.username.strip()
    user = db.query(User).filter(User.username == clean_username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(user.id, user.username)
    return AuthResponse(token=token, user=UserResponse.from_orm(user))


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)


# --- Limitless Endpoints ---
@app.get("/api/limitless/meta", response_model=LimitlessMetaSummary)
async def get_global_meta(refresh: bool = Query(False, description="Force re-scrape")):
    return await fetch_limitless_meta(force_refresh=refresh)


@app.get("/api/limitless/{deck_name}", response_model=Optional[MetaDeckStats])
async def get_global_deck_stat(deck_name: str):
    deck = await get_limitless_deck(deck_name)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found in Limitless meta")
    return deck
@app.post("/api/matches/manual", response_model=MatchResponse)
def create_manual_match(
    request: ManualMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_match = Match(
        user_id=current_user.id,
        source="locals",
        player_deck=request.my_deck,
        opponent_deck=request.opp_archetype,
        result=request.result.lower(),
        went_first=request.went_first,
        prizes_taken=request.player_prizes,
        prizes_conceded=request.opp_prizes,
        turns=request.turns,
        notes=request.notes,
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    # Return a dictionary or object matching MatchResponse fields if names differ:
    return {
        "id": new_match.id,
        "user_id": new_match.user_id,
        "source": new_match.source,
        "my_deck": new_match.player_deck,
        "opp_archetype": new_match.opponent_deck,
        "result": new_match.result,
        "went_first": new_match.went_first,
        "player_prizes": new_match.prizes_taken,
        "opp_prizes": new_match.prizes_conceded,
        "turns": new_match.turns,
        "total_turns": new_match.turns or 0,
        "notes": new_match.notes,
        "played_at": new_match.played_at,
    }

@app.delete("/api/matches/{match_id}")
def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    db.delete(match)
    db.commit()
    return {"status": "success", "message": f"Match {match_id} deleted successfully"}