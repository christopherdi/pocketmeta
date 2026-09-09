from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class LogIngestRequest(BaseModel):
    username: str
    my_deck: str
    opp_archetype: Optional[str] = "Unknown"
    raw_log: str


class MatchResponse(BaseModel):
    id: int
    user_id: int
    source: str
    my_deck: str
    opp_archetype: str
    result: str
    went_first: bool
    player_prizes: int
    opp_prizes: int
    total_turns: int
    win_condition: str
    notes: Optional[str] = None
    played_at: datetime

    class Config:
        from_attributes = True

class TurnOrderStats(BaseModel):
    games_first: int = 0
    wins_first: int = 0
    winrate_first: float = 0.0
    games_second: int = 0
    wins_second: int = 0
    winrate_second: float = 0.0

class MatchupStat(BaseModel):
    opp_archetype: str
    total_games: int
    wins: int
    losses: int
    winrate: float
    avg_prizes_taken: float

class DeckAnalyticsResponse(BaseModel):
    deck_name: str
    total_games: int
    wins: int
    losses: int
    overall_winrate: float
    avg_prizes_taken: float
    avg_prizes_conceded: float
    turn_order_stats: TurnOrderStats
    matchups: List[MatchupStat]


# Explicitly rebuild schemas to satisfy Pydantic v2 resolution
TurnOrderStats.model_rebuild()
MatchupStat.model_rebuild()
DeckAnalyticsResponse.model_rebuild()

class UserAuthRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class ManualMatchRequest(BaseModel):
    my_deck: str
    opp_archetype: str
    result: str
    went_first: bool
    player_prizes: int
    opp_prizes: int
    turns: Optional[int] = None
    notes: Optional[str] = None