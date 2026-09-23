import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/vault` 
    : 'http://localhost:5000/api/vault',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchUserChats = async () => {
  const res = await API.get('/chats');
  return res.data;
};

export const createNewChatSession = async (title = 'New Conversation') => {
  const res = await API.post('/chats', { title });
  return res.data;
};

export const fetchChatMessages = async (chatId) => {
  const res = await API.get(`/chats/${chatId}/messages`);
  return res.data;
};

export const sendVaultChatMessage = async (payload) => {
  const res = await API.post('/message', payload);
  return res.data;
};

export const togglePin = async (chatId) => {
  const res = await API.patch(`/chats/${chatId}/pin`);
  return res.data;
};

export const deleteChatSession = async (chatId) => {
  const res = await API.delete(`/chats/${chatId}`);
  return res.data;
};