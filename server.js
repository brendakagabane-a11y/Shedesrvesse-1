import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🚀 Starting She Deserves AI with Gemini...');
console.log('🔑 API Key exists:', !!GEMINI_API_KEY);

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    ai: "Google Gemini",
    service: "She Deserves Wellness Assistant",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "💜 She Deserves AI Wellness Assistant",
    version: "2.0.0",
    endpoints: ["GET /health", "POST /api/chat"]
  });
});

// AI Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    console.log('💬 Received message:', message);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    // If no API key, use fallback immediately
    if (!GEMINI_API_KEY) {
      console.log('⚠️ No API key, using fallback');
      const fallbackResponse = getFallbackResponse(message);
      return res.json({ response: fallbackResponse });
    }

    try {
      // Initialize Gemini AI with CORRECT model name
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // ✅ CORRECT MODEL NAMES THAT WORK:
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",  // ✅ Use this one - it's free and reliable
        // model: "gemini-1.5-pro-latest",  // Alternative if you have access
      });

      const prompt = `You are "She Deserves AI", a compassionate wellness assistant specializing in menstrual health, hygiene, and emotional wellness. 

User Question: ${message}

Please provide a supportive, accurate, and helpful response focused on:
- Menstrual health education
- Hygiene best practices  
- Emotional wellness support
- Evidence-based information
- Compassionate, empowering tone

Keep responses clear, practical, and uplifting.`;

      console.log('📤 Sending to Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();

      console.log('✅ Gemini response received');
      
      res.json({ 
        response: aiText,
        timestamp: new Date().toISOString()
      });

    } catch (geminiError) {
      console.error('❌ Gemini API error:', geminiError);
      
      // Fallback response if Gemini fails
      const fallbackResponse = getFallbackResponse(message);
      res.json({ 
        response: fallbackResponse,
        note: "Using fallback response",
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('💥 Server error:', error);
    
    const fallbackResponse = getFallbackResponse(message);
    res.json({ 
      response: fallbackResponse,
      error: "Server issue - using fallback",
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive fallback responses
function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  const responses = {
    greeting: "Hello! I'm your She Deserves AI Assistant. I'm here to support you with questions about menstrual health, hygiene, and emotional wellness. How can I help you today? 💜",
    
    hello: "Hi there! I'm here to help with menstrual health, hygiene practices, emotional wellness, and anything related to your cycle. What would you like to know?",
    
    cramps: "For period cramps:\n• Use a heating pad or warm compress on your abdomen\n• Try gentle exercises like walking, stretching, or yoga\n• Stay hydrated with warm drinks like herbal tea\n• Over-the-counter pain relief can help (follow package instructions)\n• Light abdominal massage may provide relief\n• Getting enough rest is important",
    
    period: "Periods are a natural part of the menstrual cycle where the uterus sheds its lining. This typically happens every 21-35 days and lasts 2-7 days. It's completely normal and healthy!",
    
    pms: "Managing PMS symptoms:\n• Eat balanced meals with complex carbohydrates\n• Reduce salt, caffeine, and sugar intake\n• Exercise regularly to boost mood and reduce bloating\n• Ensure 7-9 hours of quality sleep\n• Practice stress-reduction like deep breathing or meditation\n• Consider calcium (1200mg) and magnesium supplements\n• Stay hydrated with water",
    
    hygiene: "Menstrual hygiene best practices:\n• Change pads every 4-6 hours, tampons every 4-8 hours\n• Wash hands before and after changing products\n• Clean genital area with mild, unscented soap and water\n• Wear breathable cotton underwear\n• Consider menstrual cups as an eco-friendly option\n• Shower regularly during your period\n• Always have spare products available",
    
    emotional: "Emotional changes during your cycle are normal due to hormonal fluctuations. Be kind to yourself! Try:\n• Talking with trusted friends or family\n• Light exercise like walking or yoga\n• Journaling your feelings\n• Getting adequate rest\n• Practicing deep breathing exercises\n• Remembering these feelings are temporary and natural",
    
    products: "Common menstrual products include:\n• Pads: Stick to underwear, good for overnight\n• Tampons: Internal protection, change regularly\n• Menstrual cups: Reusable, eco-friendly option\n• Period underwear: Absorbent, washable\n• Choose what feels most comfortable for your body and flow",
    
    cycle: "A typical menstrual cycle is 21-35 days, with periods lasting 2-7 days. Cycles can vary, especially in teenage years. Tracking your cycle can help you understand your patterns.",
    
    pain: "For menstrual pain management:\n• Heat therapy with heating pads\n• Gentle physical activity\n• Over-the-counter pain relief\n• Staying hydrated\n• Adequate rest\n• If pain is severe or affecting daily life, consult a healthcare provider",
    
    default: "I'm here to help with menstrual health, hygiene practices, emotional wellness, and cycle-related questions. You can ask me about period care, PMS management, hygiene tips, emotional support, or anything else you're curious about. What would you like to know? 💕"
  };

  // Smart matching
  if (/(hello|hi|hey|good morning|good afternoon)/.test(lowerMsg)) 
    return responses.hello;
  if (/(cramp|pain|hurt|aching)/.test(lowerMsg)) 
    return responses.cramps;
  if (/(pms|premenstrual|before period|mood swing)/.test(lowerMsg)) 
    return responses.pms;
  if (/(hygiene|clean|wash|shower|bath)/.test(lowerMsg)) 
    return responses.hygiene;
  if (/(emotional|mood|feel|sad|angry|irritabl|anxious)/.test(lowerMsg)) 
    return responses.emotional;
  if (/(product|pad|tampon|cup|protection)/.test(lowerMsg)) 
    return responses.products;
  if (/(cycle|regular|irregular|days|length)/.test(lowerMsg)) 
    return responses.cycle;
  if (/(period|menstrual|monthly|bleeding|flow)/.test(lowerMsg)) 
    return responses.period;
  
  return responses.default;
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    available: ["GET /health", "POST /api/chat"]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅ SHE DESERVES AI SERVER RUNNING!
   Port: ${PORT}
   AI: Google Gemini
   Model: gemini-pro
   Time: ${new Date().toISOString()}
   
📍 Test endpoints:
   https://your-app.onrender.com/health
   https://your-app.onrender.com/api/chat
  `);
});
