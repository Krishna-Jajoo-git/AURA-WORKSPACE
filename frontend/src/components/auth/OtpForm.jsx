import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function OtpForm({ email, mode, onSuccess, setError, onCancel }) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [cooldown, setCooldown] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer;
    if (cooldown > 0) timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'SIGNUP_VERIFY') {
        const res = await API.post('/users/verify-otp', { email, otp });
        if (res.data.success) onSuccess(res.data.user);
      } else {
        const res = await API.post('/users/reset-password', { email, otp, newPassword });
        if (res.data.success) {
          alert('Password updated successfully!');
          onSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const endpoint = mode === 'SIGNUP_VERIFY' ? '/users/resend-otp' : '/users/forgot-password';
      const res = await API.post(endpoint, { email });
      if (res.data.success) setCooldown(120);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '20px' }}>
        {mode === 'SIGNUP_VERIFY' ? 'Verify Email' : 'Reset Password'}
      </h3>
      <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '0 0 20px 0' }}>
        Code sent to <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <input 
          className="input-field input-field-otp" 
          type="text" 
          placeholder="6-digit OTP" 
          maxLength={6} 
          value={otp} 
          onChange={e => setOtp(e.target.value)} 
          required 
          disabled={isSubmitting} 
        />

        {mode === 'RESET_PASSWORD' && (
          <input 
            className="input-field" 
            type="password" 
            placeholder="New Password" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            required 
            disabled={isSubmitting} 
          />
        )}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" onClick={onCancel} className="btn-link" style={{ color: '#64748b' }}>
          Cancel
        </button>
        <button 
          type="button" 
          onClick={handleResend} 
          disabled={cooldown > 0 || isSubmitting} 
          className="btn-link"
          style={{ color: cooldown > 0 ? '#cbd5e1' : '#6366f1' }}
        >
          {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
        </button>
      </div>
    </div>
  );
}