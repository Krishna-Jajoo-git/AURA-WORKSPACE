import crypto from 'crypto';

// Generates a tamper-proof signed chat token
export const createSignedChatToken = (chatId, userId) => {
  const secret = process.env.CHAT_SIGNING_SECRET || 'vault_secret_key';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${chatId}:${userId}`)
    .digest('hex');
  return `${chatId}.${signature}`;
};

// Verifies if the token has been altered
export const verifySignedChatToken = (token, userId) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [chatId, signature] = token.split('.');
  if (!chatId || !signature) return null;

  const secret = process.env.CHAT_SIGNING_SECRET || 'vault_secret_key';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${chatId}:${userId}`)
    .digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  // Buffer length check is required before timingSafeEqual to avoid errors
  if (sigBuffer.length !== expectedBuffer.length) return null;

  if (crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return chatId;
  }
  return null;
};