// backend/models/NajafTransferPrice.model.js
import mongoose from "mongoose";
const schema = new mongoose.Schema({
  minLoad: { type: Number, required: true },
  maxLoad: { type: Number, required: true },
  price: { type: Number, required: true },
  advance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("NajafTransferPrice", schema);
