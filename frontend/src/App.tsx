import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Globe,
  Upload,
  PlusCircle,
  Flame,
  Zap,
  Sparkles,
  Trophy,
} from 'lucide-react';

const API_BASE_URL = "https://pocketmeta.onrender.com";

const DECK_CONFIG: Record<
  string,
  {
    dex: number;
    type: string;
    text: string;
    border: string;
    accent: string;
  }
> = {
  'Dragapult ex': { dex: 887, type: 'Dragon / Psychic', text: 'text-indigo-300', border: 'border-indigo-500/50', accent: 'from-purple-500 via-indigo-600 to-amber-500' },
  'Mega Excadrill ex': { dex: 530, type: 'Fighting / Metal', text: 'text-amber-300', border: 'border-amber-600/50', accent: 'from-amber-600 to-stone-500' },
  'Festival Lead': { dex: 1011, type: 'Grass', text: 'text-emerald-300', border: 'border-emerald-500/50', accent: 'from-emerald-500 to-green-600' },
  'Alakazam Dudunsparce': { dex: 65, type: 'Psychic', text: 'text-purple-300', border: 'border-purple-500/50', accent: 'from-purple-500 to-fuchsia-600' },
  'Dragapult Blaziken': { dex: 257, type: 'Dragon / Fire', text: 'text-rose-300', border: 'border-rose-500/50', accent: 'from-rose-500 via-orange-500 to-purple-600' },
  'Dragapult Dusknoir': { dex: 477, type: 'Dragon / Ghost', text: 'text-violet-300', border: 'border-violet-500/50', accent: 'from-indigo-600 to-slate-700' },
  'Slowking': { dex: 199, type: 'Water / Psychic', text: 'text-sky-300', border: 'border-sky-500/50', accent: 'from-sky-500 to-pink-500' },
  "N's Zoroark ex": { dex: 571, type: 'Darkness', text: 'text-rose-400', border: 'border-rose-900/60', accent: 'from-red-600 to-zinc-900' },
  'Grimmsnarl Froslass': { dex: 861, type: 'Dark / Water', text: 'text-cyan-300', border: 'border-cyan-600/50', accent: 'from-cyan-500 to-indigo-800' },
  'Dhelmise': { dex: 781, type: 'Grass / Metal', text: 'text-teal-300', border: 'border-teal-500/50', accent: 'from-teal-500 to-emerald-700' },
  'Toucannon': { dex: 733, type: 'Colorless', text: 'text-zinc-300', border: 'border-zinc-600/50', accent: 'from-zinc-400 to-stone-600' },
  'Raging Bolt Ogerpon': { dex: 1021, type: 'Lightning / Dragon', text: 'text-yellow-300', border: 'border-yellow-500/50', accent: 'from-yellow-400 via-amber-500 to-emerald-500' },
  'Mega Lucario ex': { dex: 448, type: 'Fighting', text: 'text-orange-300', border: 'border-orange-600/50', accent: 'from-orange-500 to-blue-600' },
  'Lucario Hariyama': { dex: 297, type: 'Fighting', text: 'text-orange-300', border: 'border-orange-600/50', accent: 'from-orange-600 to-amber-700' },
  'Basic Box': { dex: 132, type: 'Toolbox / Multi', text: 'text-blue-300', border: 'border-blue-500/50', accent: 'from-blue-500 via-teal-400 to-indigo-600' },
  'Mega Greninja ex': { dex: 658, type: 'Water / Dark', text: 'text-blue-300', border: 'border-blue-600/50', accent: 'from-blue-600 to-pink-600' },
  'Ogerpon Meganium Hydrapple': { dex: 1017, type: 'Grass', text: 'text-emerald-300', border: 'border-emerald-500/50', accent: 'from-emerald-400 to-lime-600' },
  "Rocket's Honchkrow": { dex: 430, type: 'Darkness', text: 'text-purple-300', border: 'border-purple-600/50', accent: 'from-purple-800 to-zinc-900' },
  "Cynthia's Garchomp": { dex: 445, type: 'Dragon / Ground', text: 'text-amber-300', border: 'border-amber-500/50', accent: 'from-cyan-600 via-amber-500 to-blue-700' },
  'Mega Chandelure ex': { dex: 609, type: 'Fire / Ghost', text: 'text-violet-300', border: 'border-violet-600/50', accent: 'from-violet-600 via-purple-500 to-blue-500' },
};

const COMMON_META_DECKS = Object.keys(DECK_CONFIG);

