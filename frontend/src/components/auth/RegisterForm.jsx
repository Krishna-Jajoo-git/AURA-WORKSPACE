import React, { useState } from 'react';
import API from '../../api/axios';

export default function RegisterForm({ onOtpSent, setError, onSwitchTab }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await API.post('/users/register', { name, email, password });
      if (res.data.success) onOtpSent(email);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="tab-header">
        <button type="button" className="tab-btn" onClick={() => onSwitchTab('LOGIN')}>Sign In</button>
        <button type="button" className="tab-btn active">Sign Up</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          className="input-field" 
          type="text" 
          placeholder="Full Name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
          disabled={isSubmitting} 
        />
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

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Sending OTP...' : 'Continue with OTP'}
        </button>
      </form>
    </div>
  );
}