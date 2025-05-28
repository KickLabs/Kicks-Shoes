import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["customer", "shop", "admin"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
      default: "customer",
    },
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,11}$/, "Please enter a valid phone number"],
    },
    reward_point: {
      type: Number,
      default: 0,
      min: [0, "Reward points cannot be negative"],
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Virtual for full user info
userSchema.virtual("fullInfo").get(function () {
  return `${this.username} (${this.email}) - ${this.role}`;
});

const User = mongoose.model("User", userSchema);

export default User;