const LEFT_GUTTER_SPRITES = [
  { name: 'Dragapult', dex: 887, glow: 'drop-shadow(0 0 20px rgba(99,102,241,0.95))', size: 'w-44 h-44', left: '4%' },
  { name: 'Gholdengo', dex: 1000, glow: 'drop-shadow(0 0 20px rgba(234,179,8,0.95))', size: 'w-40 h-40', left: '38%' },
  { name: 'Gardevoir', dex: 282, glow: 'drop-shadow(0 0 20px rgba(168,85,247,0.95))', size: 'w-40 h-40', left: '70%' },
  { name: 'Dudunsparce', dex: 982, glow: 'drop-shadow(0 0 20px rgba(59,130,246,0.95))', size: 'w-36 h-36', left: '8%' },
  { name: 'Fezandipiti', dex: 1016, glow: 'drop-shadow(0 0 20px rgba(236,72,153,0.95))', size: 'w-40 h-40', left: '42%' },
  { name: 'Ogerpon', dex: 1017, glow: 'drop-shadow(0 0 20px rgba(16,185,129,0.95))', size: 'w-44 h-44', left: '72%' },
  { name: 'Dusknoir', dex: 477, glow: 'drop-shadow(0 0 20px rgba(99,102,241,0.95))', size: 'w-40 h-40', left: '6%' },
  { name: 'Mew', dex: 151, glow: 'drop-shadow(0 0 20px rgba(244,114,182,0.95))', size: 'w-36 h-36', left: '36%' },
  { name: 'Greninja', dex: 658, glow: 'drop-shadow(0 0 20px rgba(14,165,233,0.95))', size: 'w-44 h-44', left: '70%' },
  { name: 'Excadrill', dex: 530, glow: 'drop-shadow(0 0 20px rgba(217,119,6,0.95))', size: 'w-38 h-38', left: '10%' },
  { name: 'Dipplin', dex: 1011, glow: 'drop-shadow(0 0 20px rgba(34,197,94,0.95))', size: 'w-36 h-36', left: '40%' },
  { name: 'Iron Hands', dex: 992, glow: 'drop-shadow(0 0 20px rgba(250,204,21,0.95))', size: 'w-44 h-44', left: '74%' },
  { name: 'Slowking', dex: 199, glow: 'drop-shadow(0 0 20px rgba(56,189,248,0.95))', size: 'w-40 h-40', left: '4%' },
  { name: 'Froslass', dex: 478, glow: 'drop-shadow(0 0 20px rgba(6,182,212,0.95))', size: 'w-36 h-36', left: '38%' },
  { name: 'Dhelmise', dex: 781, glow: 'drop-shadow(0 0 20px rgba(20,184,166,0.95))', size: 'w-40 h-40', left: '68%' },
  { name: 'Hydrapple', dex: 1019, glow: 'drop-shadow(0 0 20px rgba(16,185,129,0.95))', size: 'w-40 h-40', left: '8%' },
  { name: 'Blaziken', dex: 257, glow: 'drop-shadow(0 0 20px rgba(244,63,94,0.95))', size: 'w-42 h-42', left: '40%' },
  { name: 'Jirachi', dex: 385, glow: 'drop-shadow(0 0 20px rgba(234,179,8,0.95))', size: 'w-36 h-36', left: '72%' },
  { name: 'Pecharunt', dex: 1025, glow: 'drop-shadow(0 0 20px rgba(168,85,247,0.95))', size: 'w-36 h-36', left: '6%' },
  { name: 'Origin Palkia', dex: 484, glow: 'drop-shadow(0 0 20px rgba(56,189,248,0.95))', size: 'w-44 h-44', left: '38%' },
  { name: 'Baxcalibur', dex: 998, glow: 'drop-shadow(0 0 20px rgba(59,130,246,0.95))', size: 'w-42 h-42', left: '70%' },
];

