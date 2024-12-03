import express from "express";
import { auth } from "../middleware/auth.js";
import { 
  getAvailableTests,
  registerForTest,
  getTestInstructions,
  updateProfile,
  updateSkills,
  getCertificates,
  getTestResults,
  downloadCertificate,
  getProgressReport,
  getPracticeTests,
  getSampleQuestions,
  getPerformanceHistory
} from "../controllers/candidate.controller.js";

const router = express.Router();

// Test Access Routes
router.get("/tests/available", auth, getAvailableTests);
router.post("/tests/:testId/register", auth, registerForTest);
router.get("/tests/:testId/instructions", auth, getTestInstructions);

// Profile Management Routes
router.put("/profile", auth, updateProfile);
router.put("/skills", auth, updateSkills);
router.get("/certificates", auth, getCertificates);

// Results Routes
router.get("/results", auth, getTestResults);
router.get("/certificates/:testId/download", auth, downloadCertificate);
router.get("/progress", auth, getProgressReport);

// Practice Area Routes
router.get("/practice/tests", auth, getPracticeTests);
router.get("/practice/questions", auth, getSampleQuestions);
router.get("/practice/history", auth, getPerformanceHistory);

export default router; 