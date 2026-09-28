import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import OtpForm from '../components/auth/OtpForm';
import ForgotPassword from '../components/auth/ForgotPassword';
import { AlertCircle } from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const [view, setView] = useState('LOGIN'); 
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState(null);

  // Switch views and clear any active error message
  const handleSwitchView = (nextView) => {
    setError(null);
    setView(nextView);
  };

  return (
    <div className="auth-card">
      {/* Dynamic Error Banner */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          fontSize: '13px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {view === 'LOGIN' && (
        <LoginForm
          onLoginSuccess={onLoginSuccess}
          setError={setError}
          onSwitchTab={(tab) => handleSwitchView(tab)}
          onForgotPassword={() => handleSwitchView('FORGOT')}
        />
      )}

      {view === 'REGISTER' && (
        <RegisterForm
          onOtpSent={(email) => { 
            setUserEmail(email); 
            handleSwitchView('OTP_SIGNUP'); 
          }}
          setError={setError}
          onSwitchTab={(tab) => handleSwitchView(tab)}
        />
      )}

      {view === 'FORGOT' && (
        <ForgotPassword
          onCodeSent={(email) => { 
            setUserEmail(email); 
            handleSwitchView('OTP_RESET'); 
          }}
          setError={setError}
          onBack={() => handleSwitchView('LOGIN')}
        />
      )}

      {(view === 'OTP_SIGNUP' || view === 'OTP_RESET') && (
        <OtpForm
          email={userEmail}
          mode={view === 'OTP_SIGNUP' ? 'SIGNUP_VERIFY' : 'RESET_PASSWORD'}
          onSuccess={(userData) => {
            if (userData) {
              onLoginSuccess(userData);
            } else {
              handleSwitchView('LOGIN');
            }
          }}
          setError={setError}
          onCancel={() => handleSwitchView('LOGIN')}
        />
      )}
    </div>
  );
}