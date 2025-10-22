// server.js - Google Gemini API (FIXED VERSION)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Get API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3001;

// Use the stable v1 API with gemini-pro model
const GEMINI_MODEL = "gemini-pro";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

console.log('🔑 Gemini API Key Check:');
console.log('   Exists:', !!GEMINI_API_KEY);
console.log('   Model:', GEMINI_MODEL);
console.log('   Preview:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT SET');

if (!GEMINI_API_KEY) {
  console.error('❌ CRITICAL: GEMINI_API_KEY not found!');
  console.error('   Get your free key at: https://makersuite.google.com/app/apikey');
}

const SYSTEM_PROMPT = `You are "She Deserves AI", a compassionate and knowledgeable assistant specializing in menstrual health, hygiene, and emotional wellness.

Provide supportive, medically accurate information about:
- Menstrual health and period care
- Hygiene practices and products
- Emotional well-being during menstruation
- Common symptoms and when to seek medical help
- Nutrition and lifestyle tips for menstrual health

Always be empathetic, non-judgmental, and encouraging. Keep responses concise (2-3 paragraphs max) and actionable.`;

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "She Deserves AI Backend (Gemini)",
    status: "running",
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString(),
    apiConfigured: !!GEMINI_API_KEY
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is healthy",
    apiKeyConfigured: !!GEMINI_API_KEY,
    aiProvider: "Google Gemini",
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get("/api/test", async (req, res) => {
  console.log('🧪 Testing Gemini API...');
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Gemini API key not configured",
      hint: "Get free key at: https://makersuite.google.com/app/apikey"
    });
  }
  
  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Say only: Connection successful" }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    
    console.log('✅ Gemini test SUCCESS:', text);

    res.json({ 
      success: true, 
      message: "Gemini API working perfectly!",
      response: text,
      model: GEMINI_MODEL
    });

  } catch (error) {
    console.error('❌ Gemini test FAILED:', error.message);

    res.status(500).json({ 
      success: false,
      error: error.message,
      hint: "Check your API key at https://makersuite.google.com/app/apikey"
    });
  }
});

