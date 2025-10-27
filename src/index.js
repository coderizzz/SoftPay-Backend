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
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/predictions", predictionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
