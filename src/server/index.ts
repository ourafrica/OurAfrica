// Load environment variables FIRST, before any other imports
// Load environment variables first
import 'dotenv/config';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Now import everything else
import express from "express";
import cors from "cors";
import { initializeDatabase } from "./database";
import modulesRouter from "./routes/modules";
import progressRouter from "./routes/progress";
import authRouter from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/modules", modulesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/auth", authRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "Our Africa API is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Our Africa server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
});

export default app;