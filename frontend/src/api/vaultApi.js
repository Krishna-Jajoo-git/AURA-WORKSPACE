import axios from 'axios';

const vaultApi = axios.create({
  baseURL: 'http://localhost:5000/api/vault',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateVaultPrompt = async ({prompt,mode='mini',attachments = [], conversationHistory}) => {
    const response = await vaultApi.post('/generate', {
      prompt,
      mode,
      attachments,
      conversationHistory
    });
    return response.data;
}

export const analyzeVaultSnippet = async ({ codeBlock , stackTrace = ''}) => {
    const response = await vaultApi.post('/analyze', {
        codeBlock,
        stackTrace
    });
    return response.data;
}

export default vaultApi;