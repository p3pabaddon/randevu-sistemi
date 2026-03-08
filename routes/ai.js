const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!process.env.GOOGLE_API_KEY) {
            return res.status(500).json({ error: 'AI anahtarı yapılandırılmamış.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('AI Route Error:', error);
        res.status(500).json({ error: 'AI ile iletişim kurulurken bir hata oluştu.' });
    }
});

module.exports = router;
