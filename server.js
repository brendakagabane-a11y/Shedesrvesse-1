// server.js - SIMPLIFIED WORKING VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// SIMPLE CORS - Allow all origins
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

// System prompt
const SYSTEM_PROMPT = `You are "She Deserves AI", a compassionate assistant for menstrual health and wellness. Respond kindly and informatively.`;

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "She Deserves AI Backend is running!" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy" });
});

// Test endpoint
app.get("/api/test", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say 'Test successful!'" }],
      max_tokens: 20,
    });
    
    res.json({ 
      success: true, 
      response: completion.choices[0]?.message?.content 
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Main chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-8),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 350,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "No response generated";

    res.json({ response: aiResponse });

  } catch (error) {
    console.error("Chat error:", error);
    
    if (error.status === 401) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }
    
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Handle favicon request to avoid 404
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
