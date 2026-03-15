import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const criteriaOptions = [
    { id: 'logo', label: 'Logo', desc: 'Pick based on team branding' },
    { id: 'color', label: 'Primary Color', desc: 'Select the best color' },
    { id: 'location', label: 'Location', desc: 'Pick by City/State' },
    { id: 'mascot', label: 'Mascot', desc: 'Who has the best mascot?' },
    { id: 'alumni', label: 'Famous Alumni', desc: 'Which school has the best alumni?' }
];

export default function Home() {
    const [started, setStarted] = useState(false);
    const [savedBrackets, setSavedBrackets] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('marchMadnessBrackets');
        if (stored) {
            try {
                setSavedBrackets(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse saved brackets", e);
            }
        }
    }, []);

    const handleSelectCriteria = (criteriaId: string) => {
        navigate(`/bracket?criteria=${criteriaId}`);
    };

    const handleViewBracket = (bracket: any) => {
        navigate('/view', { state: { bracketData: bracket } });
    };

    return (
        <div className="home-container" style={{ overflowY: 'auto' }}>
            <main className="content" style={{ padding: '2rem 0' }}>
                <h1>A blind choice bracket for March Madness.</h1>
                <p>Pick your favorite traits instead of schools.</p>

                {!started ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                        <button className="start-btn" onClick={() => setStarted(true)}>
                            Start New Bracket
                        </button>

                        {savedBrackets.length > 0 && (
                            <div style={{ marginTop: '2rem', width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem' }}>View My Previous Brackets</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {[...savedBrackets].reverse().map((b, idx) => (
                                        <div
                                            key={b.id || idx}
                                            onClick={() => handleViewBracket(b)}
                                            style={{
                                                background: '#222', padding: '1rem', borderRadius: '8px',
                                                cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', border: '1px solid #444'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>{b.name || 'My Bracket'}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#888' }}>
                                                    {new Date(b.completedAt).toLocaleDateString()} at {new Date(b.completedAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase' }}>Champion</div>
                                                <div style={{ color: b.champion?.primaryColor || '#fff', fontWeight: 'bold' }}>
                                                    {b.champion?.name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px', margin: '2rem auto 0 auto' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Choose your criteria:</h3>
                        {criteriaOptions.map(option => (
                            <button
                                key={option.id}
                                onClick={() => handleSelectCriteria(option.id)}
                                style={{
                                    padding: '1rem',
                                    background: '#333',
                                    color: '#fff',
                                    border: '1px solid #555',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <strong style={{ fontSize: '1.2rem' }}>{option.label}</strong>
                                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{option.desc}</span>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
