import express from "express";
import cors from "cors";
import sdkRoutes from "./routes/sdk.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "OneAPI SDK Engine is running",
  });
});

app.use("/api/v1/sdk", sdkRoutes);

export default app;