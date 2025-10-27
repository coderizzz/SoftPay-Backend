import express from "express";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  getSummary,
  getCategoryData,
  getMonthlyData,
  autoCategorize,
} from "../controllers/transactionController.js";
import isLoggedIn from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", isLoggedIn, getTransactions);
router.post("/", isLoggedIn,addTransaction);
router.delete("/:id", isLoggedIn,deleteTransaction);
router.put("/:id",isLoggedIn, updateTransaction);

router.get("/summary",isLoggedIn, getSummary);
router.get("/category",isLoggedIn, getCategoryData);
router.get("/monthly", isLoggedIn,getMonthlyData);

router.post("/categorize",isLoggedIn, autoCategorize);

export default router;
