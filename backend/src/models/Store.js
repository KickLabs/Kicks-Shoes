import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: [50, "Store name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Store description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    logo: {
      type: String,
      required: [true, "Store logo is required"],
    },
    banner: {
      type: String,
      required: [true, "Store banner is required"],
    },
    address: {
      type: String,
      required: [true, "Store address is required"],
      maxlength: [200, "Address cannot exceed 200 characters"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Store email is required"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
      trim: true,
      lowercase: true,
    },
    social_media: {
      facebook: String,
      instagram: String,
      twitter: String,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for store info
storeSchema.virtual("storeInfo").get(function () {
  return `${this.name} - ${this.address}`;
});

const Store = mongoose.model("Store", storeSchema);

export default Store;
