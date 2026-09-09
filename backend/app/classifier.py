from typing import List, Dict

# Updated archetype signatures for the current legal Standard format
ARCHETYPE_SIGNATURES: Dict[str, Dict[str, int]] = {
    "Dragapult ex": {
        "Dreepy": 2,
        "Drakloak": 3,
        "Dragapult ex": 5,
        "Phantom Dive": 5,
        "Recon Directive": 3,
    },
    "Mega Excadrill ex": {
        "Drilbur": 2,
        "Excadrill": 3,
        "Mega Excadrill ex": 5,
    },
    "Ogerpon Box": {
        "Teal Mask Ogerpon ex": 4,
        "Teal Dance": 4,
        "Wellspring Mask Ogerpon ex": 4,
        "Cornerstone Mask Ogerpon ex": 4,
        "Hearthflame Mask Ogerpon ex": 4,
    },
    "Alakazam (Hand Engine)": {
        "Abra": 2,
        "Kadabra": 2,
        "Alakazam": 4,
        "Dudunsparce": 3,
        "Run Away Draw": 3,
    },
    "N's Zoroark ex": {
        "N's Zorua": 3,
        "N's Zoroark ex": 5,
        "Trade": 4,
        "Night Daze": 3,
    },
    "Slowking": {
        "Slowpoke": 2,
        "Slowking": 4,
        "Seek Inspiration": 5,
    },
    "Festival Lead": {
        "Applin": 2,
        "Dipplin": 4,
        "Thwackey": 4,
        "Boom Boom Groove": 4,
        "Festival Lead": 5,
    },
    "Mega Lucario ex": {
        "Riolu": 2,
        "Lucario": 3,
        "Mega Lucario ex": 5,
    },
    "Raging Bolt ex": {
        "Raging Bolt ex": 5,
        "Bellowing Thunder": 5,
        "Professor Sada's Vitality": 4,
    },
    "Gardevoir ex": {
        "Ralts": 2,
        "Kirlia": 3,
        "Gardevoir ex": 5,
        "Psychic Embrace": 5,
    },
    "Charizard ex": {
        "Charmander": 2,
        "Charmeleon": 2,
        "Charizard ex": 5,
        "Infernal Reign": 5,
    },
}


def detect_archetype(seen_cards_and_actions: List[str]) -> str:
    scores: Dict[str, int] = {archetype: 0 for archetype in ARCHETYPE_SIGNATURES}
    normalized_tokens = [token.strip().lower() for token in seen_cards_and_actions]

    for archetype, signatures in ARCHETYPE_SIGNATURES.items():
        for sig_card, weight in signatures.items():
            sig_lower = sig_card.lower()
            if any(sig_lower in token for token in normalized_tokens):
                scores[archetype] += weight

    best_match = max(scores, key=scores.get)
    if scores[best_match] >= 2:
        return best_match

    return "Unknown Archetype"