import { useState, useEffect, useRef } from 'react';
import type { Team } from '../types';

interface TeamAutocompleteProps {
    teams: Team[];
    value: Team | null;
    onChange: (team: Team | null) => void;
    placeholder?: string;
}

export default function TeamAutocomplete({ teams, value, onChange, placeholder = "Select a team..." }: TeamAutocompleteProps) {
    const [query, setQuery] = useState(value ? value.name : '');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync query with value if value changes externally
    useEffect(() => {
        setQuery(value ? value.name : '');
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery(value ? value.name : '');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        (team.mascot && team.mascot.toLowerCase().includes(query.toLowerCase()))
    );

    const getImageUrl = (espnId: string | number | null) => {
        if (!espnId) return '';
        return `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`;
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === '') {
                        onChange(null);
                    }
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                style={{
                    padding: '0.5rem',
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: 'var(--color-background, #fff)',
                    color: 'var(--color-text, #000)'
                }}
            />
            {isOpen && query && (
                <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    margin: 0, padding: 0, listStyle: 'none',
                    maxHeight: '200px', overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #ccc', borderRadius: '4px', zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {filteredTeams.length > 0 ? filteredTeams.map(team => (
                        <li
                            key={team.id}
                            onClick={() => {
                                onChange(team);
                                setQuery(team.name);
                                setIsOpen(false);
                            }}
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {team.espn_id && <img src={getImageUrl(team.espn_id)} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt="logo" />}
                            <span style={{ color: '#000' }}>
                                {team.name} <span style={{ opacity: 0.6, fontSize: '0.8em' }}>{team.mascot}</span>
                            </span>
                        </li>
                    )) : (
                        <li style={{ padding: '0.5rem', opacity: 0.5, color: '#000' }}>No matches found...</li>
                    )}
                </ul>
            )}
        </div>
    );
}
