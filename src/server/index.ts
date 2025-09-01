import express from "express";
import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
import { initializeDatabase } from "./database";

// Import API routes
import modulesRouter from "./routes/modules";
import progressRouter from "./routes/progress";
import authRouter from "./routes/auth";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname, "../../dist"))); // Commented out for development

// API Routes
app.use("/api/modules", modulesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/auth", authRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "Our Africa API is running" });
});

// Serve React app for all other routes (SPA fallback) - Commented out for development
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../../dist/index.html"));
// });

app.listen(PORT, () => {
  console.log(`🚀 Our Africa server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
});

export default app;
