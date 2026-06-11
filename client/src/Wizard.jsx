import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function Wizard() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [step, setStep] = useState(1);
  const [paid, setPaid] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);

  // Step 1 state
  const [stripeKey, setStripeKey] = useState('');
  const [keyError, setKeyError] = useState('');

  // Step 2 state
  const [productName, setProductName] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');

  // Step 3 state (result)
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [creationError, setCreationError] = useState('');

  // Check payment status on mount
  useEffect(() => {
    if (sessionId) {
      checkPayment(sessionId);
    } else {
      setCheckingPayment(false);
      setPaid(false);
    }
  }, [sessionId]);

  const checkPayment = async (sid) => {
    try {
      const res = await fetch(`/api/check-payment-status?session_id=${sid}`);
      const data = await res.json();
      if (data.paid) {
        setPaid(true);
        setStep(1);
      } else {
        setPaid(false);
      }
    } catch (err) {
      console.error('Payment check failed:', err);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleStartPayment = async () => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to start payment:', err);
    }
  };

  const validateKey = () => {
    if (!stripeKey.trim()) {
      setKeyError('Please enter your Stripe secret key');
      return false;
    }
    if (!stripeKey.trim().startsWith('sk_') && !stripeKey.trim().startsWith('rk_')) {
      setKeyError('Key should start with "sk_" or "rk_"');
      return false;
    }
    setKeyError('');
    return true;
  };

  const handleStep1Next = () => {
    if (validateKey()) {
      setStep(2);
    }
  };

  const validateStep2 = () => {
    let valid = true;
    if (!productName.trim()) {
      setNameError('Product name is required');
      valid = false;
    } else {
      setNameError('');
    }
    const priceNum = parseFloat(priceDollars);
    if (!priceDollars.trim() || isNaN(priceNum) || priceNum <= 0) {
      setPriceError('Enter a valid price greater than $0');
      valid = false;
    } else {
      setPriceError('');
    }
    return valid;
  };

  const handleCreatePaymentLink = async () => {
    if (!validateStep2()) return;

    setCreating(true);
    setCreationError('');

    const priceInCents = Math.round(parseFloat(priceDollars) * 100);

    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeSecretKey: stripeKey.trim(),
          productName: productName.trim(),
          priceAmount: priceInCents,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep(3);
      } else {
        setCreationError(data.details || data.error || 'Failed to create payment link');
      }
    } catch (err) {
      setCreationError('Failed to connect to server. Is the backend running?');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (result?.paymentLinkUrl) {
      navigator.clipboard.writeText(result.paymentLinkUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (checkingPayment) {
    return (
      <div className="wizard">
        <div className="card wizard-card">
          <p className="loading">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (!paid) {
    return (
      <div className="wizard">
        <div className="card wizard-card">
          <h2>Payment Required</h2>
          <p>You need to pay the one-time $5 fee to use EasyPay.</p>
          <button className="btn btn-primary" onClick={handleStartPayment}>
            Pay $5 to Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard">
      {/* Progress indicator */}
      <div className="steps-indicator">
        <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
          <span className="dot-num">{step > 1 ? '✓' : '1'}</span>
          <span className="dot-label">API Key</span>
        </div>
        <div className="step-line" />
        <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
          <span className="dot-num">{step > 2 ? '✓' : '2'}</span>
          <span className="dot-label">Product</span>
        </div>
        <div className="step-line" />
        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>
          <span className="dot-num">3</span>
          <span className="dot-label">Link</span>
        </div>
      </div>

      {step === 1 && (
        <div className="card wizard-card step-card">
          <h2>Step 1: Enter Your Stripe Key</h2>
          <p className="step-desc">
            Paste your <strong>Stripe secret key</strong>. You can find this in your
            Stripe Dashboard under Developers &rarr; API Keys. It starts with{' '}
            <code>sk_</code> or <code>rk_</code>.
          </p>
          <div className="input-group">
            <label htmlFor="stripe-key">Stripe Secret Key</label>
            <input
              id="stripe-key"
              type="password"
              placeholder="sk_test_..."
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
              className={keyError ? 'input-error' : ''}
            />
            {keyError && <p className="error-msg">{keyError}</p>}
          </div>
          <div className="step-actions">
            <button className="btn btn-primary" onClick={handleStep1Next}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card wizard-card step-card">
          <h2>Step 2: Name Your Product &amp; Set Price</h2>
          <p className="step-desc">
            What are you selling? Give it a name and a price in USD.
          </p>
          <div className="input-group">
            <label htmlFor="product-name">Product Name</label>
            <input
              id="product-name"
              type="text"
              placeholder="e.g., Premium Report, Consulting Call, Digital Art"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={nameError ? 'input-error' : ''}
            />
            {nameError && <p className="error-msg">{nameError}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="product-price">Price (USD)</label>
            <div className="price-input-wrapper">
              <span className="dollar-sign">$</span>
              <input
                id="product-price"
                type="number"
                min="0.50"
                step="0.50"
                placeholder="29.00"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                className={priceError ? 'input-error' : ''}
              />
            </div>
            {priceError && <p className="error-msg">{priceError}</p>}
          </div>
          <div className="step-actions">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreatePaymentLink}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Payment Link'}
            </button>
          </div>
          {creationError && <p className="error-msg">{creationError}</p>}
        </div>
      )}

      {step === 3 && result && (
        <div className="card wizard-card step-card result-card">
          <div className="result-icon">🎉</div>
          <h2>Your Payment Link is Ready!</h2>
          <p className="step-desc">
            Share this link with your customers to accept payments.
          </p>
          <div className="result-link-wrapper">
            <input
              type="text"
              readOnly
              value={result.paymentLinkUrl}
              className="result-link-input"
              onClick={(e) => e.target.select()}
            />
            <button className="btn btn-copy" onClick={handleCopyLink}>
              📋 Copy
            </button>
          </div>
          <div className="result-details">
            <p><strong>Product:</strong> {productName}</p>
            <p><strong>Price:</strong> ${priceDollars} USD</p>
          </div>
          <div className="step-actions">
            <a
              href={result.paymentLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open Link ↗
            </a>
            <button className="btn btn-secondary" onClick={() => {
              setStep(1);
              setResult(null);
              setProductName('');
              setPriceDollars('');
              setStripeKey('');
            }}>
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wizard;