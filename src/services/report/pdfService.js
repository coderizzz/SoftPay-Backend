import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "fontkit"; // ✅ correct one

export async function generatePDFReport(
  userId,
  transactions,
  charts,
  startDate,
  endDate
) {
  // ✅ Create new PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit); // ✅ register fontkit

  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();

  // ✅ Load and embed custom Unicode font (Roboto / Noto Sans)
  const fontBytes = fs.readFileSync("src/assets/fonts/Roboto-Regular.ttf");
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

    // ✅ Now ₹ symbol will render properly
    page.drawText(`₹${txn.amount}`, {
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
    const pieImg = await pdfDoc.embedPng(charts.pieBuffer);
    page.drawImage(pieImg, { x: 50, y: 100, width: 200, height: 200 });
  }

  if (charts?.barBuffer) {
    const barImg = await pdfDoc.embedPng(charts.barBuffer);
    page.drawImage(barImg, { x: 330, y: 100, width: 200, height: 200 });
  }

  // ---------------- SAVE FILE ----------------
  const reportDir = path.resolve("reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

  const filePath = path.join(reportDir, `report-${userId}-${Date.now()}.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, pdfBytes);

  return filePath;
}
