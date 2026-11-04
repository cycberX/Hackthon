import express from "express";

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Mock OneAPI Gateway is running",
  });
});

app.post("/api/v1/proxy/ai/chat", async (req, res) => {
  try {
    // 1. Single unified Authorization check
    const authorization = req.headers.authorization || req.headers["x-api-key"];

    if (!authorization) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Missing OneAPI Developer API Key or Authorization header",
      });
    }

    // 2. Validate request
    const { messages, model = "default", temperature = 0.7 } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Messages are required",
      });
    }

    console.log("\n========== ONEAPI REQUEST ==========");
    console.log("Requested model:", model);
    console.log("Temperature:", temperature);
    console.log("Last message:", messages[messages.length - 1]?.content);

    // Simulated provider failover behavior
    res.json({
      success: true,
      requestId: "mock-req-" + Date.now(),
      provider: "gemini",
      model: "gemini-1.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Quantum computing harnesses superposition and entanglement to calculate complex problems exponentially faster than classical computers.",
          },
          finishReason: "stop",
        },
      ],
    });
  } catch (error) {
    console.error("Gateway error:", error.message);
    res.status(500).json({
      success: false,
      code: "GATEWAY_ERROR",
      message: error.message,
    });
  }
});

app.post("/api/v1/proxy/ai/upload", async (req, res) => {
  res.json({
    success: true,
    fileId: "file_" + Math.random().toString(36).substring(2, 10),
    filename: req.body?.filename || "document.txt",
    purpose: req.body?.purpose || "assistants",
    bytes: 1024,
    status: "processed",
  });
});

app.listen(PORT, () => {
  console.log(`Mock OneAPI Gateway listening on http://localhost:${PORT}`);
});
