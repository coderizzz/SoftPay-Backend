import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" }, 
  predictedBudgets: {
    food: { type: Number, required: true, default: 0 },
    transport: { type: Number, required: true, default: 0 },
    shopping: { type: Number, required: true, default: 0 },
    entertainment: { type: Number, required: true, default: 0 },
    bills: { type: Number, required: true, default: 0 },
    groceries: { type: Number, required: true, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
