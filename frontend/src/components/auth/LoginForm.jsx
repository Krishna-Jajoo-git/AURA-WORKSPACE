import React, { useState } from 'react';
import API from '../../api/axios';
import GoogleAuthBtn from './GoogleAuthBtn';

export default function LoginForm({ onLoginSuccess, setError, onSwitchTab, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await API.post('/users/login', { email, password, rememberMe });
      if (res.data.success) onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="tab-header">
        <button type="button" className="tab-btn active">Sign In</button>
        <button type="button" className="tab-btn" onClick={() => onSwitchTab('REGISTER')}>Sign Up</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          className="input-field" 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          disabled={isSubmitting} 
        />
        <input 
          className="input-field" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          disabled={isSubmitting} 
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#71717a' }}>
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={e => setRememberMe(e.target.checked)} 
              disabled={isSubmitting}
            />
            Remember me
          </label>

          <button type="button" onClick={onForgotPassword} className="btn-link">
            Forgot password?
          </button>
        </div>
        
        {/* <div style={{ textAlign: 'right', marginBottom: '18px' }}>
          <button type="button" onClick={onForgotPassword} className="btn-link">
            Forgot password?
          </button>
        </div> */}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="divider"><span>OR</span></div>
      
      <GoogleAuthBtn onSuccess={onLoginSuccess} onError={setError} />
    </div>
  );
}