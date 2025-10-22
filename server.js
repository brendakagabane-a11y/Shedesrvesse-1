// MINIMAL TEST SERVER - Debug version
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

console.log('🔧 Starting Debug Server...');

// Test endpoint that definitely works
app.get("/health", (req, res) => {
  console.log('✅ Health check called');
  res.json({ 
    status: "ok", 
    message: "Debug server is working",
    timestamp: new Date().toISOString()
  });
});

// Simple chat endpoint
app.post("/api/chat", (req, res) => {
  console.log('💬 Chat endpoint called');
  console.log('Request body:', req.body);
  
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  
  // Simple echo response
  res.json({
    response: `Debug: You said "${message}". Server is working!`,
    timestamp: new Date().toISOString()
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.originalUrl);
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Debug server running on port ${PORT}`);
});
