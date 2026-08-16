import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('❌ [CRITICAL]: GEMINI_API_KEY is not defined in your .env file!');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

const MODEL_TIER = {
  mini: {
    primary: 'gemini-3.5-flash',
    backup: 'gemini-3.5-flash-lite',
  },
  pro: {
    primary: 'gemini-3.7-flash',
    backup: 'gemini-3.6-flash',
  },
};

const formatAttachment = (file) => {
  if (!file) return null;

  if (file.inlineData?.data && file.inlineData?.mimeType) return file;

  if (file.buffer) {
    return {
      inlineData: {
        mimeType: file.mimetype || file.mimeType || 'application/octet-stream',
        data: file.buffer.toString('base64'),
      },
    };
  }

  if (file.base64) {
    return {
      inlineData: {
        mimeType: file.mimeType || file.mimetype || 'application/octet-stream',
        data: file.base64.replace(/^data:.*;base64,/, ''),
      },
    };
  }

  return null;
};

export const generateAuraResponse = async (
  prompt,
  mode = 'mini',
  attachments = [],
  conversationHistory = []
) => {
  const selectedMode = MODEL_TIER[mode] ? mode : 'mini';
  const { primary, backup } = MODEL_TIER[selectedMode];

  const formattedAttachments = attachments.map(formatAttachment).filter(Boolean);
  const recentHistory = conversationHistory.slice(-6);

  const formattedHistory = recentHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));

  const messageParts = [...formattedAttachments, { text: prompt }];

  // 1. Try Primary Engine
  try {
    const model = genAI.getGenerativeModel(
      primary === 'gemini-3.7-flash'
        ? { model: primary, generationConfig: { thinkingConfig: { thinkingBudget: 2048 } } }
        : { model: primary }
    );

    if (formattedHistory.length > 0) {
      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(messageParts);
      return {
        success: true,
        modelUsed: selectedMode,
        modelName: primary,
        isFailOver: false,
        text: result.response.text(),
      };
    }

    const result = await model.generateContent(messageParts);

    return {
      success: true,
      modelUsed: selectedMode,
      modelName: primary,
      isFailOver: false,
      text: result.response.text(),
    };
  } catch (error) {
    const isTransientError =
      error.status === 429 ||
      error.status === 503 ||
      error.status === 504 ||
      error.status === 500 ||
      (error.message && (
        error.message.includes('429') ||
        error.message.includes('503') ||
        error.message.includes('Rate Limit Exceeded') ||
        error.message.includes('high demand') ||
        error.message.includes('Service Unavailable')
      ));

    if (!isTransientError) {
      console.error(`[Aura AI Primary Error - ${primary}]:`, error.message || error);
      throw error;
    }

    console.warn(`[Aura AI]: Primary model (${primary}) failed due to rate limits or high demand. Failing over to backup (${backup})...`);

    // 2. Try Backup Engine
    try {
      const backupModel = genAI.getGenerativeModel(
        backup === 'gemini-3.7-flash'
          ? { model: backup, generationConfig: { thinkingConfig: { thinkingBudget: 2048 } } }
          : { model: backup }
      );

      if (formattedHistory.length > 0) {
        const chat = backupModel.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(messageParts);
        return {
          success: true,
          modelUsed: selectedMode,
          modelName: backup,
          isFailOver: true,
          notice: 'Primary engine busy. Switched to backup engine.',
          text: result.response.text(),
        };
      }

      const result = await backupModel.generateContent(messageParts);

      return {
        success: true,
        modelUsed: selectedMode,
        modelName: backup,
        isFailOver: true,
        notice: 'Primary engine busy. Switched to backup engine.',
        text: result.response.text(),
      };
    } catch (backupError) {
      console.error(`[Aura AI Backup Error - ${backup}]:`, backupError.message || backupError);
      throw backupError;
    }
  }
};

export const analyzeSnippets = async (codeBlock, stackTrace = '') => {
  const prompt = `You are an expert software developer assistant for Aura Workspace.
Analyze the following code snippet and optional stack trace.
Provide a JSON response with two keys:
1. "explanation": A brief, 2-sentence summary of what this code or error trace does/means.
2. "tags": An array of up to 5 lowercase programming language/framework tags (e.g., ["javascript", "express", "jwt", "auth"]).

Code / Stack Trace:
${codeBlock}
${stackTrace ? `\nStack Trace:\n${stackTrace}` : ''}

Return ONLY raw JSON in this format:
{"explanation": "...", "tags": ["tag1", "tag2"]}
`;

  try {
    const res = await generateAuraResponse(prompt, 'mini');
    const cleanJson = res.text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Failed to auto analyze snippets:', error);
    return { explanation: '', tags: [] };
  }
};