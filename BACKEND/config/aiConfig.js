// backend/config/aiConfig.js

const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,

    baseURL: "https://openrouter.ai/api/v1",

    defaultHeaders: {
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "ZYNTRA AI"
    }
});

module.exports = openai;