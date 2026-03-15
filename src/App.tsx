import { Outlet } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <>
      {/* Optional: Add a subtle minimalist header here later if desired, e.g. <header>Bracket</header> */}
      <Outlet />
    </>
  );
}

export default App;
