import cron from "node-cron";
import User from "../models/userModel.js";
import { generateMonthlyReport } from "../controllers/reportController.js";
import { sendEmailWithAttachment } from "./emailService.js";

export const initMonthlyReportScheduler = () => {
  cron.schedule("0 9 1 * *", async () => {
    console.log("🕘 Running Monthly Report Scheduler...");

    try {
      const users = await User.find();
      for (const user of users) {
        const result = await generateMonthlyReport(user);
        if (!result) {
          console.log(`No transactions for ${user.email}`);
          continue;
        }

        const { filePath } = result;
        await sendEmailWithAttachment({
          to: user.email,
          subject: "Your Monthly Finance Report 📊",
          html: `
            <h2>Hi ${user.name || "there"},</h2>
            <p>Your monthly finance report is ready!</p>
            <p>We’ve attached the detailed PDF for your records.</p>
            <p style="color:#555;">— Finance Visualizer Team</p>
          `,
          attachmentPath: filePath,
        });
      }
      console.log("All monthly reports processed.");
    } catch (err) {
      console.error(" Scheduler error:", err);
    }
  });
};
