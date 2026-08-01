import React, { useState } from 'react';
import API from '../../api/axios';

export default function ForgotPassword({ onCodeSent, setError, onBack }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await API.post('/users/forgot-password', { email });
      if (res.data.success) {
        onCodeSent(email);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '20px' }}>Forgot Password</h3>
      <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', margin: '0 0 20px 0' }}>
        Enter your email address and we'll send you an OTP to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          className="input-field"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Sending Code...' : 'Send Reset OTP'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button type="button" onClick={onBack} className="btn-link">
          Back to Sign In
        </button>
      </div>
    </div>
  );
}