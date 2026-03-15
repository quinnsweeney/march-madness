import { useState } from 'react';

export default function BracketBuilder() {
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);

  const handleSelection = (side: 'left' | 'right') => {
    setSelectedSide(side);
    // Future logic: record selection, load next matchup
    setTimeout(() => {
        setSelectedSide(null); // Reset for next selection
    }, 1500)
  };

  return (
    <div className="bracket-container">
      <div 
        className={`bracket-half left-half ${selectedSide === 'left' ? 'expanded' : selectedSide === 'right' ? 'shrunk' : ''}`}
        onClick={() => handleSelection('left')}
      >
        <div className="content">
          <h2>Option A</h2>
          <p>Trait description goes here.</p>
        </div>
      </div>
      
      <div 
        className={`bracket-half right-half ${selectedSide === 'right' ? 'expanded' : selectedSide === 'left' ? 'shrunk' : ''}`}
        onClick={() => handleSelection('right')}
      >
          <div className="content">
            <h2>Option B</h2>
            <p>Trait description goes here.</p>
          </div>
      </div>
    </div>
  );
}
