import express from "express";
import { registerUser, loginUser, verifyToken, getUserById } from "../api.js";

const router = express.Router();

// POST /api/auth/login - Production login with database
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error("Error during login:", error);
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: message });
  }
});

// POST /api/auth/register - Production registration with database
router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "All fields required" });
    }

    const result = await registerUser(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error during registration:", error);
    const message =
      error instanceof Error ? error.message : "Registration failed";
    res.status(400).json({ error: message });
  }
});

// GET /api/auth/me - Get current user info
router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error getting user info:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
