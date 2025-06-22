import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import chat from "../models/chat.js";
import User from "../models/user.js";
const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();
  res.status(201).json({ message: "User registered" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  res.cookie("token", token, {
    httpOnly: true,
      sameSite: "None",
      secure:true,
    maxAge: 15 * 60 * 1000,
  });
  res.status(200).json({
    message: "login successful",
    user: { id: user._id, name: user.name, role: user.role },
  });
});

router.get("/verify", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(400).json({ message: "not aunthenticated" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ message: "verified" });
  } catch (e) {
    res.status(401).json({ message: "invalid token" });
  }
});

router.post("/users/history", async (req, res) => {
  const { messages } = req.body;
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const title = messages[0]?.text.trim() || "Untitled";
    const newchart = new chat({
      userId,
      messages,
      title,
    });
    await newchart.save();
    req.id = userId;
    res.status(200).json({ message: "history saved", userId });
  } catch (e) {
    res.status(400).json({ message: "history not found" });
  }
});
router.get("/gethistorytitles", async (req, res) => {
  const { userid } = req.query;

  try {
    const history = await chat.find({ userId: userid });
    res.status(200).json({ history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});
router.get("/getchatbyid", async (req, res) => {
  const { chatid } = req.query;

  try {
    const chatData = await chat.findById(chatid);
    if (!chatData) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({ messages: chatData.messages });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch chat", error: e.message });
  }
});

export default router;
