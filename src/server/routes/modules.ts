import express from "express";
import { getModules, getModuleById, saveModule } from "../api.js";

const router = express.Router();

// GET /api/modules - Get all modules
router.get("/", (_req, res) => {
  try {
    const modules = getModules();
    res.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});

// GET /api/modules/:id - Get specific module
router.get("/:id", (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    const module = getModuleById(moduleId);

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ error: "Failed to fetch module" });
  }
});

// POST /api/modules - Add new module
router.post("/", (req, res) => {
  try {
    const moduleData = req.body;

    // Validate required fields
    if (!moduleData.title || !moduleData.description || !moduleData.content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const savedModule = saveModule(moduleData);
    res.status(201).json(savedModule);
  } catch (error) {
    console.error("Error saving module:", error);
    res.status(500).json({ error: "Failed to save module" });
  }
});

// POST /api/modules/upload - Upload module from JSON file
router.post("/upload", (req, res) => {
  try {
    const { moduleData } = req.body;

    if (!moduleData) {
      return res.status(400).json({ error: "No module data provided" });
    }

    // Validate module structure
    if (!moduleData.title || !moduleData.description || !moduleData.content) {
      return res.status(400).json({ error: "Invalid module structure" });
    }

    const moduleId = saveModule(moduleData);
    res
      .status(201)
      .json({ id: moduleId, message: "Module uploaded successfully" });
  } catch (error) {
    console.error("Error uploading module:", error);
    res.status(500).json({ error: "Failed to upload module" });
  }
});

export default router;