// Main chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log('💬 Chat request received');
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "API key not configured",
      hint: "Get free key at: https://makersuite.google.com/app/apikey"
    });
  }
  
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: "Valid message is required" });
    }

    console.log('📝 Processing message...');

    // Build the prompt with context
    // Gemini Pro works better with a single combined prompt
    let fullPrompt = SYSTEM_PROMPT + "\n\n";
    
    // Add conversation history
    const recentHistory = history.slice(-4); // Last 4 messages
    if (recentHistory.length > 0) {
      fullPrompt += "Previous conversation:\n";
      recentHistory.forEach(msg => {
        if (msg.role && msg.content) {
          const role = msg.role === "user" ? "User" : "Assistant";
          fullPrompt += `${role}: ${msg.content}\n`;
        }
      });
      fullPrompt += "\n";
    }

    // Add current message
    fullPrompt += `User: ${message.trim()}\n\nAssistant:`;

    console.log('📤 Sending to Gemini...');
    
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Check if content was blocked
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      return res.json({
        response: "I apologize, but I need to ensure our conversation remains supportive and appropriate. Could you rephrase your question about menstrual health or wellness?",
        model: GEMINI_MODEL,
        timestamp: new Date().toISOString()
      });
    }
    
    // Extract response text
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error('Empty response from Gemini');
    }

    console.log('✅ Response generated:', aiResponse.substring(0, 50) + '...');

    res.json({ 
      response: aiResponse.trim(),
      model: GEMINI_MODEL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    
    let statusCode = 500;
    let errorMessage = "Unable to process your request";

    if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
      statusCode = 401;
      errorMessage = "Invalid API key. Please check your Gemini API key.";
    } else if (error.message.includes('RATE_LIMIT') || error.message.includes('429')) {
      statusCode = 429;
      errorMessage = "Rate limit exceeded. Please try again in a moment.";
    } else if (error.message.includes('quota')) {
      statusCode = 429;
      errorMessage = "Daily quota exceeded. Please try again tomorrow.";
    } else if (error.message.includes('400')) {
      statusCode = 400;
      errorMessage = "Invalid request format.";
    } else {
      errorMessage = error.message;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    availableEndpoints: ['GET /', 'GET /health', 'GET /api/test', 'POST /api/chat']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server Started - Google Gemini Pro!
   Port: ${PORT}
   Model: ${GEMINI_MODEL}
   API: v1 (stable)
   Time: ${new Date().toISOString()}
   API Key: ${GEMINI_API_KEY ? '✅ Configured' : '❌ MISSING'}
   
📍 Get your FREE API key:
   https://makersuite.google.com/app/apikey
   OR
   https://aistudio.google.com/app/apikey
   
📍 Endpoints:
   https://shedesrvesse-1-3.onrender.com/health
   https://shedesrvesse-1-3.onrender.com/api/test
   https://shedesrvesse-1-3.onrender.com/api/chat
  `);
});- Emotional well-being during menstruation
- Common symptoms and when to seek medical help
- Nutrition and lifestyle tips for menstrual health

Always be empathetic, non-judgmental, and encouraging. Keep responses concise (2-3 paragraphs max) and actionable.`;

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "She Deserves AI Backend (Gemini)",
    status: "running",
    timestamp: new Date().toISOString(),
    apiConfigured: !!GEMINI_API_KEY
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is healthy",
    apiKeyConfigured: !!GEMINI_API_KEY,
    aiProvider: "Google Gemini",
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get("/api/test", async (req, res) => {
  console.log('🧪 Testing Gemini API...');
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Gemini API key not configured",
      hint: "Get free key at: https://makersuite.google.com/app/apikey"
    });
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Say only: Connection successful" }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    
    console.log('✅ Gemini test SUCCESS:', text);

    res.json({ 
      success: true, 
      message: "Gemini API working perfectly!",
      response: text,
      model: "gemini-1.5-flash"
    });

  } catch (error) {
    console.error('❌ Gemini test FAILED:', error.message);

    res.status(500).json({ 
      success: false,
      error: error.message,
      hint: "Check your API key at https://makersuite.google.com/app/apikey"
    });
  }
});

// Main chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log('💬 Chat request received');
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "API key not configured",
      hint: "Get free key at: https://makersuite.google.com/app/apikey"
    });
  }
  
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: "Valid message is required" });
    }

    console.log('📝 Processing message...');

    // Build conversation context for Gemini
    // Gemini uses a different format than OpenAI
    const contents = [];
    
    // Add system prompt as first user message
    contents.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "I understand. I'll be a compassionate wellness assistant focused on menstrual health." }]
    });

    // Add conversation history
    history.slice(-6).forEach(msg => {
      if (msg.role && msg.content) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }
    });

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }]
    });

    console.log('📤 Sending to Gemini...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Extract response text
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error('Empty response from Gemini');
    }

    console.log('✅ Response generated');

    res.json({ 
      response: aiResponse,
      model: "gemini-1.5-flash",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    
    let statusCode = 500;
    let errorMessage = "Unable to process your request";

    if (error.message.includes('API_KEY_INVALID')) {
      statusCode = 401;
      errorMessage = "Invalid API key";
    } else if (error.message.includes('RATE_LIMIT')) {
      statusCode = 429;
      errorMessage = "Rate limit exceeded. Please try again in a moment.";
    } else if (error.message.includes('quota')) {
      statusCode = 429;
      errorMessage = "Daily quota exceeded";
    } else {
      errorMessage = error.message;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    availableEndpoints: ['GET /', 'GET /health', 'GET /api/test', 'POST /api/chat']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server Started - Google Gemini Version!
   Port: ${PORT}
   Time: ${new Date().toISOString()}
   API Key: ${GEMINI_API_KEY ? '✅ Configured' : '❌ MISSING'}
   Provider: Google Gemini (FREE)
   
📍 Get your FREE API key:
   https://makersuite.google.com/app/apikey
   
📍 Endpoints:
   https://shedesrvesse-1-3.onrender.com/health
   https://shedesrvesse-1-3.onrender.com/api/test
   https://shedesrvesse-1-3.onrender.com/api/chat
  `);
});
