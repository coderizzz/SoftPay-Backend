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
    console.log("hello, this is try block!");
    const { email, password } = req.body;
    console.log(req.body);
    const user = await userModel.findOne({ email });
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
    // ✅ Include more fields in JWT payload
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Set cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
    });

    // ✅ Return clean response
    res.status(200).json({
      message: "Login successful",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        accessToken,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(400).json({ error: "Failed to login user" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { id, username, email, phone } = req.user;
    if (!id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // ✅ Directly return user info from JWT payload
    res.status(200).json({
      success: true,
      data: {
        id,
        username,
        email,
        phone,
      },
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export { createUser, loginUser, getUserProfile, updateUserProfile };