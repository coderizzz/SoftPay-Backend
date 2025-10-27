import express from "express";
import isLoggedIn from "../middleware/authMiddleware.js";
import { generateReport, getReportHistory, downloadReport } from "../controllers/reportController.js";

const router = express.Router();

router.post("/generate", isLoggedIn, generateReport);
router.get("/history", isLoggedIn, getReportHistory);
router.get("/download/:id", isLoggedIn, downloadReport);

export default router;
