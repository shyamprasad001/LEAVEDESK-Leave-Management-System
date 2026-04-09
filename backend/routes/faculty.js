const express = require("express");
const router = express.Router();
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please login to continue");
    return res.redirect("/login");
  }
  if (req.session.user.role !== "faculty") {
    return res.redirect("/hod/dashboard");
  }
  next();
};

// Dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const leaves = await LeaveRequest.find({ faculty: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    const stats = {
      total: await LeaveRequest.countDocuments({ faculty: userId }),
      pending: await LeaveRequest.countDocuments({
        faculty: userId,
        status: "Pending",
      }),
      approved: await LeaveRequest.countDocuments({
        faculty: userId,
        status: "Approved",
      }),
      rejected: await LeaveRequest.countDocuments({
        faculty: userId,
        status: "Rejected",
      }),
    };
    res.render("faculty/dashboard", {
      title: "Faculty Dashboard",
      leaves,
      stats,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading dashboard");
    res.redirect("/login");
  }
});

// Apply Leave - GET
router.get("/apply", isAuthenticated, (req, res) => {
  res.render("faculty/apply", {
    title: "Apply for Leave",
    leaveTypes: [
      "Casual Leave",
      "Medical Leave",
      "Earned Leave",
      "Maternity Leave",
      "Paternity Leave",
      "Emergency Leave",
      "Study Leave",
    ],
  });
});

// Apply Leave - POST
router.post("/apply", isAuthenticated, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, isUrgent } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      req.flash("error_msg", "End date cannot be before start date");
      return res.redirect("/faculty/apply");
    }

    const leave = new LeaveRequest({
      faculty: req.session.user._id,
      department: req.session.user.department,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      isUrgent: isUrgent === "on",
    });

    await leave.save();
    req.flash("success_msg", "Leave application submitted successfully!");
    res.redirect("/faculty/my-leaves");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to submit leave application");
    res.redirect("/faculty/apply");
  }
});

// My Leaves
router.get("/my-leaves", isAuthenticated, async (req, res) => {
  try {
    const { status, leaveType } = req.query;
    let filter = { faculty: req.session.user._id };
    if (status && status !== "all") filter.status = status;
    if (leaveType && leaveType !== "all") filter.leaveType = leaveType;

    const leaves = await LeaveRequest.find(filter).sort({ createdAt: -1 });
    res.render("faculty/my-leaves", {
      title: "My Leave Applications",
      leaves,
      currentStatus: status || "all",
      currentType: leaveType || "all",
      leaveTypes: [
        "Casual Leave",
        "Medical Leave",
        "Earned Leave",
        "Maternity Leave",
        "Paternity Leave",
        "Emergency Leave",
        "Study Leave",
      ],
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading leave applications");
    res.redirect("/faculty/dashboard");
  }
});

// View Leave Detail
router.get("/leave/:id", isAuthenticated, async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({
      _id: req.params.id,
      faculty: req.session.user._id,
    }).populate("reviewedBy", "name designation");
    if (!leave) {
      req.flash("error_msg", "Leave application not found");
      return res.redirect("/faculty/my-leaves");
    }
    res.render("faculty/leave-detail", { title: "Leave Details", leave });
  } catch (err) {
    req.flash("error_msg", "Error loading leave details");
    res.redirect("/faculty/my-leaves");
  }
});

// Cancel Leave (only pending)
router.post("/leave/:id/cancel", isAuthenticated, async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({
      _id: req.params.id,
      faculty: req.session.user._id,
      status: "Pending",
    });
    if (!leave) {
      req.flash("error_msg", "Cannot cancel this leave application");
      return res.redirect("/faculty/my-leaves");
    }
    await LeaveRequest.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Leave application cancelled successfully");
    res.redirect("/faculty/my-leaves");
  } catch (err) {
    req.flash("error_msg", "Error cancelling leave");
    res.redirect("/faculty/my-leaves");
  }
});

// Profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select("-password");
    res.render("faculty/profile", { title: "My Profile", profileUser: user });
  } catch (err) {
    req.flash("error_msg", "Error loading profile");
    res.redirect("/faculty/dashboard");
  }
});

module.exports = router;
