import { OneAPI } from "../src/index.js";

async function main() {
  const oneapi = new OneAPI({
    apiKey: process.env.ONEAPI_PROJECT_TOKEN || "oneapi_dev_token_sample",
    projectId: process.env.ONEAPI_PROJECT_ID || "proj_sample",
    baseURL: process.env.ONEAPI_BASE_URL || "http://localhost:5000/api/v1",
  });

  console.log("1. Testing AI Chat Proxy with Failover...");
  try {
    const chat = await oneapi.ai.chat({
      messages: [{ role: "user", content: "Explain quantum computing in two sentences." }],
      temperature: 0.7,
    });
    console.log("Chat Response:", chat.choices[0]?.message?.content);
  } catch (err) {
    console.error("Chat Error:", err.message);
  }

  console.log("\n2. Testing AI File Upload...");
  try {
    const upload = await oneapi.ai.upload_file({
      file: "Sample document content for assistant context.",
      purpose: "assistants",
      filename: "quantum_notes.txt",
    });
    console.log("Uploaded File ID:", upload.fileId);
  } catch (err) {
    console.error("Upload Error:", err.message);
  }
}

main();
