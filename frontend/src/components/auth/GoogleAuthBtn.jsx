import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import API from '../../api/axios';

export default function GoogleAuthBtn({ onSuccess, onError }) {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      if (onError) onError(null);

      const res = await API.post('/users/google-login', {
        credential: credentialResponse.credential,
        nickname: ''
      });

      if (res.data.success) {
        onSuccess(res.data.user);
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      onError(err.response?.data?.error || 'Google Authentication failed.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => onError('Google Authentication Failed')}
      />
    </div>
  );
}