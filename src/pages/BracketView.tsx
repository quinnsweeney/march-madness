import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import teamsData from '../teamsmock.json';
import type { Team } from '../types';

type Matchup = {
    id: string;
    teamA: Team | null;
    teamB: Team | null;
    nextMatchupId: string | null;
    isSubA: boolean;
    round: number;
    region: string | null;
};

// Reused Bracket structure helper
const getRegionInitialMatchups = (regionTeams: Team[], regionName: string, idPrefix: string) => {
    const getSeed = (s: number) => regionTeams.find(t => t.seed === s) || null;

    const m1v16 = { id: `${idPrefix}_1v16`, teamA: getSeed(1), teamB: null, nextMatchupId: `${idPrefix}_R32_1`, isSubA: true, round: 1, region: regionName };
    const m8v9 = { id: `${idPrefix}_8v9`, teamA: getSeed(8), teamB: getSeed(9), nextMatchupId: `${idPrefix}_R32_1`, isSubA: false, round: 1, region: regionName };
    const m5v12 = { id: `${idPrefix}_5v12`, teamA: getSeed(5), teamB: getSeed(12), nextMatchupId: `${idPrefix}_R32_2`, isSubA: true, round: 1, region: regionName };
    const m4v13 = { id: `${idPrefix}_4v13`, teamA: getSeed(4), teamB: getSeed(13), nextMatchupId: `${idPrefix}_R32_2`, isSubA: false, round: 1, region: regionName };
    const m6v11 = { id: `${idPrefix}_6v11`, teamA: getSeed(6), teamB: getSeed(11), nextMatchupId: `${idPrefix}_R32_3`, isSubA: true, round: 1, region: regionName };
    const m3v14 = { id: `${idPrefix}_3v14`, teamA: getSeed(3), teamB: getSeed(14), nextMatchupId: `${idPrefix}_R32_3`, isSubA: false, round: 1, region: regionName };
    const m7v10 = { id: `${idPrefix}_7v10`, teamA: getSeed(7), teamB: getSeed(10), nextMatchupId: `${idPrefix}_R32_4`, isSubA: true, round: 1, region: regionName };
    const m2v15 = { id: `${idPrefix}_2v15`, teamA: getSeed(2), teamB: getSeed(15), nextMatchupId: `${idPrefix}_R32_4`, isSubA: false, round: 1, region: regionName };

    const r32_1 = { id: `${idPrefix}_R32_1`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_1`, isSubA: true, round: 2, region: regionName };
    const r32_2 = { id: `${idPrefix}_R32_2`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_1`, isSubA: false, round: 2, region: regionName };
    const r32_3 = { id: `${idPrefix}_R32_3`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_2`, isSubA: true, round: 2, region: regionName };
    const r32_4 = { id: `${idPrefix}_R32_4`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_S16_2`, isSubA: false, round: 2, region: regionName };

    const s16_1 = { id: `${idPrefix}_S16_1`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_E8`, isSubA: true, round: 3, region: regionName };
    const s16_2 = { id: `${idPrefix}_S16_2`, teamA: null, teamB: null, nextMatchupId: `${idPrefix}_E8`, isSubA: false, round: 3, region: regionName };

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

        const playInId = `PI_${r}`;
        const main1v16Id = `${r}_1v16`;
        const playIn: Matchup = {
            id: playInId, teamA: seed16s[0] || null, teamB: seed16s[1] || null,
            nextMatchupId: main1v16Id, isSubA: false, round: 0, region: r
        };
        matchups.push(playIn);

        const regionMatchups = getRegionInitialMatchups(rTeams, r, r);
        matchups = matchups.concat(regionMatchups);
    });

    const f4_1: Matchup = { id: `F4_1`, teamA: null, teamB: null, nextMatchupId: `CHAMP`, isSubA: true, round: 5, region: 'Final Four' };
    const f4_2: Matchup = { id: `F4_2`, teamA: null, teamB: null, nextMatchupId: `CHAMP`, isSubA: false, round: 5, region: 'Final Four' };
    const champ: Matchup = { id: `CHAMP`, teamA: null, teamB: null, nextMatchupId: null, isSubA: false, round: 6, region: 'Championship' };

    matchups.push(f4_1, f4_2, champ);

    return matchups;
};


export default function BracketView() {
    const location = useLocation();
    const navigate = useNavigate();
    const [matchups, setMatchups] = useState<Matchup[]>([]);
    const [focusedRegion, setFocusedRegion] = useState<string | null>(null);

    const bracketData = location.state?.bracketData;
    const champion = bracketData?.champion;
    const choices = bracketData?.choices as { matchupId: string, winner: Team }[];

    useEffect(() => {
        if (!bracketData || !choices) return;

        // Reconstruct the bracket state
        let currentMatchups = buildBracket(teamsData);

        // Apply choices
        for (const choice of choices) {
            const m = currentMatchups.find(x => x.id === choice.matchupId);
            if (m && m.nextMatchupId) {
                const nextIdx = currentMatchups.findIndex(nx => nx.id === m.nextMatchupId);
                if (nextIdx > -1) {
                    if (m.isSubA) {
                        currentMatchups[nextIdx] = { ...currentMatchups[nextIdx], teamA: choice.winner };
                    } else {
                        currentMatchups[nextIdx] = { ...currentMatchups[nextIdx], teamB: choice.winner };
                    }
                }
            }
        }
        setMatchups(currentMatchups);

    }, [bracketData, choices]);

    if (!bracketData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
                <h2>No bracket data found.</h2>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Go Home
                </button>
            </div>
        )
    }

    const renderMatchupNode = (m: Matchup) => {
        const choice = choices.find(c => c.matchupId === m.id);
        const winnerId = choice?.winner.id;

        return (
            <div key={m.id} className="matchup-node">
                <div className={`matchup-team ${winnerId === m.teamA?.id ? 'winner' : ''} ${!winnerId && m.teamA ? '' : winnerId && winnerId !== m.teamA?.id ? 'loser' : ''}`}>
                    {m.teamA ? (
                        <>
                            <span className="seed">{m.teamA.seed}</span> <span className="name">{m.teamA.name}</span>
                        </>
                    ) : <span className="tbd">TBD</span>}
                </div>
                <div className={`matchup-team ${winnerId === m.teamB?.id ? 'winner' : ''} ${!winnerId && m.teamB ? '' : winnerId && winnerId !== m.teamB?.id ? 'loser' : ''}`}>
                    {m.teamB ? (
                        <>
                            <span className="seed">{m.teamB.seed}</span> <span className="name">{m.teamB.name}</span>
                        </>
                    ) : <span className="tbd">TBD</span>}
                </div>
            </div>
        );
    }

    const renderRegionList = (regionName: string) => {
        const rMatchups = matchups.filter(m => m.region === regionName);
        // We want to align them in columns.
        // Round 1 (1-8), Round 2 (1-4), Round 3 (1-2), Round 4 (1)
        const getRound = (r: number) => rMatchups.filter(m => m.round === r);

        return (
            <div className={`bracket-region ${regionName}`}>
                <h3 className="region-title">{regionName.toUpperCase()}</h3>
                <div className="region-rounds">
                    <div className="round-col">
                        {getRound(1).map(renderMatchupNode)}
                    </div>
                    <div className="round-col">
                        {getRound(2).map(renderMatchupNode)}
                    </div>
                    <div className="round-col">
                        {getRound(3).map(renderMatchupNode)}
                    </div>
                    <div className="round-col">
                        {getRound(4).map(renderMatchupNode)}
                    </div>
                </div>
            </div>
        )
    }

    const zoomClass = focusedRegion ? `zoom-${focusedRegion}` : '';

    return (
        <div className="bracket-view-container">
            <div className="top-bar">
                <button onClick={() => navigate('/')} className="home-btn">🏠 Home</button>
                <div className="zoom-controls">
                    <button onClick={() => setFocusedRegion(focusedRegion === 'east' ? null : 'east')} className={focusedRegion === 'east' ? 'active' : ''}>East</button>
                    <button onClick={() => setFocusedRegion(focusedRegion === 'south' ? null : 'south')} className={focusedRegion === 'south' ? 'active' : ''}>South</button>
                    <button onClick={() => setFocusedRegion(focusedRegion === 'west' ? null : 'west')} className={focusedRegion === 'west' ? 'active' : ''}>West</button>
                    <button onClick={() => setFocusedRegion(focusedRegion === 'midwest' ? null : 'midwest')} className={focusedRegion === 'midwest' ? 'active' : ''}>Midwest</button>
                    <button onClick={() => setFocusedRegion(focusedRegion === 'finalfour' ? null : 'finalfour')} className={focusedRegion === 'finalfour' ? 'active' : ''}>Final Four</button>
                    <button onClick={() => setFocusedRegion(null)} className={!focusedRegion ? 'active' : ''}>Full View</button>
                </div>
            </div>

            <div className={`bracket-canvas ${zoomClass}`}>
                <div className="bracket-left">
                    {renderRegionList('east')}
                    {renderRegionList('south')}
                </div>
                <div className="bracket-center">
                    <div className="final-four">
                        <h3 className="region-title">FINAL FOUR</h3>
                        {matchups.filter(m => m.round === 5).map(renderMatchupNode)}

                        <h3 className="region-title" style={{ marginTop: '2rem' }}>CHAMPIONSHIP</h3>
                        {matchups.filter(m => m.round === 6).map(renderMatchupNode)}

                        <div className="champion-node">
                            <h3>🏆 CHAMPION 🏆</h3>
                            <div className="winner">
                                {champion ? <><span className="seed">{champion.seed}</span> <span className="name">{champion.name}</span></> : 'TBD'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bracket-right">
                    {renderRegionList('west')}
                    {renderRegionList('midwest')}
                </div>
            </div>
        </div>
    );
}
