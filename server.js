// server.js
// She Deserves AI Backend (for Railway deployment)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables from .env (only for local development)
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

// Define system prompt (AI’s personality)
const SYSTEM_PROMPT = `
You are "She Deserves AI", a compassionate and knowledgeable virtual assistant
dedicated to guiding girls and women through menstrual health, hygiene, and emotional wellbeing.
Always respond kindly, clearly, and in easy-to-understand language.
Avoid giving any medical prescriptions. Encourage consulting a doctor if serious symptoms arise.
Keep responses friendly and informative.
`;

// Health check endpoint (for Railway)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "She Deserves API is running" });
});

// Main chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Keep only the last 10 messages for context
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-10)
      : [];

    // Construct messages for OpenAI
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...trimmedHistory,
      { role: "user", content: message },
    ];

    // Request completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 350,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim() || "";

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("❌ OpenAI Error:", error);

    if (error.status === 401) {
      return res.status(401).json({ error: "Invalid OpenAI API key" });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: "Rate limit reached. Please try again later." });
    }

    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 She Deserves AI server running on port ${PORT}`);
});
