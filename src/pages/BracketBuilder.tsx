import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import teamsData from '../teamsmock.json';
import type { Team } from '../types';

type Matchup = {
  id: string;
  teamA: Team | null;
  teamB: Team | null;
  nextMatchupId: string | null;
  isSubA: boolean; // if true, winner goes to teamA slot of nextMatchupId
  round: number;
  region: string | null; // For final four it might be null
};

// Bracket structure helper for a single region's standard 16 teams (after play-in)
const getRegionInitialMatchups = (regionTeams: Team[], regionName: string, idPrefix: string) => {
  // 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  const getSeed = (s: number) => regionTeams.find(t => t.seed === s) || null;

  // We will leave the 16 seed null because it comes from the play-in game
  const m1v16 = { id: `${idPrefix}_1v16`, teamA: getSeed(1), teamB: null, nextMatchupId: `${idPrefix}_R32_1`, isSubA: true, round: 1, region: regionName };
  const m8v9 = { id: `${idPrefix}_8v9`, teamA: getSeed(8), teamB: getSeed(9), nextMatchupId: `${idPrefix}_R32_1`, isSubA: false, round: 1, region: regionName };

  const m5v12 = { id: `${idPrefix}_5v12`, teamA: getSeed(5), teamB: getSeed(12), nextMatchupId: `${idPrefix}_R32_2`, isSubA: true, round: 1, region: regionName };
  const m4v13 = { id: `${idPrefix}_4v13`, teamA: getSeed(4), teamB: getSeed(13), nextMatchupId: `${idPrefix}_R32_2`, isSubA: false, round: 1, region: regionName };

  const m6v11 = { id: `${idPrefix}_6v11`, teamA: getSeed(6), teamB: getSeed(11), nextMatchupId: `${idPrefix}_R32_3`, isSubA: true, round: 1, region: regionName };
  const m3v14 = { id: `${idPrefix}_3v14`, teamA: getSeed(3), teamB: getSeed(14), nextMatchupId: `${idPrefix}_R32_3`, isSubA: false, round: 1, region: regionName };

  const m7v10 = { id: `${idPrefix}_7v10`, teamA: getSeed(7), teamB: getSeed(10), nextMatchupId: `${idPrefix}_R32_4`, isSubA: true, round: 1, region: regionName };
  const m2v15 = { id: `${idPrefix}_2v15`, teamA: getSeed(2), teamB: getSeed(15), nextMatchupId: `${idPrefix}_R32_4`, isSubA: false, round: 1, region: regionName };

  // Round of 32
  const r32_1 = { id: `${idPrefix}_R32_1`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_1`, isSubA: true, round: 2, region: regionName };
  const r32_2 = { id: `${idPrefix}_R32_2`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_1`, isSubA: false, round: 2, region: regionName };
  const r32_3 = { id: `${idPrefix}_R32_3`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_2`, isSubA: true, round: 2, region: regionName };
  const r32_4 = { id: `${idPrefix}_R32_4`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_2`, isSubA: false, round: 2, region: regionName };

  // Sweet 16
  const s16_1 = { id: `${idPrefix}_S16_1`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_E8`, isSubA: true, round: 3, region: regionName };
  const s16_2 = { id: `${idPrefix}_S16_2`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_E8`, isSubA: false, round: 3, region: regionName };

  // Elite 8
  const e8 = { id: `${idPrefix}_E8`, teamA: null, teamB: null, nextMatchupId: `F4_${regionName === 'east' || regionName === 'south' ? '1' : '2'}`, isSubA: regionName === 'east' || regionName === 'west', round: 4, region: regionName };

  return [m1v16, m8v9, m5v12, m4v13, m6v11, m3v14, m7v10, m2v15, r32_1, r32_2, r32_3, r32_4, s16_1, s16_2, e8];
};

