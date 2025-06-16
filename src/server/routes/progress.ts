import express from "express";
import {
  updateLessonProgress,
  getLessonProgress,
  getModuleProgressDetailed,
  generateCertificate,
  getCertificate,
  verifyCertificate,
  getAllUserProgress,
  getAllLessonProgress,
  getAllUserCertificates,
  resetModuleProgress,
} from "../api";

const router = express.Router();

// GET /api/progress/:userId - Get all user progress for all modules
router.get("/:userId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const progress = getAllUserProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({ error: "Failed to fetch user progress" });
  }
});

// GET /api/progress/:userId/lessons - Get all lesson progress for user
router.get("/:userId/lessons", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const lessonProgress = getAllLessonProgress(userId);
    res.json(lessonProgress);
  } catch (error) {
    console.error("Error fetching lesson progress:", error);
    res.status(500).json({ error: "Failed to fetch lesson progress" });
  }
});

// GET /api/progress/:userId/certificates - Get all certificates for a user
router.get("/:userId/certificates", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const certificates = getAllUserCertificates(userId);
    res.json(certificates);
  } catch (error) {
    console.error("Error fetching user certificates:", error);
    res.status(500).json({ error: "Failed to fetch user certificates" });
  }
});

// GET /api/progress/:userId/:moduleId - Get user progress for a module
router.get("/:userId/:moduleId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moduleId = parseInt(req.params.moduleId);

    const progress = getModuleProgressDetailed(userId, moduleId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// GET /api/progress/:userId/:moduleId/:lessonId - Get lesson progress
router.get("/:userId/:moduleId/:lessonId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moduleId = parseInt(req.params.moduleId);
    const lessonId = req.params.lessonId;

    const progress = getLessonProgress(userId, moduleId, lessonId);
    res.json(progress || { completed: false, time_spent: 0 });
  } catch (error) {
    console.error("Error fetching lesson progress:", error);
    res.status(500).json({ error: "Failed to fetch lesson progress" });
  }
});

// POST /api/progress/lesson - Update lesson progress
router.post("/lesson", (req, res) => {
  try {
    const { userId, moduleId, lessonId, completed, timeSpent, quizScore } =
      req.body;

    if (
      !userId ||
      !moduleId ||
      !lessonId ||
      completed === undefined ||
      timeSpent === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store time in seconds (no conversion needed)
    updateLessonProgress(
      userId,
      moduleId,
      lessonId,
      completed,
      timeSpent,
      quizScore
    );

    // Return the updated lesson progress data
    const updatedProgress = getLessonProgress(userId, moduleId, lessonId);
    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    res.status(500).json({ error: "Failed to update lesson progress" });
  }
});

// POST /api/progress/certificate - Generate certificate
router.post("/certificate", (req, res) => {
  try {
    const { userId, moduleId } = req.body;

    if (!userId || !moduleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const certificateCode = generateCertificate(userId, moduleId);
    res.json({
      certificateCode,
      message: "Certificate generated successfully",
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate certificate";
    res.status(400).json({ error: message });
  }
});

// GET /api/progress/certificate/:userId/:moduleId - Get certificate
router.get("/certificate/:userId/:moduleId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moduleId = parseInt(req.params.moduleId);

    const certificate = getCertificate(userId, moduleId);
    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({ error: "Failed to fetch certificate" });
  }
});

// GET /api/progress/verify/:certificateCode - Verify certificate
router.get("/verify/:certificateCode", (req, res) => {
  try {
    const certificateCode = req.params.certificateCode;

    const certificate = verifyCertificate(certificateCode);
    if (!certificate) {
      return res
        .status(404)
        .json({ error: "Certificate not found or invalid" });
    }

    res.json(certificate);
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ error: "Failed to verify certificate" });
  }
});

/**
 * POST /api/progress/reset
 * Reset all progress and certificates for a user/module
 * Body: { userId, moduleId }
 */
router.post("/reset", (req, res) => {
  try {
    const { userId, moduleId } = req.body;
    if (!userId || !moduleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    resetModuleProgress(userId, moduleId);
    res.json({ message: "Progress reset successfully" });
  } catch (error) {
    console.error("Error resetting progress:", error);
    res.status(500).json({ error: "Failed to reset progress" });
  }
});

export default router;
