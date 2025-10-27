import fs from "fs";
import path from "path";
import { format } from "date-fns";
import Report from "../models/reportModel.js";
import Transaction from "../models/Transaction.js";
import { generatePDFReport } from "../services/report/pdfService.js";
import { generateCSVReport } from "../services/report/csvService.js";
import { generateCharts } from "../services/report/chartService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

/**
 * ======================================================
 *  MANUAL REPORT GENERATION
 * ======================================================
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, formatType = "pdf" } = req.body;
  const userId = req.user._id;

  // 1️⃣ Fetch Transactions
  const transactions = await Transaction.find({
    userId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  if (!transactions.length)
    throw new ApiError(404, "No transactions found for this period");

  // 2️⃣ Generate Charts (Pie + Bar)
  const charts = await generateCharts(transactions);

  // 3️⃣ Generate File (PDF / CSV / JSON)
  let filePath;
  const reportDir = path.resolve("reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

  if (formatType === "pdf") {
    filePath = await generatePDFReport(userId, transactions, charts, startDate, endDate);
  } else if (formatType === "csv") {
    filePath = await generateCSVReport(userId, transactions);
  } else if (formatType === "json") {
    const fileName = `report-${userId}-${Date.now()}.json`;
    filePath = path.join(reportDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2));
  } else {
    throw new ApiError(400, "Invalid report format requested");
  }

  // 4️⃣ Save metadata to DB
  const stats = fs.statSync(filePath);
  const report = await Report.create({
    userId,
    period: `${format(new Date(startDate), "dd MMM yyyy")} → ${format(
      new Date(endDate),
      "dd MMM yyyy"
    )}`,
    format: formatType,
    fileUrl: filePath,
    size: stats.size,
  });

  res.status(201).json({
    message: "✅ Report generated successfully",
    report,
  });
});

/**
 * ======================================================
 *  GET USER REPORT HISTORY
 * ======================================================
 */
export const getReportHistory = asyncHandler(async (req, res) => {
  const reports = await Report.find({ userId: req.user._id }).sort({ createdAt: -1 });
  if (!reports.length) return res.status(200).json({ message: "No reports found" });
  res.status(200).json(reports);
});

/**
 * ======================================================
 *  DOWNLOAD A REPORT
 * ======================================================
 */
export const downloadReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  res.download(report.fileUrl, (err) => {
    if (err) {
      console.error("Download error:", err);
      throw new ApiError(500, "Error downloading the report");
    }
  });
});

/**
 * ======================================================
 *  MONTHLY REPORT GENERATOR (used by cron scheduler)
 * ======================================================
 */
export const generateMonthlyReport = async (user) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);

    const transactions = await Transaction.find({
      userId: user._id,
      date: { $gte: startDate, $lte: endDate },
    });

    if (!transactions.length) {
      console.log(`⚠️ No transactions for ${user.email} this month`);
      return null;
    }

    const charts = await generateCharts(transactions);
    const filePath = await generatePDFReport(user._id, transactions, charts, startDate, endDate);

    const report = await Report.create({
      userId: user._id,
      period: `${format(startDate, "dd MMM yyyy")} → ${format(endDate, "dd MMM yyyy")}`,
      format: "pdf",
      fileUrl: filePath,
    });

    return { report, filePath };
  } catch (err) {
    console.error("❌ Error generating monthly report:", err);
    return null;
  }
};
