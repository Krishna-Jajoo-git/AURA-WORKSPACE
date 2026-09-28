import API from './axios';

export const fetchUserChats = async () => {
  const res = await API.get('/vault/chats');
  return res.data;
};

export const createNewChatSession = async (title = 'New Conversation') => {
  const res = await API.post('/vault/chats', { title });
  return res.data;
};

export const fetchChatMessages = async (chatId) => {
  const res = await API.get(`/vault/chats/${chatId}/messages`);
  return res.data;
};

export const sendVaultChatMessage = async ({ chatId, prompt, mode, attachments }) => {
  const payload = { prompt, mode, attachments };
  if (chatId) {
    payload.chatId = chatId;
  }
  const res = await API.post('/vault/message', payload);
  return res.data;
};

export const renameChatSession = async (chatId, title) => {
  const res = await API.patch(`/vault/chats/${chatId}/title`, { title });
  return res.data;
};

export const togglePin = async (chatId) => {
  const res = await API.patch(`/vault/chats/${chatId}/pin`);
  return res.data;
};

export const deleteChatSession = async (chatId) => {
  const res = await API.delete(`/vault/chats/${chatId}`);
  return res.data;
};