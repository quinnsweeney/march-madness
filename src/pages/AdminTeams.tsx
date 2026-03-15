import { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, Eye } from 'lucide-react';

type Team = {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    city: string;
    state: string;
    mascot: string;
    logo: string;
    alumni: string;
    seed: number;
    region: string;
};

export default function AdminTeams() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [status, setStatus] = useState('');
    const [previewId, setPreviewId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/teams')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTeams(data);
                } else {
                    setTeams([]);
                }
            })
            .catch((e) => console.error("Could not load backend:", e));
    }, []);

    const handleSave = async (idToPreview?: string) => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teams, null, 2),
            });
            if (res.ok) {
                setStatus('Saved successfully!');
                if (idToPreview) {
                    setPreviewId(idToPreview);
                }
                setTimeout(() => setStatus(''), 3000);
            } else {
                setStatus('Save failed.');
            }
        } catch (e) {
            console.error(e);
            setStatus('Error saving.');
        }
    };

    const addTeam = () => {
        const newTeam: Team = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            primaryColor: '#000000',
            secondaryColor: '#ffffff',
            city: '',
            state: '',
            mascot: '',
            logo: '',
            alumni: '',
            seed: 0,
            region: ''
        };
        setTeams([newTeam, ...teams]);
    };

    const updateTeam = (id: string, field: keyof Team, value: string) => {
        setTeams(teams.map(t => t.id === id ? { ...t, [field]: value } : t));
        // Clear preview if they start editing again so they know it's stale
        if (previewId === id) setPreviewId(null);
    };

    const deleteTeam = (id: string) => {
        if (confirm('Are you sure you want to delete this team?')) {
            setTeams(teams.filter(t => t.id !== id));
            if (previewId === id) setPreviewId(null);
        }
    };

    // Helper to resolve image paths from the public/ or src/assets directory assuming the user drops them there
    const getImageUrl = (filename: string) => {
        if (!filename) return '';
        // Defaulting to trying to load from src/assets since that's where Vite puts hero.png out of the box
        return `/src/assets/${filename}`;
    };

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--color, inherit)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
                    <Settings /> Team Data Editor
                </h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {status && <span style={{ opacity: 0.8 }}>{status}</span>}
                    <button
                        onClick={addTeam}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <Plus size={18} /> Add Team
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {teams.map(team => (
                    <div key={team.id} style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(128,128,128,0.05)' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>School Name</label>
                                <input value={team.name} onChange={(e) => updateTeam(team.id, 'name', e.target.value)} placeholder="e.g. Duke" style={{ padding: '0.5rem' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Mascot</label>
                                <input value={team.mascot} onChange={(e) => updateTeam(team.id, 'mascot', e.target.value)} placeholder="e.g. Blue Devils" style={{ padding: '0.5rem' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>City</label>
                                <input value={team.city} onChange={(e) => updateTeam(team.id, 'city', e.target.value)} placeholder="e.g. Durham" style={{ padding: '0.5rem' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>State</label>
                                <input value={team.state} onChange={(e) => updateTeam(team.id, 'state', e.target.value)} placeholder="e.g. NC" style={{ padding: '0.5rem' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Logo Filename (in src/assets/)</label>
                                <input value={team.logo} onChange={(e) => updateTeam(team.id, 'logo', e.target.value)} placeholder="e.g. duke.png" style={{ padding: '0.5rem' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Famous Alumni</label>
                                <input value={team.alumni} onChange={(e) => updateTeam(team.id, 'alumni', e.target.value)} placeholder="e.g. Zion Williamson" style={{ padding: '0.5rem' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Primary Color</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="color" value={team.primaryColor} onChange={(e) => updateTeam(team.id, 'primaryColor', e.target.value)} style={{ padding: '0', height: '35px', width: '35px' }} />
                                        <input value={team.primaryColor} onChange={(e) => updateTeam(team.id, 'primaryColor', e.target.value)} style={{ padding: '0.5rem', width: '100px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Secondary Color</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="color" value={team.secondaryColor} onChange={(e) => updateTeam(team.id, 'secondaryColor', e.target.value)} style={{ padding: '0', height: '35px', width: '35px' }} />
                                        <input value={team.secondaryColor} onChange={(e) => updateTeam(team.id, 'secondaryColor', e.target.value)} style={{ padding: '0.5rem', width: '100px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Seed</label>
                                    <input value={team.seed} onChange={(e) => updateTeam(team.id, 'seed', e.target.value)} style={{ padding: '0.5rem' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Region</label>
                                    <select value={team.region} onChange={(e) => updateTeam(team.id, 'region', e.target.value)} style={{ padding: '0.5rem' }}>
                                        <option value="">Select Region</option>
                                        <option value="east">East</option>
                                        <option value="west">West</option>
                                        <option value="south">South</option>
                                        <option value="midwest">Midwest</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar & Preview Area */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(128,128,128,0.2)' }}>
                            {previewId === team.id ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.5rem 1rem', borderRadius: '4px',
                                    background: team.primaryColor, color: team.secondaryColor,
                                    border: `2px solid ${team.secondaryColor}`
                                }}>
                                    {team.logo && <img src={getImageUrl(team.logo)} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />}
                                    <strong style={{ fontSize: '1.2rem' }}>{team.name} {team.mascot}</strong>
                                </div>
                            ) : <div />}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => handleSave(team.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <Save size={18} /> Save & Preview
                                </button>
                                <button
                                    onClick={() => deleteTeam(team.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    title="Delete Team"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {teams.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        No teams found. Click "Add Team" to start.
                    </div>
                )}
            </div>
        </div>
    );
}
