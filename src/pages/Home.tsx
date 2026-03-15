import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="home-container">
            <main className="content">
                <h1>A blind choice bracket for March Madness.</h1>
                <p>Pick your favorite traits instead of schools.</p>
                <Link to="/bracket" className="start-btn">Start</Link>
            </main>
        </div>
    );
}
