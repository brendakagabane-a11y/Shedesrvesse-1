// COMPLETE AI SERVER - With Hugging Face Integration
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const PORT = process.env.PORT || 3001;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";

console.log('🚀 Starting She Deserves AI Server...');
console.log('📍 Port:', PORT);
console.log('🔑 HF Key exists:', !!HF_API_KEY);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    service: "She Deserves AI Assistant",
    ai: "Hugging Face DialoGPT",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "💜 She Deserves AI Wellness Assistant",
    version: "2.0.0",
    endpoints: [
      "GET /health",
      "POST /api/chat"
    ]
  });
});

// AI Chat endpoint with Hugging Face
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    console.log('💬 New message:', message);
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        error: "Message is required" 
      });
    }

    if (!HF_API_KEY) {
      console.warn('⚠️ No Hugging Face API key found');
      return res.status(500).json({
        error: "AI service not configured",
        response: "I'm currently undergoing maintenance. Please try again in a few moments."
      });
    }

    // Prepare conversation context
    let conversationContext = "";
    if (history.length > 0) {
      // Take last 4 exchanges for context
      const recentHistory = history.slice(-4);
      conversationContext = recentHistory.map(entry => 
        `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}`
      ).join('\n') + '\n';
    }

    const fullPrompt = `${conversationContext}User: ${message}\nAssistant:`;

    console.log('📤 Sending to Hugging Face...');
    
    const hfResponse = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          repetition_penalty: 1.1,
          do_sample: true,
          return_full_text: false
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('❌ Hugging Face API error:', hfResponse.status, errorText);
      
      if (hfResponse.status === 503) {
        return res.status(503).json({
          error: "AI model is loading",
          response: "The AI model is still warming up. This usually takes 20-30 seconds. Please try again in a moment."
        });
      }
      
      throw new Error(`Hugging Face API: ${hfResponse.status} - ${errorText}`);
    }

    const hfData = await hfResponse.json();
    console.log('📥 Hugging Face response:', hfData);

    let aiResponse = "";
    
    if (hfData && hfData[0] && hfData[0].generated_text) {
      // Extract just the assistant's response
      const fullText = hfData[0].generated_text;
      const assistantResponse = fullText.split('Assistant:').pop()?.trim();
      aiResponse = assistantResponse || fullText;
    } else {
      aiResponse = "I understand you're asking about wellness. Could you please rephrase your question?";
    }

    // Fallback responses for common questions
    if (aiResponse.length < 5) {
      aiResponse = getFallbackResponse(message);
    }

    // Clean up response
    aiResponse = aiResponse
      .split('User:')[0] // Remove any accidental user parts
      .trim();

    console.log('✅ Final AI response:', aiResponse);

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    
    let userMessage = "I'm having trouble connecting to the AI service right now. ";
    
    if (error.name === 'TimeoutError') {
      userMessage += "The request timed out. Please try again.";
    } else if (error.message.includes('503')) {
      userMessage += "The AI model is loading. Please wait 20 seconds and try again.";
    } else if (error.message.includes('429')) {
      userMessage += "Too many requests. Please wait a moment.";
    } else {
      userMessage += "Please try again in a few moments.";
    }

    res.status(500).json({
      error: error.message,
      response: userMessage
    });
  }
});

// Fallback responses for wellness topics
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  const fallbacks = {
    greeting: "Hello! I'm your She Deserves AI Assistant. I'm here to help with menstrual health, hygiene, and emotional wellness. What would you like to know?",
    period: "Period cramps are caused by uterine contractions. Try heat pads, gentle exercise, staying hydrated, and over-the-counter pain relief if needed.",
    pms: "For PMS: reduce salt/caffeine, eat balanced meals, exercise regularly, get enough sleep, and consider calcium/magnesium supplements.",
    hygiene: "Good menstrual hygiene: change products every 4-6 hours, wash with mild soap, wear breathable cotton, and always wash hands before/after changing.",
    pain: "For menstrual pain: heat therapy, gentle yoga, OTC pain relievers, and staying hydrated can help. If pain is severe, consult a healthcare provider.",
    emotional: "Hormonal changes can affect emotions. Self-care, talking with friends, light exercise, and adequate rest can help manage emotional changes.",
    default: "I specialize in menstrual health and wellness. You can ask me about period care, hygiene practices, emotional changes, or any related concerns."
  };

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return fallbacks.greeting;
  }
  if (lowerMessage.includes('cramp') || lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
    return fallbacks.pain;
  }
  if (lowerMessage.includes('pms') || lowerMessage.includes('premenstrual')) {
    return fallbacks.pms;
  }
  if (lowerMessage.includes('hygiene') || lowerMessage.includes('clean')) {
    return fallbacks.hygiene;
  }
  if (lowerMessage.includes('emotional') || lowerMessage.includes('mood') || lowerMessage.includes('feel')) {
    return fallbacks.emotional;
  }
  if (lowerMessage.includes('period') || lowerMessage.includes('menstrual') || lowerMessage.includes('cycle')) {
    return fallbacks.period;
  }
  
  return fallbacks.default;
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    available: ["GET /health", "POST /api/chat"]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅ SHE DESERVES AI SERVER RUNNING!
   Port: ${PORT}
   URL: https://shedesrvesse-1-5.onrender.com
   AI: Hugging Face DialoGPT
   Time: ${new Date().toISOString()}
   
📍 Test endpoints:
   https://shedesrvesse-1-5.onrender.com/health
   https://shedesrvesse-1-5.onrender.com/api/chat
   
💜 Ready to assist with wellness questions!
  `);
});
