import React from "react";

function UserProfile({ user,onLogout }) {
    return (
        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '10px 0' }}>Welcome back, {user.name}!</h3>
      <p style={{ color: '#666', marginBottom: '15px' }}>{user.email}</p>

      {user.picture && (
        <img 
          src={user.picture} 
          alt={`${user.name}'s avatar`} 
          referrerPolicy="no-referrer"
          style={{ borderRadius: '50%', width: '96px', height: '96px', objectFit: 'cover', border: '2px solid #6c5ce7' }} 
        />
    )}
    <br /><br />

      <button 
        onClick={onLogout} 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#ff7675', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Log Out
      </button>
    </div>
  );
}

export default UserProfile;