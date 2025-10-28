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
  const userId = req.user._id || req.user.id;

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  // 1️⃣ Fetch Transactions
  const transactions = await Transaction.find({
    userId,
    date: { $gte: start, $lte: end },
  });

  console.log("🔍 Filter params:", {
    userId,
    start,
    end,
    count: transactions.length,
  });

  if (!transactions.length) {
    throw new ApiError(404, "No transactions found for this period");
  }

  // 2️⃣ Generate Charts (Pie + Bar)
  const charts = await generateCharts(transactions);

  // 3️⃣ Generate File (PDF / CSV / JSON)
  let filePath;
  const reportDir = path.resolve("reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

  if (formatType === "pdf") {
    filePath = await generatePDFReport(
      userId,
      transactions,
      charts,
      start,
      end
    );
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
    period: `${format(new Date(start), "dd MMM yyyy")} → ${format(
      new Date(end),
      "dd MMM yyyy"
    )}`,
    format: formatType,
    fileUrl: filePath,
    size: stats.size,
  });

  // 5️⃣ Add direct download link for frontend
  const downloadUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/report/download/${report._id}`;

  console.log(`✅ PDF Report generated successfully: ${filePath}`);

  // 6️⃣ Send response
  res.status(201).json({
    success: true,
    message: "✅ Report generated successfully",
    report,
    downloadUrl,
  });
});

/**
 * ======================================================
 *  GET USER REPORT HISTORY
 * ======================================================
 */
export const getReportHistory = asyncHandler(async (req, res) => {
  const reports = await Report.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });
  if (!reports.length)
    return res.status(200).json({ message: "No reports found" });
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

  // ✅ Ensure file exists
  if (!fs.existsSync(report.fileUrl)) {
    console.error("⚠️ File not found on server:", report.fileUrl);
    throw new ApiError(404, "Report file not found on server");
  }

  // ✅ Use safe filename when downloading
  const fileName = path.basename(report.fileUrl);

  res.download(report.fileUrl, fileName, (err) => {
    if (err) {
      console.error("❌ Download error:", err);
      res.status(500).json({ error: "Failed to download report file" });
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
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth() - 1,
      1
    );

    const transactions = await Transaction.find({
      userId: user._id,
      date: { $gte: startDate, $lte: endDate },
    });

    if (!transactions.length) {
      console.log(`⚠️ No transactions for ${user.email} this month`);
      return null;
    }

    const charts = await generateCharts(transactions);
    const filePath = await generatePDFReport(
      user._id,
      transactions,
      charts,
      startDate,
      endDate
    );

    const report = await Report.create({
      userId: user._id,
      period: `${format(startDate, "dd MMM yyyy")} → ${format(
        endDate,
        "dd MMM yyyy"
      )}`,
      format: "pdf",
      fileUrl: filePath,
    });

    return { report, filePath };
  } catch (err) {
    console.error("❌ Error generating monthly report:", err);
    return null;
  }
};
