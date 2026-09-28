import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Only connect when user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL 
      ? new URL(import.meta.env.VITE_API_URL).origin 
      : 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to Aura WebSocket engine:', newSocket.id);
    });

    // Listen for model failover telemetry
    newSocket.on('alert:model_failover', (data) => {
      triggerAlert({
        id: Date.now(),
        type: 'warning',
        title: data.title || 'Model Failover',
        message: data.message,
      });
    });

    // Listen for rate-limit telemetry
    newSocket.on('alert:rate_limit', (data) => {
      triggerAlert({
        id: Date.now(),
        type: 'error',
        title: data.title || 'Quota Reached',
        message: data.message,
      });
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const triggerAlert = (alertObj) => {
    setAlerts((prev) => [alertObj, ...prev]);
    // Auto-dismiss alert after 6 seconds
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== alertObj.id));
    }, 6000);
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, alerts, dismissAlert }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 flex items-start justify-between gap-3 ${
              alert.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-amber-950/90 border-amber-800 text-amber-200'
            }`}
          >
            <div className="space-y-0.5 text-xs">
              <p className="font-semibold">{alert.title}</p>
              <p className="opacity-90 leading-relaxed text-[11px]">{alert.message}</p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-xs opacity-60 hover:opacity-100 p-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);