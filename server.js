// server.js - DEBUG VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Debug: Check if API key is loaded
console.log('🔑 Checking OpenAI API key...');
console.log('Key exists:', !!process.env.OPENAI_API_KEY);
console.log('Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'No key');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

const SYSTEM_PROMPT = `You are "She Deserves AI", a compassionate assistant for menstrual health and wellness.`;

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "She Deserves AI Backend",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Health check with API key status
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is healthy",
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    apiKeyPreview: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'Not set'
  });
});

// Detailed test endpoint
app.get("/api/test", async (req, res) => {
  console.log('🧪 Testing OpenAI connection...');
  
  try {
    // Test with a very simple request
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ 
        role: "user", 
        content: "Just say 'Test successful' and nothing else." 
      }],
      max_tokens: 5,
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('✅ OpenAI test SUCCESS:', response);

    res.json({ 
      success: true, 
      message: "OpenAI connection successful",
      response: response,
      model: "gpt-4o-mini"
    });

  } catch (error) {
    console.log('❌ OpenAI test FAILED:');
    console.log('Error name:', error.name);
    console.log('Error code:', error.code);
    console.log('Error status:', error.status);
    console.log('Full error:', error);

    let userMessage = "OpenAI API error";
    let statusCode = 500;

    if (error.status === 401) {
      userMessage = "Invalid OpenAI API key";
      statusCode = 401;
    } else if (error.status === 429) {
      userMessage = "Rate limit exceeded - but usage shows zero?";
      statusCode = 429;
    } else if (error.code === 'invalid_api_key') {
      userMessage = "API key is invalid or malformed";
      statusCode = 401;
    } else if (error.message.includes('API key')) {
      userMessage = "API key issue: " + error.message;
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      success: false,
      error: userMessage,
      details: error.message,
      errorCode: error.code,
      errorStatus: error.status
    });
  }
});

// Chat endpoint with detailed error handling
app.post("/api/chat", async (req, res) => {
  console.log('💬 Chat request received');
  
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log('Processing message:', message.substring(0, 50) + '...');

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: "user", content: message.trim() },
    ];

    console.log('Sending to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 200, // Reduced for testing
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm here to help!";
    console.log('✅ Response generated');

    res.json({ 
      response: aiResponse,
      usage: completion.usage
    });

  } catch (error) {
    console.error('❌ Chat error details:');
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);
    
    let statusCode = 500;
    let errorMessage = "Something went wrong";

    if (error.status === 401) {
      statusCode = 401;
      errorMessage = "Invalid API key configuration";
    } else if (error.status === 429) {
      statusCode = 429;
      errorMessage = "Rate limit exceeded. Please try again in a moment.";
    } else if (error.code === 'invalid_api_key') {
      statusCode = 401;
      errorMessage = "The API key is invalid or has been revoked";
    } else {
      errorMessage = error.message || "Unknown error occurred";
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      errorCode: error.code,
      errorStatus: error.status
    });
  }
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: https://shedesrvesse-1-3.onrender.com/health`);
  console.log(`📍 API test: https://shedesrvesse-1-3.onrender.com/api/test`);
});
