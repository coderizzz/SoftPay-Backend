import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    category: { type: String },
    aiCategory: { type: String },
    feedback: { type: Boolean },
    type: { type: String, enum: ["income", "expense"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
