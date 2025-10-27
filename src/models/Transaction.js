import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    aiCategory: { type: String },    
    feedback: { type: Boolean },     
    type: { type: String, enum: ['income', 'expense'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
