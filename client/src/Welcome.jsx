import { useState } from 'react';

function Welcome() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetStarted = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to server. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome">
      <div className="card welcome-card">
        <div className="welcome-icon">⚡</div>
        <h2>Create a Payment Link in 30 Seconds</h2>
        <p className="welcome-desc">
          No Stripe dashboard slogging. No docs. Just paste your key, name your product,
          and get a shareable payment link.
        </p>
        <ul className="welcome-steps">
          <li><span className="step-num">1</span> Pay a one-time $5 fee</li>
          <li><span className="step-num">2</span> Paste your Stripe secret key</li>
          <li><span className="step-num">3</span> Name your product &amp; set a price</li>
          <li><span className="step-num">4</span> Get your shareable link ✨</li>
        </ul>
        <button
          className="btn btn-primary btn-large"
          onClick={handleGetStarted}
          disabled={loading}
        >
          {loading ? 'Redirecting to Stripe...' : 'Get Started — $5'}
        </button>
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}

export default Welcome;