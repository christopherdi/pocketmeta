import re
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class TurnDetail:
    turn_number: int
    actor: str  # "player" or "opponent"
    cards_played: List[str] = field(default_factory=list)
    abilities_used: List[str] = field(default_factory=list)
    attacks_used: List[str] = field(default_factory=list)
    prizes_drawn: int = 0
    damage_dealt: int = 0


@dataclass
class ParsedMatch:
    player_username: str
    opponent_username: str
    went_first: bool
    result: str
    win_condition: str
    player_prizes_taken: int
    opponent_prizes_taken: int
    total_turns: int
    turns: List[TurnDetail] = field(default_factory=list)
    opponent_cards_seen: List[str] = field(default_factory=list)


class PTCGLogParser:
    def __init__(self, target_username: str):
        self.target = target_username.strip().lower()

    def parse(self, raw_log: str) -> ParsedMatch:
        lines = [line.strip() for line in raw_log.splitlines() if line.strip()]

        opponent_username = "Unknown"
        first_player = None
        result = "loss"
        win_condition = "concession"

        player_prizes = 0
        opp_prizes = 0

        current_turn: Optional[TurnDetail] = None
        turns: List[TurnDetail] = []

        # Regex patterns
        turn_header_re = re.compile(r"^Turn # (\d+) - (.+)'s Turn$", re.IGNORECASE)
        prize_re = re.compile(r"^(.+) took (\d+) Prize card", re.IGNORECASE)
        play_re = re.compile(r"^(.+) played (.+?)(?: to the .+)?\.$", re.IGNORECASE)
        
        # Distinguish attacks with damage vs. standalone attack/ability
        attack_with_dmg_re = re.compile(
            r"^(.+)'s (.+) used (.+) and dealt (\d+) damage", re.IGNORECASE
        )
        action_used_re = re.compile(
            r"^(.+)'s (.+) used (.+?)(?: from the .+)?\.$", re.IGNORECASE
        )
        
        concede_re = re.compile(r"^(.+) conceded\.", re.IGNORECASE)
        win_re = re.compile(r"^(.+) won\.", re.IGNORECASE)

        for line in lines:
            # 1. Turn Boundary
            turn_match = turn_header_re.match(line)
            if turn_match:
                if current_turn:
                    turns.append(current_turn)

                turn_num = int(turn_match.group(1))
                actor_raw = turn_match.group(2).strip()
                actor = "player" if actor_raw.lower() == self.target else "opponent"

                if first_player is None:
                    first_player = actor_raw

                if actor == "opponent" and opponent_username == "Unknown":
                    opponent_username = actor_raw

                current_turn = TurnDetail(turn_number=turn_num, actor=actor)
                continue

            # 2. In-turn actions
            if current_turn:
                # Prize tracking
                p_match = prize_re.match(line)
                if p_match:
                    taker = p_match.group(1).strip().lower()
                    count = int(p_match.group(2))
                    if taker == self.target:
                        player_prizes += count
                        current_turn.prizes_drawn += count
                    else:
                        opp_prizes += count
                    continue

                # Cards played
                card_match = play_re.match(line)
                if card_match:
                    card_name = card_match.group(2).strip()
                    current_turn.cards_played.append(card_name)
                    continue

                # Attack with explicit damage (e.g. "used Burning Darkness and dealt 180 damage")
                atk_dmg_match = attack_with_dmg_re.match(line)
                if atk_dmg_match:
                    attack_name = atk_dmg_match.group(3).strip()
                    dmg = int(atk_dmg_match.group(4))
                    current_turn.attacks_used.append(attack_name)
                    current_turn.damage_dealt += dmg
                    continue

                # Other actions (abilities / utility attacks without damage)
                action_match = action_used_re.match(line)
                if action_match:
                    action_name = action_match.group(3).strip()
                    current_turn.abilities_used.append(action_name)
                    continue

            # 3. Match endings
            c_match = concede_re.match(line)
            if c_match:
                conceder = c_match.group(1).strip().lower()
                win_condition = "concession"
                result = "win" if conceder != self.target else "loss"

            w_match = win_re.match(line)
            if w_match:
                winner = w_match.group(1).strip().lower()
                result = "win" if winner == self.target else "loss"
                if player_prizes >= 6 or opp_prizes >= 6:
                    win_condition = "prizes"

        if current_turn:
            turns.append(current_turn)

        opp_tokens = []
        for t in turns:
            if t.actor == "opponent":
                opp_tokens.extend(t.cards_played)
                opp_tokens.extend(t.abilities_used)
                opp_tokens.extend(t.attacks_used)

        return ParsedMatch(
            player_username=self.target,
            opponent_username=opponent_username,
            went_first=(first_player.lower() == self.target) if first_player else False,
            result=result,
            win_condition=win_condition,
            player_prizes_taken=min(player_prizes, 6),
            opponent_prizes_taken=min(opp_prizes, 6),
            total_turns=len(turns),
            turns=turns,
            opponent_cards_seen=opp_tokens,
        )

        return ParsedMatch(
            player_username=self.target,
            opponent_username=opponent_username,
            went_first=(first_player.lower() == self.target) if first_player else False,
            result=result,
            win_condition=win_condition,
            player_prizes_taken=min(player_prizes, 6),
            opponent_prizes_taken=min(opp_prizes, 6),
            total_turns=len(turns),
            turns=turns,
        )