const buildBracket = (teams: any[]) => {
  const validTeams = teams.filter(t => t.region && t.seed) as Team[];
  const regions = ['east', 'west', 'south', 'midwest'];
  let matchups: Matchup[] = [];

  regions.forEach(r => {
    const rTeams = validTeams.filter(t => t.region === r);
    const seed16s = rTeams.filter(t => t.seed === 16);

    // Setup play-in
    const playInId = `PI_${r}`;
    const main1v16Id = `${r}_1v16`;
    const playIn: Matchup = {
      id: playInId,
      teamA: seed16s[0] || null,
      teamB: seed16s[1] || null,
      nextMatchupId: main1v16Id,
      isSubA: false, // Goes fully to teamB of the 1v16
      round: 0,
      region: r
    };
    matchups.push(playIn);

    const regionMatchups = getRegionInitialMatchups(rTeams, r, r);
    matchups = matchups.concat(regionMatchups);
  });

  // Final Four & Championship
  const f4_1: Matchup = { id: `F4_1`, teamA: null, teamB: null, nextMatchupId: `CHAMP`, isSubA: true, round: 5, region: 'Final Four' };
  const f4_2: Matchup = { id: `F4_2`, teamA: null, teamB: null, nextMatchupId: `CHAMP`, isSubA: false, round: 5, region: 'Final Four' };
  const champ: Matchup = { id: `CHAMP`, teamA: null, teamB: null, nextMatchupId: null, isSubA: false, round: 6, region: 'Championship' };

  matchups.push(f4_1, f4_2, champ);

  return matchups;
};


