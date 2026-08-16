import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User } from 'lucide-react';

export default function UserProfile({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#18181b',
          border: '1px solid #27272a',
          padding: '6px 12px',
          borderRadius: '9999px',
          cursor: 'pointer',
          color: '#f4f4f5',
          transition: 'all 0.2s ease',
        }}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff',
            }}
          >
            {getInitials(user.name)}
          </div>
        )}
        <span style={{ fontSize: '13px', fontWeight: '500' }}>{user.name || 'User'}</span>
        <ChevronDown size={14} style={{ color: '#a1a1aa' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            width: '240px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            padding: '8px',
            zIndex: 100,
          }}
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', marginBottom: '6px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#f4f4f5' }}>{user.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#71717a', wordBreak: 'break-all' }}>{user.email}</p>
          </div>

          <button
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#f87171',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272a')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}