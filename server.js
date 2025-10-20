// server.js
// She Deserves AI Backend (optimized for Render deployment)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration - allow your GitHub Pages domain
app.use(cors({
  origin: [
    'https://brendakagabane-a11y.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Verify API key is present
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ ERROR: OPENAI_API_KEY is not set!");
  console.log("Please add it in your Render dashboard under Environment variables");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

// Define system prompt
const SYSTEM_PROMPT = `You are "She Deserves AI", a compassionate and knowledgeable virtual assistant dedicated to guiding girls and women through menstrual health, hygiene, and emotional wellbeing.

Your role:
- Provide accurate, helpful information about menstrual health, hygiene products, and emotional wellness
- Be empathetic, supportive, and non-judgmental
- Use simple, clear language that's easy to understand
- Encourage healthy habits and self-care
- NEVER prescribe medication or provide medical diagnoses
- Always recommend consulting a healthcare provider for serious concerns
- Respect cultural sensitivities around menstruation

Keep responses concise (2-4 paragraphs), friendly, and actionable.`;

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "She Deserves AI API",
    status: "running",
    endpoints: {
      health: "/health",
      chat: "/api/chat (POST)"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  res.json({ 
    status: "ok", 
    message: "She Deserves API is running",
    apiKeyConfigured: hasApiKey,
    timestamp: new Date().toISOString()
  });
});

// Main chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    // Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Valid message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "Server configuration error. Please contact support." 
      });
    }

    // Trim message
    const userMessage = message.trim();
    if (userMessage.length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Keep only the last 10 messages for context
    const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];

    // Construct messages for OpenAI
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...trimmedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: userMessage },
    ];

    console.log(`📨 Processing message: "${userMessage.substring(0, 50)}..."`);

    // Request completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 400,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim() || 
      "I'm sorry, I couldn't generate a response. Please try again.";

    console.log(`✅ Response generated (${aiResponse.length} chars)`);

    res.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in /api/chat:", error.message);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      return res.status(500).json({ 
        error: "API authentication failed. Please contact support." 
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: "Too many requests. Please wait a moment and try again." 
      });
    }

    if (error.status === 500 || error.status === 503) {
      return res.status(503).json({ 
        error: "AI service temporarily unavailable. Please try again in a moment." 
      });
    }

    // Generic error
    res.status(500).json({ 
      error: "Something went wrong. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    availableEndpoints: ["/health", "/api/chat"]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 She Deserves AI server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
