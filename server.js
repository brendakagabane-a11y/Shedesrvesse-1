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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "free-tier");
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    maxOutputTokens: 500,
    temperature: 0.7,
  }
});

console.log('🚀 Starting She Deserves AI with Gemini...');

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    ai: "Google Gemini",
    service: "She Deserves Wellness Assistant"
  });
});

// AI Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // If no API key, use fallback
    if (!GEMINI_API_KEY) {
      const fallbackResponse = getFallbackResponse(message);
      return res.json({ response: fallbackResponse });
    }

    const prompt = `You are "She Deserves AI", a compassionate wellness assistant specializing in menstrual health, hygiene, and emotional wellness. 

User Question: ${message}

Please provide a supportive, accurate, and helpful response focused on:
- Menstrual health education
- Hygiene best practices  
- Emotional wellness support
- Evidence-based information
- Compassionate tone

Keep responses clear, practical, and empowering.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    res.json({ 
      response: aiText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini AI error:', error);
    
    // Fallback to rule-based responses
    const fallbackResponse = getFallbackResponse(message);
    res.json({ response: fallbackResponse });
  }
});

// Fallback responses
function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  const responses = {
    greeting: "Hello! I'm your She Deserves AI Assistant. I'm here to support you with menstrual health, hygiene, and emotional wellness. How can I help you today? 💜",
    
    period: "Periods are a natural part of your menstrual cycle. It's when your body sheds the uterine lining. Common symptoms include cramps, bloating, and mood changes - all completely normal!",
    
    cramps: "For period cramps:\n• Use a heating pad on your abdomen\n• Try gentle exercise like walking or yoga\n• Stay hydrated with warm drinks\n• Over-the-counter pain relief can help\n• Some find relief with light abdominal massage",
    
    pms: "Managing PMS:\n• Reduce salt, caffeine, and sugar intake\n• Eat balanced meals with complex carbs\n• Exercise regularly\n• Get 7-9 hours of sleep\n• Practice stress-reduction techniques\n• Consider calcium & magnesium supplements",
    
    hygiene: "Menstrual hygiene tips:\n• Change pads/tampons every 4-6 hours\n• Wash with mild, unscented soap\n• Wear breathable cotton underwear\n• Always wash hands before/after changing products\n• Consider menstrual cups for eco-friendly option",
    
    emotional: "Emotional changes are normal during your cycle. Be kind to yourself! Try:\n• Talking with trusted friends\n• Light exercise or yoga\n• Journaling your feelings\n• Getting enough rest\n• Remembering these feelings are temporary",
    
    default: "I'm here to help with menstrual health, hygiene practices, emotional wellness, and anything related to your cycle. You can ask me about period care, PMS management, hygiene tips, or emotional support. What would you like to know? 💕"
  };

  if (/(hello|hi|hey)/.test(lowerMsg)) return responses.greeting;
  if (/(cramp|pain|hurt)/.test(lowerMsg)) return responses.cramps;
  if (/(pms|premenstrual)/.test(lowerMsg)) return responses.pms;
  if (/(hygiene|clean)/.test(lowerMsg)) return responses.hygiene;
  if (/(emotional|mood|feel|sad)/.test(lowerMsg)) return responses.emotional;
  if (/(period|menstrual|cycle)/.test(lowerMsg)) return responses.period;
  
  return responses.default;
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
