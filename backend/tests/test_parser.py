from pathlib import Path
from app.parser import PTCGLogParser


def test_parse_sample_match():
    log_path = Path(__file__).parent / "sample_match.txt"
    with open(log_path, "r", encoding="utf-8") as f:
        content = f.read()

    parser = PTCGLogParser(target_username="Player1")
    match = parser.parse(content)

    assert match.result == "win"
    assert match.win_condition == "concession"
    assert match.went_first is True
    assert match.player_prizes_taken == 1
    assert match.opponent_prizes_taken == 0
    assert match.total_turns == 4
    assert match.opponent_username == "Opponent"

    # Verify Turn 3 Charizard play
    turn_3 = match.turns[2]
    assert "Rare Candy" in turn_3.cards_played
    assert "Burning Darkness" in turn_3.attacks_used
    assert turn_3.damage_dealt == 180