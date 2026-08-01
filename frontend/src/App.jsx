import React, { useState, useEffect } from 'react';
import API from './api/axios';
import AuthPage from './pages/AuthPage';
import UserProfile from './components/UserProfile';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user session on app load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const res = await API.get('/users/me');
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          console.log("User is not authenticated.");
        } else {
          console.error("Session Check Error:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await API.post('/users/logout');
      if (res.data.success) {
        setUser(null);
        setError(null);
      }
    } catch (err) {
      console.error("Logout Error:", err);
      setError(err.response?.data?.error || 'Logout failed.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
        <h3 style={{ color: '#2d3436' }}>Loading your workspace...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <h1 style={{ color: '#2d3436', marginBottom: '30px' }}>Aura Workspace</h1>

      {error && (
        <p style={{ color: '#d63031', backgroundColor: '#ffeaa7', padding: '10px 20px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </p>
      )}

      {!user ? (
        <AuthPage
          onLoginSuccess={(userData) => setUser(userData)}
          setError={setError}
        />
      ) : (
        <UserProfile
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;