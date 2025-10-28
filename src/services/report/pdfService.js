import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function generatePDFReport(
  userId,
  transactions,
  charts,
  startDate,
  endDate
) {
  try {
    // ✅ Dynamically import CommonJS fontkit safely in ESM
    const fontkitModule = await import("fontkit");
    const fontkit = fontkitModule.default || fontkitModule;

    // ✅ Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit); // must register before embedding

    const page = pdfDoc.addPage([600, 800]);
    const { height } = page.getSize();

    // ✅ Ensure font path exists, else create fallback
    const fontPath = path.resolve("src/assets/fonts/Roboto-Regular.ttf");
    if (!fs.existsSync(fontPath)) {
      console.warn("⚠️ Font file not found at:", fontPath);
      // fallback to system-safe font
      fs.mkdirSync(path.dirname(fontPath), { recursive: true });
      throw new Error("Font file missing. Please place Roboto-Regular.ttf under src/assets/fonts/");
    }

    // ✅ Embed Unicode-safe font (supports ₹ and others)
    const fontBytes = fs.readFileSync(fontPath);
    const font = await pdfDoc.embedFont(fontBytes);

    // ---------------- HEADER ----------------
    page.drawText("Finance Visualizer – Transaction Report", {
      x: 50,
      y: height - 50,
      font,
      size: 18,
      color: rgb(0.1, 0.1, 0.6),
    });

    page.drawText(`From: ${startDate}   To: ${endDate}`, {
      x: 50,
      y: height - 75,
      font,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // ---------------- TABLE HEADER ----------------
    const headerY = height - 110;
    const headerFontSize = 12;

    page.drawText("Date", { x: 50, y: headerY, font, size: headerFontSize });
    page.drawText("Description", {
      x: 140,
      y: headerY,
      font,
      size: headerFontSize,
    });
    page.drawText("Category", { x: 320, y: headerY, font, size: headerFontSize });
    page.drawText("Amount (₹)", {
      x: 450,
      y: headerY,
      font,
      size: headerFontSize,
    });

    // ---------------- ROWS ----------------
    let currentY = headerY - 20;
    for (const txn of transactions.slice(0, 25)) {
      page.drawText(new Date(txn.date).toISOString().split("T")[0], {
        x: 50,
        y: currentY,
        font,
        size: 10,
      });

      page.drawText(txn.description || "-", {
        x: 140,
        y: currentY,
        font,
        size: 10,
      });

      page.drawText(txn.category || "-", {
        x: 320,
        y: currentY,
        font,
        size: 10,
      });

      // ✅ Unicode ₹ now renders properly
      const amountText = `₹${txn.amount}`;
      page.drawText(amountText, {
        x: 450,
        y: currentY,
        font,
        size: 10,
      });

      currentY -= 16;
    }

    // ---------------- SUMMARY ----------------
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + b.amount, 0);

    const net = income - expense;

    page.drawText(`Total Income: ₹${income}`, {
      x: 50,
      y: currentY - 40,
      font,
      size: 12,
    });

    page.drawText(`Total Expense: ₹${expense}`, {
      x: 50,
      y: currentY - 60,
      font,
      size: 12,
    });

    page.drawText(`Net Balance: ₹${net}`, {
      x: 50,
      y: currentY - 80,
      font,
      size: 12,
    });

    // ---------------- CHART IMAGES ----------------
    if (charts?.pieBuffer) {
      try {
        const pieImg = await pdfDoc.embedPng(charts.pieBuffer);
        page.drawImage(pieImg, { x: 50, y: 100, width: 200, height: 200 });
      } catch (e) {
        console.warn("⚠️ Pie chart embedding skipped:", e.message);
      }
    }

    if (charts?.barBuffer) {
      try {
        const barImg = await pdfDoc.embedPng(charts.barBuffer);
        page.drawImage(barImg, { x: 330, y: 100, width: 200, height: 200 });
      } catch (e) {
        console.warn("⚠️ Bar chart embedding skipped:", e.message);
      }
    }

    // ---------------- SAVE FILE ----------------
    const reportDir = path.resolve("reports");
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    const filePath = path.join(reportDir, `report-${userId}-${Date.now()}.pdf`);
    fs.writeFileSync(filePath, await pdfDoc.save());

    console.log(`✅ PDF Report generated successfully: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("❌ PDF generation failed:", error);
    throw error;
  }
}
