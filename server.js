// EMERGENCY TEST SERVER - Deploy this FIRST to verify Render works
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

console.log('🚀 Starting emergency test server...');
console.log('Port:', PORT);
console.log('HF Key exists:', !!process.env.HUGGINGFACE_API_KEY);

// Root
app.get("/", (req, res) => {
  console.log('📍 GET / called');
  res.json({ 
    message: "✅ SERVER IS ALIVE!",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Health
app.get("/health", (req, res) => {
  console.log('📍 GET /health called');
  res.json({ 
    status: "ok",
    message: "Emergency test server running",
    hfKeyExists: !!process.env.HUGGINGFACE_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Test chat endpoint (no AI yet, just echo)
app.post("/api/chat", (req, res) => {
  console.log('📍 POST /api/chat called');
  console.log('Body:', req.body);
  
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }
  
  // Echo response to test if endpoint works
  res.json({
    response: `🔄 TEST MODE: You said "${message}". The /api/chat endpoint is working! Next step: Add Hugging Face AI.`,
    timestamp: new Date().toISOString(),
    testMode: true
  });
});

// Catch all 404
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({ 
    error: "Not Found",
    path: req.path,
    method: req.method,
    availableRoutes: [
      "GET /",
      "GET /health", 
      "POST /api/chat"
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: "Server error",
    message: err.message 
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅✅✅ EMERGENCY TEST SERVER RUNNING! ✅✅✅
   Port: ${PORT}
   Host: 0.0.0.0
   Time: ${new Date().toISOString()}
   HF Key: ${process.env.HUGGINGFACE_API_KEY ? 'Configured ✅' : 'Missing ❌'}
   
📍 Test these URLs:
   https://shedesrvesse-1-5.onrender.com/
   https://shedesrvesse-1-5.onrender.com/health
   https://shedesrvesse-1-5.onrender.com/api/chat (POST)
   
👉 If these work, then we can add Hugging Face AI!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});
