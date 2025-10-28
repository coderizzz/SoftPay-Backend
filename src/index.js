import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from "./routes/userRoute.js";
import reportRoutes from "./routes/reportRoutes.js";
import predictionRoutes from "./routes/predictionRoute.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();

const app = express();
const frontendURL = process.env.FRONTEND_URL;

import cors from "cors";

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://soft-pay-frontend.vercel.app",
        "http://localhost:5173",
      ];

      // Allow all Vercel preview URLs (e.g., soft-pay-frontend-*.vercel.app)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/budget", predictionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
