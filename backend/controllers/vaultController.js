import {generateAuraResponse,analyzeSnippets} from "../services/aiService.js";

export const generateResponse = async (req, res) => {
    try {
        const { prompt, mode, attachments, conversationHistory } = req.body;
        if(!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const result = await generateAuraResponse(prompt, mode || "mini", attachments || [], conversationHistory || []);

        return res.status(200).json({
            success : true,
            data : result,
        });
    } catch (error) {
        console.error('Error generating response:', error);
        return res.status(500).json({
            success: false, 
            error: 'Internal server error' });
    }
}

export const analyzeCode = async (req, res) => {
    try{
        const {codeBlock , stackTrace} = req.body;

        if(!codeBlock){
            return res.status(400).json({ error: 'Code block is required' });
        }

        const analysis = await analyzeSnippets(codeBlock, stackTrace || "");

        return res.status(200).json({
            success : true,
            data : analysis,
        });
    }catch(error){
        return res.status(500).json({
            success: false,
            error: 'Failed to analyze code snippets',
        });
    }
}