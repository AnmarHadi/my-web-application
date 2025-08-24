// backend/models/Contractor.model.js
import mongoose from "mongoose";

const contractorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  phone: { type: String, required: true, unique: true, match: /^[0-9]{11}$/ },
  address: { type: String, required: true, trim: true }
}, { timestamps: true });

export default mongoose.model("Contractor", contractorSchema);
