import mongoose from "mongoose";

const budgetHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  funnyMemeUrl: { type: String, default: "" },
  predictedBudgets: {
    food: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    bills: { type: Number, default: 0 },
    groceries: { type: Number, default: 0 },
  },
  actualSpending: {
    food: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    bills: { type: Number, default: 0 },
    groceries: { type: Number, default: 0 },
  },
  overspendPercent: { type: Number, default: 0 },
  funnyMessage: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const BudgetHistory = mongoose.model("BudgetHistory", budgetHistorySchema);
export default BudgetHistory;
