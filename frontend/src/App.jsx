import React,{ useState,useEffect } from 'react'
import LoginButton from './components/LoginButton.jsx'
import UserProfile from './components/UserProfile.jsx'
import axios from 'axios'
// Enable sharing cookies across origins
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try{
        const response = await axios.get('http://localhost:5000/api/users/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      }catch (error) {
        if(error.response && error.response.status === 401){
          console.log("User is not authenticated.");
        }else{
          console.error("Authentication Error:", error);
        }
      }finally {
        setLoading(false);
      }
    }
    checkUserSession();
  },[]);

  const handleLoginSuccess = async (credentialResponse) => {
    try{
      setError(null); // Clear any previous errors
      const response = await axios.post('http://localhost:5000/api/users/google-login', {
        credential : credentialResponse.credential,
        nickname : ''
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    }catch (error) {
      console.error("Authentication Error:", error);
      setError(error.response?.data?.error || 'Authentication failed. Please try again.');
    }
  };
  const handleLogout = async () => {
    try {
      const response =await axios.post('http://localhost:5000/api/users/logout');
      if(response.data.success){
        setUser(null);
      }
    } catch (error) {
      console.error("Logout Error:", error);
      setError(error.response?.data?.error || 'Logout failed. Please try again.');
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
      
      {error && <p style={{ color: '#d63031', backgroundColor: '#ffeaa7', padding: '10px 20px', borderRadius: '4px' }}>{error}</p>}

      {!user ? (
        <LoginButton 
          onSuccess={handleLoginSuccess} 
          onError={() => setError('Google Authentication Failed')} 
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