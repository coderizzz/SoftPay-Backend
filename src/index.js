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

app.use(
  cors({
    origin: frontendURL,
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
