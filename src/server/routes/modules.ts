import express from "express";
import { getModules, getModuleById, saveModule } from "../api";

const router = express.Router();

// GET /api/modules - Get all modules
router.get("/", async (_req, res) => {
  try {
    const modules = await getModules(); // Added await!
    // console.log('📦 Modules from database:', modules);
    // console.log('📊 Modules count:', modules.length);

    // Return in the format your frontend expects
    res.json({ success: true, data: modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({
      success: false,
      error: { error: "Failed to fetch modules" }
    });
  }
});

// GET /api/modules/:id - Get specific module
router.get("/:id", async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    const module = await getModuleById(moduleId); // Added await!

    if (!module) {
      return res.status(404).json({
        success: false,
        error: { error: "Module not found" }
      });
    }

    res.json({ success: true, data: module });
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({
      success: false,
      error: { error: "Failed to fetch module" }
    });
  }
});

// POST /api/modules - Add new module
router.post("/", async (req, res) => {
  try {
    const moduleData = req.body;

    // Validate required fields
    if (!moduleData.title || !moduleData.description || !moduleData.content) {
      return res.status(400).json({
        success: false,
        error: { error: "Missing required fields" }
      });
    }

    const savedModule = await saveModule(moduleData); // Added await!
    res.status(201).json({ success: true, data: savedModule });
  } catch (error) {
    console.error("Error saving module:", error);
    res.status(500).json({
      success: false,
      error: { error: "Failed to save module" }
    });
  }
});

// POST /api/modules/upload - Upload module from JSON file
router.post("/upload", async (req, res) => {
  try {
    const { moduleData } = req.body;

    if (!moduleData) {
      return res.status(400).json({
        success: false,
        error: { error: "No module data provided" }
      });
    }

    // Validate module structure
    if (!moduleData.title || !moduleData.description || !moduleData.content) {
      return res.status(400).json({
        success: false,
        error: { error: "Invalid module structure" }
      });
    }

    const savedModule = await saveModule(moduleData); // Added await!
    res.status(201).json({
      success: true,
      data: {
        id: savedModule.id,
        message: "Module uploaded successfully"
      }
    });
  } catch (error) {
    console.error("Error uploading module:", error);
    res.status(500).json({
      success: false,
      error: { error: "Failed to upload module" }
    });
  }
});

export default router;