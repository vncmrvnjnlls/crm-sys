const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: {
      type: String,
      default: "", // Removed required: true so image-only messages pass validation
      trim: true,
    },
    fileUrl: {
      type: String, // Stores Cloudinary, S3, or local upload path (/uploads/filename.jpg)
      default: null,
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
      index: true,
    },
    archivedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
      index: true,
    },
  },
  { timestamps: true }
);

communicationSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
communicationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Communication", communicationSchema);
