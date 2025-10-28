import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const createUser = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body; // 👈 updated

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      name: username,   
      email,
      phone,
      password: hashPassword,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully", data: user });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create user" });
  }
};

const loginUser = async (req, res) => {
  try {
    console.log("hello, this is try block!")
    const { email, password } = req.body;
    console.log(req.body);
    const user = await userModel.findOne({ email })
    console.log(user);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    console.log("before verifying password");
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log(isPasswordCorrect);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1 * 60 * 60 * 1000
    });
    console.log(user);
    res.status(200).json({ user, accessToken });
  } catch (error) {
    res.status(400).json({ error: "Failed to login user" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id); 
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await userModel.findByIdAndUpdate(req.user.id, { name, email }, { new: true });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export { createUser, loginUser, getUserProfile, updateUserProfile };
