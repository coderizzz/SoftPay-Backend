import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    period: { type: String, required: true }, // e.g. "Jan 2025" or "2025-01-01_to_2025-01-31"
    format: { type: String, enum: ["pdf", "csv", "json"], default: "pdf" },
    fileUrl: { type: String, required: true }, // local path or uploaded file URL
    size: { type: Number },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
