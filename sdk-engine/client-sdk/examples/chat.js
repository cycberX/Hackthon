import { OneAPI } from "../src/index.js";

const oneapi = new OneAPI({
  apiKey: "demo-token",
  projectId: "demo-project",
  baseURL: "http://localhost:5000/api/v1",
});

async function main() {
  try {
    const response = await oneapi.ai.chat({
      model: "default",
      messages: [
        {
          role: "user",
          content: "[MOCK_PRIMARY_FAILURE] Explain AI simply.",
        },
      ],
    });

    console.log("\n========== ONEAPI RESULT ==========");
    console.log("Response:", response.content);
    console.log("Provider:", response.providerUsed);
    console.log("Fallback used:", response.usedFallback);
    console.log("Request ID:", response.id);
    console.log("Token usage:", response.usage);
    console.log("===================================\n");
  } catch (error) {
    console.error("OneAPI Error:", error.message);
    console.error("Error code:", error.code);
  }
}

main();
