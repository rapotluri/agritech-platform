import React, { useState } from 'react';
import Registration from './Registration';
import Marketplace from './Marketplace';

function App() {
  const [view, setView] = useState('register');

  return (
    <div className="App">
      <nav>
        <button onClick={() => setView('register')}>Register</button>
        <button onClick={() => setView('marketplace')}>Marketplace</button>
      </nav>

      {view === 'register' && <Registration />}
      {view === 'marketplace' && <Marketplace />}
    </div>
  );
}

export default App;
