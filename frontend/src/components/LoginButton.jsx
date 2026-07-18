import React from "react";
import { GoogleLogin } from "@react-oauth/google";

function LoginButton({onSuccess, onError}) {
    return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <p style={{ color: '#555', marginBottom: '15px' }}>Please sign in to access your workspace:</p>
        <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
        />
        </div>
    );
}

export default LoginButton;