const RIGHT_GUTTER_SPRITES = [
  { name: 'Raging Bolt', dex: 1021, glow: 'drop-shadow(0 0 20px rgba(234,179,8,0.95))', size: 'w-44 h-44', right: '4%' },
  { name: 'Charizard', dex: 6, glow: 'drop-shadow(0 0 20px rgba(239,68,68,0.95))', size: 'w-44 h-44', right: '38%' },
  { name: 'Munkidori', dex: 1015, glow: 'drop-shadow(0 0 20px rgba(168,85,247,0.95))', size: 'w-38 h-38', right: '70%' },
  { name: 'Zoroark', dex: 571, glow: 'drop-shadow(0 0 20px rgba(225,29,72,0.95))', size: 'w-40 h-40', right: '8%' },
  { name: 'Pidgeot', dex: 18, glow: 'drop-shadow(0 0 20px rgba(245,158,11,0.95))', size: 'w-36 h-36', right: '42%' },
  { name: 'Alakazam', dex: 65, glow: 'drop-shadow(0 0 20px rgba(192,132,252,0.95))', size: 'w-40 h-40', right: '72%' },
  { name: 'Lucario', dex: 448, glow: 'drop-shadow(0 0 20px rgba(249,115,22,0.95))', size: 'w-40 h-40', right: '6%' },
  { name: 'Garchomp', dex: 445, glow: 'drop-shadow(0 0 20px rgba(59,130,246,0.95))', size: 'w-44 h-44', right: '38%' },
  { name: 'Chandelure', dex: 609, glow: 'drop-shadow(0 0 20px rgba(139,92,246,0.95))', size: 'w-38 h-38', right: '70%' },
  { name: 'Pikachu', dex: 25, glow: 'drop-shadow(0 0 20px rgba(250,204,21,0.95))', size: 'w-36 h-36', right: '10%' },
  { name: 'Grimmsnarl', dex: 861, glow: 'drop-shadow(0 0 20px rgba(6,182,212,0.95))', size: 'w-40 h-40', right: '40%' },
  { name: 'Hariyama', dex: 297, glow: 'drop-shadow(0 0 20px rgba(234,88,12,0.95))', size: 'w-42 h-42', right: '74%' },
  { name: 'Rotom', dex: 479, glow: 'drop-shadow(0 0 20px rgba(234,179,8,0.95))', size: 'w-36 h-36', right: '4%' },
  { name: 'Radiant Greninja', dex: 658, glow: 'drop-shadow(0 0 20px rgba(239,68,68,0.95))', size: 'w-44 h-44', right: '36%' },
  { name: 'Toucannon', dex: 733, glow: 'drop-shadow(0 0 20px rgba(161,161,170,0.95))', size: 'w-36 h-36', right: '68%' },
  { name: 'Honchkrow', dex: 430, glow: 'drop-shadow(0 0 20px rgba(147,51,234,0.95))', size: 'w-40 h-40', right: '8%' },
  { name: 'Squawkabilly', dex: 931, glow: 'drop-shadow(0 0 20px rgba(34,197,94,0.95))', size: 'w-36 h-36', right: '40%' },
  { name: 'Ditto', dex: 132, glow: 'drop-shadow(0 0 20px rgba(192,132,252,0.95))', size: 'w-34 h-34', right: '72%' },
  { name: 'Chi-Yu', dex: 1004, glow: 'drop-shadow(0 0 20px rgba(244,63,94,0.95))', size: 'w-36 h-36', right: '6%' },
  { name: 'Iron Crown', dex: 1023, glow: 'drop-shadow(0 0 20px rgba(56,189,248,0.95))', size: 'w-40 h-40', right: '38%' },
  { name: 'Gouging Fire', dex: 1020, glow: 'drop-shadow(0 0 20px rgba(239,68,68,0.95))', size: 'w-44 h-44', right: '70%' },
];

interface TurnOrderStats {
  games_first: number;
  wins_first: number;
  winrate_first: number;
  games_second: number;
  wins_second: number;
  winrate_second: number;
}

interface MatchupStat {
  opp_archetype: string;
  total_games: number;
  wins: number;
  losses: number;
  winrate: number;
  avg_prizes_taken: number;
}

interface DeckAnalytics {
  deck_name: string;
  total_games: number;
  wins: number;
  losses: number;
  overall_winrate: number;
  avg_prizes_taken: number;
  avg_prizes_conceded: number;
  turn_order_stats: TurnOrderStats;
  matchups: MatchupStat[];
}

interface LimitlessDeck {
  name: string;
  share_pct: number;
  raw_tournament_winrate: number;
  meta_weighted_winrate: number;
  meta_ev_impact: number;
  tier: string;
  sample_size_rating: string;
  attendance_weight_factor?: number;
}

interface LimitlessSummary {
  last_updated: string;
  average_raw_winrate: number;
  global_meta_ev: number;
  meta_weighted_winrate: number;
  min_attendance_threshold?: number;
  total_tournaments_indexed?: number;
  decks: LimitlessDeck[];
}

type SortKey = 'share_pct' | 'raw_tournament_winrate' | 'meta_weighted_winrate' | 'meta_ev_impact';

