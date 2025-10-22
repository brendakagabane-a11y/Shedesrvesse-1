// server.js - Hugging Face API (100% FREE VERSION)
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
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const PORT = process.env.PORT || 3001;

// Using Mistral-7B model (fast, free, and reliable)
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

console.log('🔑 Hugging Face API Key Check:');
console.log('   Exists:', !!HF_API_KEY);
console.log('   Model:', HF_MODEL);
console.log('   Preview:', HF_API_KEY ? HF_API_KEY.substring(0, 10) + '...' : 'NOT SET');

if (!HF_API_KEY) {
  console.error('❌ CRITICAL: HUGGINGFACE_API_KEY not found!');
  console.error('   Get your free key at: https://huggingface.co/settings/tokens');
}

const SYSTEM_PROMPT = `You are "She Deserves AI", a compassionate assistant for menstrual health and wellness. Provide supportive, accurate information about period care, hygiene, and emotional health. Be empathetic and concise (2-3 paragraphs max).`;

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "She Deserves AI Backend (Hugging Face)",
    status: "running",
    model: HF_MODEL,
    timestamp: new Date().toISOString(),
    apiConfigured: !!HF_API_KEY
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is healthy",
    apiKeyConfigured: !!HF_API_KEY,
    aiProvider: "Hugging Face",
    model: HF_MODEL,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get("/api/test", async (req, res) => {
  console.log('🧪 Testing Hugging Face API...');
  
  if (!HF_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Hugging Face API key not configured",
      hint: "Get free key at: https://huggingface.co/settings/tokens"
    });
  }
  
  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: "Say only: Connection successful",
        parameters: {
          max_new_tokens: 10,
          temperature: 0.1,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data[0]?.generated_text || "No response";
    
    console.log('✅ Hugging Face test SUCCESS:', text);

    res.json({ 
      success: true, 
      message: "Hugging Face API working perfectly!",
      response: text,
      model: HF_MODEL
    });

  } catch (error) {
    console.error('❌ Test FAILED:', error.message);

    // Handle model loading
    if (error.message.includes('loading')) {
      return res.status(503).json({ 
        success: false,
        error: "Model is loading (takes ~20 seconds on first request)",
        hint: "Please try again in a moment"
      });
    }

    res.status(500).json({ 
      success: false,
      error: error.message,
      hint: "Check your API key at https://huggingface.co/settings/tokens"
    });
  }
});

// Main chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log('💬 Chat request received');
  
  if (!HF_API_KEY) {
    return res.status(500).json({ 
      error: "API key not configured",
      hint: "Get free key at: https://huggingface.co/settings/tokens"
    });
  }
  
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: "Valid message is required" });
    }

    console.log('📝 Processing message...');

    // Build conversation prompt for Mistral format
    let prompt = `<s>[INST] ${SYSTEM_PROMPT}\n\n`;
    
    // Add conversation history
    const recentHistory = history.slice(-4);
    if (recentHistory.length > 0) {
      prompt += "Previous conversation:\n";
      recentHistory.forEach(msg => {
        if (msg.role && msg.content) {
          if (msg.role === "user") {
            prompt += `User: ${msg.content}\n`;
          } else {
            prompt += `Assistant: ${msg.content}\n`;
          }
        }
      });
      prompt += "\n";
    }

    // Add current message
    prompt += `User: ${message.trim()}\n\nProvide a helpful, empathetic response: [/INST]`;

    console.log('📤 Sending to Hugging Face...');
    
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      
      // Handle model loading
      if (error.error && error.error.includes('loading')) {
        return res.status(503).json({
          error: "AI model is warming up. This takes about 20 seconds on the first request. Please try again!",
          loading: true
        });
      }
      
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Extract response
    let aiResponse = data[0]?.generated_text || "";
    
    if (!aiResponse) {
      throw new Error('Empty response from Hugging Face');
    }

    // Clean up the response (remove any prompt artifacts)
    aiResponse = aiResponse.trim();
    
    console.log('✅ Response generated:', aiResponse.substring(0, 50) + '...');

    res.json({ 
      response: aiResponse,
      model: HF_MODEL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    
    let statusCode = 500;
    let errorMessage = "Unable to process your request";

    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      statusCode = 401;
      errorMessage = "Invalid API key. Please check your Hugging Face token.";
    } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
      statusCode = 429;
      errorMessage = "Too many requests. Please wait a moment.";
    } else if (error.message.includes('loading') || error.message.includes('503')) {
      statusCode = 503;
      errorMessage = "Model is loading. Please try again in 20 seconds.";
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      errorMessage = "Request timed out. Please try again.";
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
🚀 Server Started - Hugging Face Inference API!
   Port: ${PORT}
   Model: ${HF_MODEL}
   Provider: Hugging Face (100% FREE)
   Time: ${new Date().toISOString()}
   API Key: ${HF_API_KEY ? '✅ Configured' : '❌ MISSING'}
   
📍 Get your FREE API token:
   https://huggingface.co/settings/tokens
   (Click "New token" → Name it → Select "read" role → Create)
   
📍 Endpoints:
   https://shedesrvesse-1-3.onrender.com/health
   https://shedesrvesse-1-3.onrender.com/api/test
   https://shedesrvesse-1-3.onrender.com/api/chat
   
⚠️  Note: First request may take 20 seconds (model loading)
  `);
});
