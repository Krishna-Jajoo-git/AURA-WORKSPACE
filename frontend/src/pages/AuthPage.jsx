import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import OtpForm from '../components/auth/OtpForm';
import ForgotPassword from '../components/auth/ForgotPassword';

export default function AuthPage({ onLoginSuccess, setError }) {
  const [view, setView] = useState('LOGIN'); 
  const [userEmail, setUserEmail] = useState('');

  return (
    <div className="auth-card">
      {view === 'LOGIN' && (
        <LoginForm
          onLoginSuccess={onLoginSuccess}
          setError={setError}
          onSwitchTab={(tab) => setView(tab)}
          onForgotPassword={() => setView('FORGOT')}
        />
      )}

      {view === 'REGISTER' && (
        <RegisterForm
          onOtpSent={(email) => { setUserEmail(email); setView('OTP_SIGNUP'); }}
          setError={setError}
          onSwitchTab={(tab) => setView(tab)}
        />
      )}

      {view === 'FORGOT' && (
        <ForgotPassword
          onCodeSent={(email) => { setUserEmail(email); setView('OTP_RESET'); }}
          setError={setError}
          onBack={() => setView('LOGIN')}
        />
      )}

      {(view === 'OTP_SIGNUP' || view === 'OTP_RESET') && (
        <OtpForm
          email={userEmail}
          mode={view === 'OTP_SIGNUP' ? 'SIGNUP_VERIFY' : 'RESET_PASSWORD'}
          onSuccess={(userData) => {
            if (userData) onLoginSuccess(userData);
            else setView('LOGIN');
          }}
          setError={setError}
          onCancel={() => setView('LOGIN')}
        />
      )}
    </div>
  );
}