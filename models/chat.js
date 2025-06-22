// models/Chat.js
import mongoose from "mongoose";
const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  messages: [
    {
      send: String, // "user" | "chatbot"
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  title: {
    type: String,
  },
});
export default mongoose.model("chat", chatSchema);
