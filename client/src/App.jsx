import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Welcome from './Welcome';
import Wizard from './Wizard';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1 className="app-logo">⚡ EasyPay</h1>
          <p className="app-tagline">Payments, simplified.</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/wizard" element={<Wizard />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>EasyPay — One fee, one link, done.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;