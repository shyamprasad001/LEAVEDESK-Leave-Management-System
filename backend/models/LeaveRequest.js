const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    leaveType: {
      type: String,
      enum: [
        "Casual Leave",
        "Medical Leave",
        "Earned Leave",
        "Maternity Leave",
        "Paternity Leave",
        "Emergency Leave",
        "Study Leave",
      ],
      required: [true, "Leave type is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    hodComment: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    attachmentName: String,
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Calculate total days before saving
leaveRequestSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
