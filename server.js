// Add this at the top of server.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// And make sure you have this for Render's health checks
app.get('/', (req, res) => {
  res.json({ 
    message: "She Deserves AI Backend", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});
// server.js - Updated version
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-url.vercel.app'],
  credentials: true
}));

app.use(express.json());

// Validate OpenAI API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing from environment variables");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

const SYSTEM_PROMPT = `
You are "She Deserves AI", a compassionate and knowledgeable virtual assistant
dedicated to guiding girls and women through menstrual health, hygiene, and emotional wellbeing.
Always respond kindly, clearly, and in easy-to-understand language.
Avoid giving any medical prescriptions. Encourage consulting a doctor if serious symptoms arise.
Keep responses friendly and informative.
`;

// Enhanced health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "She Deserves API is running",
    timestamp: new Date().toISOString()
  });
});

// Test OpenAI connection
app.get("/api/test", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say 'Hello from She Deserves AI!'" }],
      max_tokens: 50,
    });
    
    res.json({ 
      success: true, 
      message: "OpenAI connection successful",
      response: completion.choices[0]?.message?.content 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Main chat endpoint with enhanced error handling
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    console.log("📨 Received message:", message);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...trimmedHistory,
      { role: "user", content: message.trim() },
    ];

    console.log("🤖 Sending to OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 350,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim() || "I'm sorry, I couldn't generate a response.";

    console.log("✅ Response generated:", aiResponse.substring(0, 100) + "...");

    res.json({ 
      response: aiResponse,
      usage: completion.usage
    });

  } catch (error) {
    console.error("❌ OpenAI Error:", error);
    
    let statusCode = 500;
    let errorMessage = "Something went wrong. Please try again.";

    if (error.code === 'invalid_api_key') {
      statusCode = 401;
      errorMessage = "Invalid API key configuration";
    } else if (error.status === 429) {
      statusCode = 429;
      errorMessage = "Rate limit reached. Please try again later.";
    } else if (error.code === 'insufficient_quota') {
      statusCode = 402;
      errorMessage = "API quota exceeded. Please check your OpenAI account.";
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "She Deserves AI API", 
    version: "1.0.0",
    endpoints: ["GET /health", "GET /api/test", "POST /api/chat"]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 She Deserves AI server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
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
