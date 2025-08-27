// backend/models/User.model.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["admin", "editor", "viewer"], default: "viewer" },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// فهرس فريد لاسم المستخدم
UserSchema.index({ username: 1 }, { unique: true });

// إرجاع نموذج مناسب للفرونت
UserSchema.methods.toClient = function () {
  const o = this.toObject();
  o.id = String(o._id);
  delete o._id;
  delete o.__v;
  delete o.passwordHash;
  return o;
};

const User = mongoose.model("User", UserSchema);
export default User;