export default function BracketBuilder() {
  const [searchParams] = useSearchParams();
  const criteria = searchParams.get('criteria') || 'name';
  const navigate = useNavigate();

  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [currentMatchupId, setCurrentMatchupId] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [champion, setChampion] = useState<Team | null>(null);

  // Tracking history
  const [choices, setChoices] = useState<{ matchupId: string; winner: Team }[]>([]);
  const [totalMatchups, setTotalMatchups] = useState(0);

  // Initialize Bracket once
  useEffect(() => {
    const initialMatchups = buildBracket(teamsData);
    setMatchups(initialMatchups);

    // There are exactly N-1 total games in a bracket (e.g. 67 for 68 teams)
    setTotalMatchups(initialMatchups.length);

    // Find the first available play-in game or round 1 game to start
    const firstPlayIn = initialMatchups.find(m => m.round === 0 && m.teamA && m.teamB);
    if (firstPlayIn) {
      setCurrentMatchupId(firstPlayIn.id);
    }
  }, []);

  const activeMatchup = useMemo(() => {
    return matchups.find(m => m.id === currentMatchupId) || null;
  }, [matchups, currentMatchupId]);

  const handleSelection = (side: 'left' | 'right') => {
    if (!activeMatchup) return;
    if (selectedSide) return; // prevent double clicks

    setSelectedSide(side);

    const winningTeam = side === 'left' ? activeMatchup.teamA : activeMatchup.teamB;

    setTimeout(() => {
      setSelectedSide(null);

      if (winningTeam) {
        setChoices(prev => [...prev, { matchupId: activeMatchup.id, winner: winningTeam }]);
      }

      if (!activeMatchup.nextMatchupId && winningTeam) {
        // Bracket is complete
        setChampion(winningTeam);
        setCurrentMatchupId(null);
        return;
      }

      let newMatchups = [...matchups];

      // Apply winner to next matchup
      if (activeMatchup.nextMatchupId) {
        const nextIdx = newMatchups.findIndex(m => m.id === activeMatchup.nextMatchupId);
        if (nextIdx > -1) {
          if (activeMatchup.isSubA) {
            newMatchups[nextIdx] = { ...newMatchups[nextIdx], teamA: winningTeam };
          } else {
            newMatchups[nextIdx] = { ...newMatchups[nextIdx], teamB: winningTeam };
          }
        }
      }

      setMatchups(newMatchups);

      // Find next unplayed matchup
      // A matchup is playable if it has both a teamA and a teamB, and hasn't been played yet.
      // But we actually only want to resolve all Round 0, then all Round 1, etc., up to Round 6.
      const allRoundsPlayable = [...newMatchups].sort((a, b) => a.round - b.round);

      let nextM = null;
      for (let i = 0; i <= 6; i++) {
        // Find a game in round i that has both teams but hasn't resulted in a winner being pushed forward
        const unplayedInRound = allRoundsPlayable.filter(m => m.round === i && m.teamA !== null && m.teamB !== null);

        // Which of these hasn't been played? Check if its winner is already in its next Matchup.
        for (let game of unplayedInRound) {
          if (game.nextMatchupId) {
            const nextG = allRoundsPlayable.find(nx => nx.id === game.nextMatchupId);
            if (nextG) {
              if (game.isSubA && nextG.teamA === null) { nextM = game; break; }
              if (!game.isSubA && nextG.teamB === null) { nextM = game; break; }
            }
          } else if (i === 6 && !champion) {
            nextM = game; break;
          }
        }
        if (nextM) break;
      }

      if (nextM) {
        setCurrentMatchupId(nextM.id);
      }

    }, 800)
  };

  const handleDevSkip = () => {
    let currentM = activeMatchup;
    let newMatchups = [...matchups];
    let newChoices = [...choices];
    let newChampion = champion;

    while (currentM) {
      const winningTeam = currentM.teamB || currentM.teamA;
      if (!winningTeam) break;

      newChoices.push({ matchupId: currentM.id, winner: winningTeam });

      if (!currentM.nextMatchupId) {
        newChampion = winningTeam;
        currentM = null;
        break;
      }

      const nextMatchupId = currentM.nextMatchupId;
      const nextIdx = newMatchups.findIndex(m => m.id === nextMatchupId);
      if (nextIdx > -1) {
        if (currentM.isSubA) {
          newMatchups[nextIdx] = { ...newMatchups[nextIdx], teamA: winningTeam };
        } else {
          newMatchups[nextIdx] = { ...newMatchups[nextIdx], teamB: winningTeam };
        }
      }

      const allRoundsPlayable = [...newMatchups].sort((a, b) => a.round - b.round);
      let nextM = null;
      for (let i = 0; i <= 6; i++) {
        const unplayedInRound = allRoundsPlayable.filter(m => m.round === i && m.teamA !== null && m.teamB !== null);
        for (let game of unplayedInRound) {
          if (game.nextMatchupId) {
            const nextG = allRoundsPlayable.find(nx => nx.id === game.nextMatchupId);
            if (nextG) {
              if (game.isSubA && nextG.teamA === null) { nextM = game; break; }
              if (!game.isSubA && nextG.teamB === null) { nextM = game; break; }
            }
          } else if (i === 6 && !newChampion) {
            nextM = game; break;
          }
        }
        if (nextM) break;
      }
      currentM = nextM;
    }

    setMatchups(newMatchups);
    setChoices(newChoices);
    if (newChampion) {
      setChampion(newChampion);
      setCurrentMatchupId(null);
    }
  };

  const renderTrait = (team: Team | null) => {
    if (!team) return 'TBD';
    switch (criteria) {
      case 'logo':
        return team.espn_id ? (
          <img src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espn_id}.png`} alt={team.name} style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
        ) : <span style={{ fontSize: '3rem' }}>🏀</span>;
      case 'color':
        return (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: team.primaryColor, borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }} />
            <div style={{ width: '40px', height: '40px', background: team.secondaryColor, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }} />
          </div>
        );
      case 'location':
        return <h2 style={{ fontSize: '2.5rem' }}>{team.city}, {team.state}</h2>;
      case 'mascot':
        return <h2 style={{ fontSize: '2.5rem', color: team.primaryColor }}>The {team.mascot}</h2>;
      case 'alumni':
        return <h2 style={{ fontSize: '2.5rem' }}>{team.alumni || 'Unknown Celeb'}</h2>;
      default:
        return <h2>{team.name}</h2>;
    }
  };

  const [bracketName, setBracketName] = useState('');

  if (champion) {
    const handleSave = () => {
      const exportData = {
        name: bracketName || 'My Bracket',
        champion,
        choices,
        completedAt: new Date().toISOString()
      };

      const stored = localStorage.getItem('marchMadnessBrackets');
      const brackets = stored ? JSON.parse(stored) : [];
      const newBracket = { ...exportData, id: Date.now().toString() };
      brackets.push(newBracket);
      localStorage.setItem('marchMadnessBrackets', JSON.stringify(brackets));

      navigate('/view', { state: { bracketData: newBracket } });
    };

    return (
      <div className="bracket-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆 Tournament Champion 🏆</h1>
        <h2 style={{ fontSize: '4rem', color: champion.primaryColor, textShadow: '2px 2px 0 #fff' }}>{champion.name}</h2>
        <div style={{ margin: '2rem 0' }}>{renderTrait(champion)}</div>

        <input
          type="text"
          placeholder="Name your bracket..."
          value={bracketName}
          onChange={(e) => setBracketName(e.target.value)}
          style={{ padding: '0.8rem 1rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid #555', background: '#222', color: '#fff', marginBottom: '1rem', width: '300px', textAlign: 'center' }}
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ padding: '1rem 2rem', background: '#333', color: '#fff', fontSize: '1.2rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid #555' }}>
            Play Again
          </button>
          <button onClick={handleSave} style={{ padding: '1rem 2rem', background: '#2563eb', color: '#fff', fontSize: '1.2rem', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
            Save & View Bracket
          </button>
        </div>
      </div>
    )
  }

  if (!activeMatchup) {
    return <div className="bracket-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2>Loading Bracket...</h2></div>;
  }

  const roundNames = ['Play-In', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'National Championship'];

  // Calculate progress
  const progressPercent = totalMatchups > 0 ? (choices.length / totalMatchups) * 100 : 0;

  return (
    <div className="bracket-container" style={{ position: 'relative' }}>

      {/* Home Button */}
      <button
        onClick={() => {
          if (confirm('Are you sure you want to exit? Your bracket progress will be lost.')) {
            navigate('/');
          }
        }}
        style={{
          position: 'absolute', top: '1rem', left: '1rem', zIndex: 20,
          background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
          borderRadius: '8px', width: '80px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '1rem'
        }}
        title="Home"
      >
        Home
      </button>

      {/* Dev Skip Button */}
      <button
        onClick={handleDevSkip}
        style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 20,
          background: 'rgba(255,0,0,0.5)', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '0.5rem 1rem',
          cursor: 'pointer', fontSize: '1rem'
        }}
        title="Dev Skip"
      >
        Dev Skip
      </button>

      {/* Header info */}
      <div style={{ position: 'absolute', top: '2rem', left: '0', width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
        <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>{roundNames[activeMatchup.round]}</h3>
        <h2 style={{ fontSize: '2rem' }}>{activeMatchup.region?.toUpperCase()} Region</h2>
      </div>

      <div
        className={`bracket-half left-half ${selectedSide === 'left' ? 'expanded' : selectedSide === 'right' ? 'shrunk' : ''}`}
        onClick={() => handleSelection('left')}
        style={{ background: activeMatchup.teamA?.primaryColor || '#222' }}
      >
        <div className="content">
          {renderTrait(activeMatchup.teamA)}
        </div>
      </div>

      <div
        className={`bracket-half right-half ${selectedSide === 'right' ? 'expanded' : selectedSide === 'left' ? 'shrunk' : ''}`}
        onClick={() => handleSelection('right')}
        style={{ background: activeMatchup.teamB?.primaryColor || '#111' }}
      >
        <div className="content">
          {renderTrait(activeMatchup.teamB)}
        </div>
      </div>

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', color: '#000', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', zIndex: 10, opacity: selectedSide ? 0 : 1, transition: 'opacity 0.2s ease' }}>
        VS
      </div>

      {/* Progress Bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', zIndex: 20 }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: '#fff',
          transition: 'width 0.3s ease'
        }} />
      </div>

    </div>
  );
}
