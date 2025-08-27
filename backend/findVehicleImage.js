//backend\findVehicleImage.js
import mongoose from "mongoose";
import Vehicle from "./models/Vehicle.model.js";

mongoose.connect("mongodb://127.0.0.1:27017/document_system")
  .then(async () => {
    const v = await Vehicle.findOne({ annualImage: { $exists: true, $ne: "" } });
    console.log(v);
    process.exit(0);
  });
