from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    matches = relationship("Match", back_populates="user", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    source = Column(String, default="ptcgl", index=True)  # "ptcgl" or "locals"
    player_deck = Column(String, index=True)
    opponent_deck = Column(String, index=True)
    result = Column(String)  # "WIN" or "LOSS"
    went_first = Column(Boolean, default=True)
    prizes_taken = Column(Integer, default=0)
    prizes_conceded = Column(Integer, default=0)
    turns = Column(Integer, default=0)
    notes = Column(String, nullable=True)
    played_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="matches")