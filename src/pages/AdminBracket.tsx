import { useState, useEffect } from 'react';
import { Save, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';
import TeamAutocomplete from '../components/TeamAutocomplete';
import type { Team } from '../types';

export default function AdminBracket() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetch('/api/teams')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTeams(data);
                }
            });
    }, []);

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teams, null, 2),
            });
            if (res.ok) {
                setStatus('Saved successfully!');
                setTimeout(() => setStatus(''), 3000);
            } else {
                setStatus('Save failed.');
            }
        } catch (e) {
            console.error(e);
            setStatus('Error saving.');
        }
    };

    const regions = ['East', 'West', 'South', 'Midwest'];
    const seeds = Array.from({ length: 16 }, (_, i) => i + 1);

    const [playInData, setPlayInData] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const playInState: Record<string, boolean> = {};
        regions.forEach(r => {
            const rLower = r.toLowerCase();
            seeds.forEach(s => {
                const teamsInSlot = teams.filter(t => t.region === rLower && t.seed === s);
                if (teamsInSlot.length > 1) {
                    playInState[`${rLower}-${s}`] = true;
                }
            });
        });
        setPlayInData(playInState);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teams.length]);

    const togglePlayIn = (region: string, seed: number) => {
        const key = `${region.toLowerCase()}-${seed}`;
        setPlayInData(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getTeamsForSlot = (region: string, seed: number) => {
        return teams.filter(t => t.region === region.toLowerCase() && t.seed === seed);
    };

    const assignTeamToSlot = (region: string, seed: number, index: number, newTeam: Team | null) => {
        const currentTeams = getTeamsForSlot(region, seed);

        const updatedTeams = teams.map(t => {
            if (newTeam && t.id === newTeam.id) {
                return { ...t, region: region.toLowerCase(), seed };
            }
            return t;
        });

        const teamBeingReplaced = currentTeams[index];
        if (teamBeingReplaced && (!newTeam || teamBeingReplaced.id !== newTeam.id)) {
            const tIndex = updatedTeams.findIndex(t => t.id === teamBeingReplaced.id);
            if (tIndex !== -1) {
                updatedTeams[tIndex] = { ...updatedTeams[tIndex], region: null, seed: null };
            }
        }

        setTeams(updatedTeams);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'var(--color, inherit)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', margin: 0 }}>
                    <LayoutList /> Bracket Seeding
                </h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/admin/teams" style={{ color: '#0066cc', textDecoration: 'none' }}>&larr; Back to Team Editor</Link>
                    {status && <span style={{ opacity: 0.8 }}>{status}</span>}
                    <button
                        onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <Save size={18} /> Save Bracket
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {regions.map(region => (
                    <div key={region} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: 'rgba(128,128,128,0.05)' }}>
                        <h2 style={{ borderBottom: '2px solid #555', paddingBottom: '0.5rem', marginTop: 0 }}>{region}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {seeds.map(seed => {
                                const isPlayIn = playInData[`${region.toLowerCase()}-${seed}`];
                                const slotTeams = getTeamsForSlot(region, seed);

                                return (
                                    <div key={seed} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color, #ccc)' }}>
                                        <div style={{ width: '30px', fontWeight: 'bold', paddingTop: '0.5rem' }}>#{seed}</div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <TeamAutocomplete
                                                teams={teams}
                                                value={slotTeams[0] || null}
                                                onChange={(t) => assignTeamToSlot(region, seed, 0, t)}
                                                placeholder={`Select Seed ${seed}`}
                                            />
                                            {isPlayIn && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>vs</span>
                                                    <TeamAutocomplete
                                                        teams={teams}
                                                        value={slotTeams[1] || null}
                                                        onChange={(t) => assignTeamToSlot(region, seed, 1, t)}
                                                        placeholder={`Play-in Opponent`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => togglePlayIn(region, seed)}
                                            style={{
                                                fontSize: '0.7rem', padding: '0.2rem 0.5rem',
                                                background: isPlayIn ? '#ef4444' : 'transparent',
                                                color: isPlayIn ? '#fff' : 'inherit',
                                                border: '1px solid ' + (isPlayIn ? '#ef4444' : '#666'),
                                                borderRadius: '4px', cursor: 'pointer',
                                                marginTop: '0.4rem',
                                                opacity: isPlayIn ? 1 : 0.6
                                            }}
                                        >
                                            {isPlayIn ? 'Remove Play-in' : '+ Play-in'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
