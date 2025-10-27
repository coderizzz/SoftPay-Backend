import express from "express";
import { getUserProfile, updateUserProfile, loginUser, createUser } from "../controllers/userController.js";
import  isLoggedIn  from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", createUser);

router.post("/login", loginUser);

router.get("/profile",isLoggedIn, getUserProfile);

router.put("/profile", updateUserProfile);

export default router;
