import express from "express";
import {
  setBudget,
  compareSpending,
  generateMonthlyInsight,
  getAllBudgetHistory, 
} from "../controllers/predictionController.js";
import isLoggedIn from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/set", isLoggedIn, setBudget);
router.post("/compare", isLoggedIn, compareSpending);
router.post("/insight", isLoggedIn, generateMonthlyInsight);
router.get("/history", isLoggedIn, getAllBudgetHistory);

export default router;