export default function App() {
  const [section, setSection] = useState<'limitless' | 'ptcgl' | 'locals'>('limitless');
  const [token, setToken] = useState<string | null>(localStorage.getItem('pm_token'));
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('pm_username'));

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [myDeck, setMyDeck] = useState<string>('Dragapult ex');
  const [manualPlayerDeck, setManualPlayerDeck] = useState<string>('Dragapult ex');
  const [rawLog, setRawLog] = useState('');
  const [oppDeck, setOppDeck] = useState(COMMON_META_DECKS[1] || 'Mega Excadrill ex');
  const [matchResult, setMatchResult] = useState<'WIN' | 'LOSS'>('WIN');
  const [wentFirst, setWentFirst] = useState(true);
  const [prizesTaken, setPrizesTaken] = useState(6);
  const [prizesConceded, setPrizesConceded] = useState(0);
  const [turnsCount, setTurnsCount] = useState(5);
  const [matchNotes, setMatchNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [ptcglAnalytics, setPtcglAnalytics] = useState<DeckAnalytics | null>(null);
  const [localsAnalytics, setLocalsAnalytics] = useState<DeckAnalytics | null>(null);
  const [limitlessData, setLimitlessData] = useState<LimitlessSummary | null>(null);
  const [refreshingMeta, setRefreshingMeta] = useState(false);

  const [sortBy, setSortBy] = useState<SortKey>('share_pct');
  const [sortAsc, setSortAsc] = useState(false);

  const [matchesList, setMatchesList] = useState<any[]>([]);

  const fetchMatches = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/matches?source=${section}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatchesList(res.data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
  };

  const fetchStats = async (forceRefreshMeta: boolean = false, overrideDeck?: string) => {
    const deckToQuery = overrideDeck || myDeck;
    try {
      const limitlessRes = await axios.get(
        `${API_BASE_URL}/api/limitless/meta?refresh=${forceRefreshMeta}`
      );
      setLimitlessData(limitlessRes.data);

      if (token) {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [ptcglRes, localsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/analytics/${encodeURIComponent(deckToQuery)}?source=ptcgl`, config),
          axios.get(`${API_BASE_URL}/api/analytics/${encodeURIComponent(deckToQuery)}?source=locals`, config),
        ]);
        setPtcglAnalytics(ptcglRes.data);
        setLocalsAnalytics(localsRes.data);
        await fetchMatches();
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, myDeck, section]);

  const handleForceRefreshMeta = async () => {
    setRefreshingMeta(true);
    await fetchStats(true);
    setRefreshingMeta(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, {
        username: authUsername,
        password: authPassword,
      });
      const { token: newToken, user } = res.data;
      localStorage.setItem('pm_token', newToken);
      localStorage.setItem('pm_username', user.username);
      setToken(newToken);
      setCurrentUser(user.username);
      setShowAuthModal(false);
      setAuthPassword('');
      fetchStats();
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_username');
    setToken(null);
    setCurrentUser(null);
    setPtcglAnalytics(null);
    setLocalsAnalytics(null);
    setMatchesList([]);
    setSection('limitless');
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!token) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusMessage({ type: 'success', text: 'Match log deleted successfully.' });
      await fetchStats();
      await fetchMatches();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to delete match log.' });
    }
  };

  const handleIngestLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawLog.trim() || !token) return;

    try {
      setLoading(true);
      setStatusMessage(null);
      await axios.post(
        `${API_BASE_URL}/api/matches/ingest-log`,
        {
          raw_log: rawLog,
          my_deck_name: myDeck,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRawLog('');
      setStatusMessage({ type: 'success', text: `Match log successfully processed for ${myDeck}!` });
      await fetchStats();
      await fetchMatches();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to ingest log.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!token) {
      setStatusMessage({ type: 'error', text: 'You must be signed in to record matches.' });
      return;
    }

    const deckRecorded = manualPlayerDeck;

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/matches/manual`,
        {
          my_deck: deckRecorded,
          opp_archetype: oppDeck,
          result: matchResult,
          went_first: wentFirst,
          player_prizes: prizesTaken,
          opp_prizes: prizesConceded,
          turns: turnsCount,
          notes: matchNotes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (myDeck !== deckRecorded) {
        setMyDeck(deckRecorded);
      }

      setMatchNotes('');
      setStatusMessage({
        type: 'success',
        text: `Round logged: ${deckRecorded} vs ${oppDeck} (${matchResult})!`,
      });

      await fetchStats(false, deckRecorded);
      await fetchMatches();
    } catch (err: any) {
      console.error('Failed to log round:', err.response?.data);
      const detail = err.response?.data?.detail;
      let errorText = err.message || 'Server error while recording round.';

      if (Array.isArray(detail)) {
        errorText = detail
          .map((d: any) => `${d.loc?.slice(1).join('.') || 'field'}: ${d.msg}`)
          .join(' | ');
      } else if (typeof detail === 'string') {
        errorText = detail;
      }

      setStatusMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedDecks = useMemo(() => {
    if (!limitlessData?.decks) return [];
    return [...limitlessData.decks].sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [limitlessData, sortBy, sortAsc]);

  const activeAnalytics = section === 'ptcgl' ? ptcglAnalytics : localsAnalytics;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-amber-500 selection:text-black">
      <style>{`
        @keyframes marqueeDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0%); }
        }
        @keyframes marqueeUp {
          0% { transform: translateY(0%); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-down {
          animation: marqueeDown 32s linear infinite;
        }
        .animate-scroll-up {
          animation: marqueeUp 32s linear infinite;
        }
      `}</style>

      {/* --- LEFT GUTTER --- */}
      <aside className="fixed inset-y-0 left-0 w-72 lg:w-96 xl:w-[440px] pointer-events-none select-none z-0 hidden md:block overflow-hidden">
        <div className="absolute top-0 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="animate-scroll-down flex flex-col pointer-events-none">
          <div className="flex flex-col gap-0 py-0">
            {LEFT_GUTTER_SPRITES.map((mon, idx) => (
              <div
                key={`left-1-${idx}`}
                className={`relative ${idx === 0 ? 'mt-0' : '-mt-10'}`}
                style={{ marginLeft: mon.left }}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.dex}.png`}
                  alt={mon.name}
                  className={`${mon.size} object-contain`}
                  style={{ filter: mon.glow }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-0 py-0">
            {LEFT_GUTTER_SPRITES.map((mon, idx) => (
              <div
                key={`left-2-${idx}`}
                className={`relative ${idx === 0 ? '-mt-10' : '-mt-10'}`}
                style={{ marginLeft: mon.left }}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.dex}.png`}
                  alt={mon.name}
                  className={`${mon.size} object-contain`}
                  style={{ filter: mon.glow }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* --- RIGHT GUTTER --- */}
      <aside className="fixed inset-y-0 right-0 w-72 lg:w-96 xl:w-[440px] pointer-events-none select-none z-0 hidden md:block overflow-hidden">
        <div className="absolute top-0 -right-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 -right-20 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="animate-scroll-up flex flex-col pointer-events-none">
          <div className="flex flex-col gap-0 py-0 items-end">
            {RIGHT_GUTTER_SPRITES.map((mon, idx) => (
              <div
                key={`right-1-${idx}`}
                className={`relative ${idx === 0 ? 'mt-0' : '-mt-10'}`}
                style={{ marginRight: mon.right }}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.dex}.png`}
                  alt={mon.name}
                  className={`${mon.size} object-contain`}
                  style={{ filter: mon.glow }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-0 py-0 items-end">
            {RIGHT_GUTTER_SPRITES.map((mon, idx) => (
              <div
                key={`right-2-${idx}`}
                className={`relative ${idx === 0 ? '-mt-10' : '-mt-10'}`}
                style={{ marginRight: mon.right }}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.dex}.png`}
                  alt={mon.name}
                  className={`${mon.size} object-contain`}
                  style={{ filter: mon.glow }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[300px] bg-gradient-to-b from-amber-500/10 via-red-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* --- FOREGROUND COCKPIT --- */}
      <div className="relative z-10 max-w-7xl 2xl:max-w-[1500px] mx-auto p-4 md:py-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 rounded-2xl shadow-lg shadow-amber-500/10">
              <Sparkles className="w-7 h-7 text-slate-950 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-rose-400 font-sans">
                  POCKET<span className="text-red-500">META</span>
                </h1>
                <span className="text-[10px] uppercase tracking-widest bg-red-950/90 text-red-400 font-bold px-2 py-0.5 rounded border border-red-800/60">
                  Standard Format
                </span>
              </div>
              <p className="text-xs text-slate-400">Competitive Pokémon TCG Analytics & Win Probability</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {token && (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Viewing Deck:</span>
                <select
                  value={myDeck}
                  onChange={(e) => setMyDeck(e.target.value)}
                  className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
                >
                  {COMMON_META_DECKS.map((deck) => (
                    <option key={deck} value={deck} className="bg-slate-900 text-slate-100">
                      {deck}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs">
                  <span className="text-slate-300">
                    Trainer <strong className="text-amber-400">{currentUser}</strong>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-400 text-xs font-semibold ml-1 underline"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 px-4 py-2 rounded-xl font-black text-xs transition shadow-md shadow-amber-500/20"
                >
                  Trainer Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSection('limitless')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border shadow-sm ${
              section === 'limitless'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-amber-500/20'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            1. Global Limitless Meta (Top 20)
          </button>

          <button
            onClick={() => setSection('ptcgl')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border shadow-sm ${
              section === 'ptcgl'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-blue-500/20'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-sky-300" />
            2. PTCG Live Stats {!token && '(Locked)'}
          </button>

          <button
            onClick={() => setSection('locals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border shadow-sm ${
              section === 'locals'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-emerald-300" />
            3. In-Person Locals Stats {!token && '(Locked)'}
          </button>
        </nav>

        {/* Global Action Status Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex justify-between items-center transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-200'
                : 'bg-red-950/80 border-red-600/80 text-red-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100 font-black ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Unauthenticated Lock Banner */}
        {section !== 'limitless' && !token && (
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl text-center space-y-4 backdrop-blur-sm shadow-xl">
            <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Trainer Profile Required</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Sign in or create a trainer account to log your PTCG Live match exports, record tournament rounds, and view your personal matchup matrix.
            </p>
            <button
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-amber-500/20"
            >
              Sign In to Access Your Log
            </button>
          </div>
        )}

        {/* SECTION 1: GLOBAL LIMITLESS META */}
        {section === 'limitless' && limitlessData && (
          <section className="bg-slate-900/70 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Flame className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-black text-slate-100 tracking-tight">
                    Limitless Championship Standings
                  </h2>
                  <span className="text-[11px] bg-red-950 text-red-300 border border-red-800/80 px-2.5 py-0.5 rounded-full font-bold">
                    {limitlessData.total_tournaments_indexed ?? 22} Events (N ≥ {limitlessData.min_attendance_threshold ?? 100})
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Online weeklies and tabletop majors weighted by player count to prevent low-sample rogue bias.
                </p>
              </div>

              <button
                onClick={handleForceRefreshMeta}
                disabled={refreshingMeta}
                className="text-xs bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 text-slate-200 transition font-semibold"
              >
                {refreshingMeta ? 'Scraping Live...' : 'Force Refresh Cache'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-xl relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-xs text-amber-400 uppercase font-bold tracking-wider">Global Meta EV</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-300">
                    {limitlessData.global_meta_ev ?? limitlessData.meta_weighted_winrate ?? 0}%
                  </span>
                  <span className="text-xs text-slate-500">True Field Baseline</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Weighted expected value across the full tournament field.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Raw Mean Winrate</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-200">
                    {limitlessData.average_raw_winrate ?? 0}%
                  </span>
                  <span className="text-xs text-slate-500">Unweighted Average</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Arithmetic mean treating 1% rogue decks equally to staples.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Field Bias Shift</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-2xl font-bold ${
                      (limitlessData.global_meta_ev ?? 0) >= (limitlessData.average_raw_winrate ?? 0)
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {((limitlessData.global_meta_ev ?? 0) - (limitlessData.average_raw_winrate ?? 0)).toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-500">EV Delta</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Spread between field-weighted EV and rogue noise.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                Sort Rankings By:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'share_pct') setSortAsc(!sortAsc);
                    else { setSortBy('share_pct'); setSortAsc(false); }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                    sortBy === 'share_pct'
                      ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Meta Share {sortBy === 'share_pct' && (sortAsc ? '↑' : '↓')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'raw_tournament_winrate') setSortAsc(!sortAsc);
                    else { setSortBy('raw_tournament_winrate'); setSortAsc(false); }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                    sortBy === 'raw_tournament_winrate'
                      ? 'bg-yellow-600 border-yellow-400 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Tourney WR {sortBy === 'raw_tournament_winrate' && (sortAsc ? '↑' : '↓')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'meta_weighted_winrate') setSortAsc(!sortAsc);
                    else { setSortBy('meta_weighted_winrate'); setSortAsc(false); }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                    sortBy === 'meta_weighted_winrate'
                      ? 'bg-amber-600 border-amber-400 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Weighted EV WR {sortBy === 'meta_weighted_winrate' && (sortAsc ? '↑' : '↓')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'meta_ev_impact') setSortAsc(!sortAsc);
                    else { setSortBy('meta_ev_impact'); setSortAsc(false); }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                    sortBy === 'meta_ev_impact'
                      ? 'bg-rose-600 border-rose-400 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  EV Impact {sortBy === 'meta_ev_impact' && (sortAsc ? '↑' : '↓')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedDecks.map((deck, idx) => {
                const conf = DECK_CONFIG[deck.name] || {
                  dex: 0,
                  type: 'Standard',
                  text: 'text-slate-300',
                  border: 'border-slate-700',
                  accent: 'from-slate-600 to-slate-800',
                };

                const spriteUrl = conf.dex
                  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${conf.dex}.png`
                  : null;

                return (
                  <div
                    key={idx}
                    className={`relative rounded-2xl p-4.5 bg-slate-950/85 border ${conf.border} flex flex-col justify-between space-y-3.5 shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.01]`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${conf.accent}`} />

                    <div>
                      <div className="flex justify-between items-start pt-1">
                        <div className="flex items-center gap-2.5">
                          {spriteUrl ? (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shadow-inner shrink-0">
                              <img
                                src={spriteUrl}
                                alt={deck.name}
                                className="w-9 h-9 object-contain drop-shadow"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                              <Sparkles className="w-5 h-5 text-amber-400" />
                            </div>
                          )}

                          <div>
                            <h3 className="font-black text-slate-100 text-sm tracking-wide leading-tight">
                              {deck.name}
                            </h3>
                            <span className={`text-[10px] font-bold ${conf.text} uppercase tracking-wider`}>
                              {conf.type}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-full font-bold border border-slate-800 shrink-0">
                          {deck.tier}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            deck.sample_size_rating === 'High Volume'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : deck.sample_size_rating === 'Established'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : deck.sample_size_rating === 'Moderate Sample'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {deck.sample_size_rating}
                        </span>

                        {deck.attendance_weight_factor && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Scalar: <strong className="text-slate-300">{deck.attendance_weight_factor}x</strong>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-3.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-400">
                          <span>Field Representation</span>
                          <span className="text-slate-100 font-bold">{deck.share_pct}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${conf.accent}`}
                            style={{ width: `${Math.min(deck.share_pct * 10, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3.5 text-center">
                        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/90">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Tourney WR
                          </span>
                          <span className="text-sm md:text-base font-black text-yellow-400">
                            {deck.raw_tournament_winrate ?? 0}%
                          </span>
                        </div>

                        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/30">
                          <span className="text-[10px] text-amber-400 font-bold block uppercase">
                            Weighted EV
                          </span>
                          <span className="text-sm md:text-base font-black text-amber-300">
                            {deck.meta_weighted_winrate ?? 0}%
                          </span>
                        </div>

                        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-rose-500/30">
                          <span className="text-[10px] text-rose-400 font-bold block uppercase">
                            EV Impact
                          </span>
                          <span className="text-sm md:text-base font-black text-rose-300">
                            +{deck.meta_ev_impact ?? 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2 & 3: PERSONAL TRACKER (PTCGL / LOCALS) */}
        {section !== 'limitless' && token && (
          <div className="space-y-6">
            {section === 'ptcgl' ? (
              <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-slate-100 font-black">
                  <Zap className="w-5 h-5 text-sky-400" />
                  <h2>PTCG Live Match Log Ingest</h2>
                </div>
                <form onSubmit={handleIngestLog} className="space-y-3">
                  <textarea
                    rows={4}
                    value={rawLog}
                    onChange={(e) => setRawLog(e.target.value)}
                    placeholder="Paste full raw export log from Pokémon TCG Live here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !rawLog.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-500/20"
                  >
                    {loading ? 'Analyzing Game Board...' : 'Ingest & Classify Match'}
                  </button>
                </form>
              </section>
            ) : (
              <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-slate-100 font-black">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                    <h2>In-Person Swiss Round Logger</h2>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Logging for Deck: <strong className="text-amber-400">{manualPlayerDeck}</strong>
                  </span>
                </div>
                
                <form onSubmit={handleManualMatch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Your Deck (Player)</label>
                    <select
                      value={manualPlayerDeck}
                      onChange={(e) => setManualPlayerDeck(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-amber-300 font-bold"
                    >
                      {COMMON_META_DECKS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Opponent Deck</label>
                    <select
                      value={oppDeck}
                      onChange={(e) => setOppDeck(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-semibold"
                    >
                      {COMMON_META_DECKS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Match Result</label>
                    <select
                      value={matchResult}
                      onChange={(e) => setMatchResult(e.target.value as 'WIN' | 'LOSS')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-200"
                    >
                      <option value="WIN">VICTORY (WIN)</option>
                      <option value="LOSS">DEFEAT (LOSS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Turn Order</label>
                    <select
                      value={wentFirst ? 'first' : 'second'}
                      onChange={(e) => setWentFirst(e.target.value === 'first')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                    >
                      <option value="first">Went First (Turn 1)</option>
                      <option value="second">Went Second (Turn 2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Prizes Taken (0 - 6)</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={prizesTaken}
                      onChange={(e) => setPrizesTaken(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Prizes Conceded (0 - 6)</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={prizesConceded}
                      onChange={(e) => setPrizesConceded(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-rose-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Match Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Brick on T2, caught up with ACE SPEC"
                      value={matchNotes}
                      onChange={(e) => setMatchNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-8 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? 'Recording Round...' : 'Record Tournament Round'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Dynamic Analytics View */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-100 tracking-wide">
                  {section === 'ptcgl' ? 'PTCG Live Pilot Analytics' : 'Local Swiss Performance'}: <span className="text-amber-400">{myDeck}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {activeAnalytics ? `${activeAnalytics.total_games} Games Logged` : '0 Games Logged'}
                </span>
              </div>

              {activeAnalytics && activeAnalytics.total_games > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 border border-slate-800 p-4.5 rounded-2xl">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Games Recorded</span>
                      <div className="text-2xl font-black text-slate-100 mt-1">{activeAnalytics.total_games}</div>
                      <div className="text-xs text-slate-500 mt-1">{activeAnalytics.wins} Wins • {activeAnalytics.losses} Losses</div>
                    </div>
                    <div className="bg-slate-900/80 border border-emerald-500/30 p-4.5 rounded-2xl">
                      <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Pilot Win Rate</span>
                      <div className="text-2xl font-black text-emerald-400 mt-1">{activeAnalytics.overall_winrate}%</div>
                      <div className="text-xs text-emerald-300/80 mt-1">
                        Prizes: <strong className="text-amber-300">{activeAnalytics.avg_prizes_taken}</strong> taken / <strong className="text-rose-300">{activeAnalytics.avg_prizes_conceded}</strong> conceded
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-4.5 rounded-2xl">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Coin Flip Efficiency</span>
                      <div className="text-xs font-bold text-slate-200 mt-2 space-y-1">
                        <div>Going First: <strong className="text-amber-400">{activeAnalytics.turn_order_stats.winrate_first}%</strong> ({activeAnalytics.turn_order_stats.wins_first}/{activeAnalytics.turn_order_stats.games_first})</div>
                        <div>Going Second: <strong className="text-sky-400">{activeAnalytics.turn_order_stats.winrate_second}%</strong> ({activeAnalytics.turn_order_stats.wins_second}/{activeAnalytics.turn_order_stats.games_second})</div>
                      </div>
                    </div>
                  </div>

                  {/* Matchup Matrix */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden p-5 shadow-xl">
                    <h4 className="font-black text-sm text-slate-200 mb-3 tracking-wide">
                      Matchup Matrix ({myDeck})
                    </h4>
                    {activeAnalytics.matchups.length === 0 ? (
                      <p className="text-xs text-slate-500">No matchups recorded for {myDeck} yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-3">Opponent Archetype</th>
                              <th className="p-3">Games</th>
                              <th className="p-3">Wins</th>
                              <th className="p-3">Win Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeAnalytics.matchups.map((m, i) => (
                              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition">
                                <td className="p-3 font-bold text-slate-100">{m.opp_archetype}</td>
                                <td className="p-3">{m.total_games}</td>
                                <td className="p-3">{m.wins}</td>
                                <td className="p-3 font-black text-amber-400">{m.winrate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
                  <div className="text-sm font-bold text-slate-300">No games logged yet for {myDeck}</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Record your first Swiss round above with {myDeck} as your deck, and your pilot winrate and matchup spread will compute here immediately.
                  </p>
                </div>
              )}

              {/* Individual Match Log Feed with Delete */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-200">Individual Match Logs ({myDeck})</h4>
                  <span className="text-[11px] text-slate-400">{matchesList.length} Entries</span>
                </div>
                {matchesList.length === 0 ? (
                  <p className="text-xs text-slate-500">No individual match logs found.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {matchesList.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                        <div className="space-y-0.5">
                          <div>
                            <strong className="text-amber-400">{m.my_deck}</strong> vs <span className="text-slate-300">{m.opp_archetype}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{m.went_first ? 'Went First' : 'Went Second'}</span>
                            <span>•</span>
                            <span>{m.total_turns} Turns</span>
                            {m.notes && <span>• "{m.notes}"</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-black px-2.5 py-0.5 rounded text-[10px] ${m.result?.toLowerCase() === 'win' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                            {m.result?.toUpperCase()}
                          </span>
                          <span className="text-slate-300 font-mono text-[11px]">{m.player_prizes} - {m.opp_prizes}</span>
                          <button
                            onClick={() => handleDeleteMatch(m.id)}
                            className="text-slate-500 hover:text-red-400 font-bold px-2 py-1 text-xs transition"
                            title="Delete Match Log"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

      </div>

      {/* Trainer Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400" />
            
            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-slate-100">
                  {authMode === 'login' ? 'Trainer Sign In' : 'Register Trainer'}
                </h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="bg-red-950/90 border border-red-800 text-red-300 text-xs p-2.5 rounded-xl font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Trainer Name</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 mt-2"
              >
                {authMode === 'login' ? 'Enter Cockpit' : 'Create Trainer Profile'}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              {authMode === 'login' ? (
                <p>
                  New Trainer?{' '}
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-amber-400 font-bold underline ml-1 hover:text-amber-300"
                  >
                    Register Account
                  </button>
                </p>
              ) : (
                <p>
                  Existing Trainer?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-amber-400 font-bold underline ml-1 hover:text-amber-300"
                  >
                    Log In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}