import fs from "fs";
import path from "path";
import { Parser } from "json2csv";

export async function generateCSVReport(userId, transactions) {
  const fields = ["date", "description", "category", "amount", "type"];
  const parser = new Parser({ fields });
  const csv = parser.parse(transactions);

  const reportDir = path.resolve("reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

  const filePath = path.join(reportDir, `report-${userId}-${Date.now()}.csv`);
  fs.writeFileSync(filePath, csv);
  return filePath;
}
