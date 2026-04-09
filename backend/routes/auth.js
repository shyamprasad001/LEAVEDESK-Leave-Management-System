  const express = require("express");
  const router = express.Router();
  const User = require("../models/User");
  const { sendOTPEmail } = require("../utils/mailer");

  const COLLEGE_DOMAIN = "gmail.com"; // Only this domain is allowed

  const departments = [
    "Computer Science",
    "Electronics",
    "Mechanical",
    "Civil",
    "Electrical",
    "Information Technology",
  ];

  // Helper: generate 6-digit OTP
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // GET Login
  router.get("/login", (req, res) => {
    if (req.session.user) {
      return res.redirect(
        req.session.user.role === "hod" ? "/hod/dashboard" : "/faculty/dashboard",
      );
    }
    res.render("auth/login", { title: "Login - Faculty Leave System" });
  });

  // POST Login
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        req.flash("error_msg", "Please provide email and password");
        return res.redirect("/login");
      }

      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        req.flash("error_msg", "Invalid email or password");
        return res.redirect("/login");
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        req.flash("error_msg", "Invalid email or password");
        return res.redirect("/login");
      }

      req.session.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
      };

      req.flash("success_msg", `Welcome back, ${user.name}!`);
      res.redirect(user.role === "hod" ? "/hod/dashboard" : "/faculty/dashboard");
    } catch (err) {
      console.error(err);
      req.flash("error_msg", "Server error. Please try again.");
      res.redirect("/login");
    }
  });

  // GET Register
  router.get("/register", (req, res) => {
    res.render("auth/register", {
      title: "Register - Faculty Leave System",
      departments,
    });
  });

  // POST Register - Step 1: validate & send OTP
  router.post("/register", async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        confirmPassword,
        role,
        department,
        employeeId,
      } = req.body;

      // ✅ define email domain
      const emailDomain = email.split("@")[1];

      // ✅ check existing user
      const existingUser = await User.findOne({
        $or: [{ email }, { employeeId }],
      });

      if (emailDomain !== COLLEGE_DOMAIN) {
        return res.render("auth/register", {
          title: "Register",
          departments,
          formData: req.body,
          error_msg: [`Only college emails (@${COLLEGE_DOMAIN}) are allowed`],
        });
      }

      if (password !== confirmPassword) {
        return res.render("auth/register", {
          title: "Register",
          departments,
          formData: req.body,
          error_msg: ["Passwords do not match"],
        });
      }

      if (existingUser) {
        return res.render("auth/register", {
          title: "Register",
          departments,
          formData: req.body,
          error_msg: ["Email or Employee ID already registered"],
        });
      }

      const otp = generateOTP();
      const otpExpiry = Date.now() + 10 * 60 * 1000;

      req.session.pendingRegistration = {
        name,
        email,
        password,
        role,
        department,
        employeeId,
        otp,
        otpExpiry,
      };

      await sendOTPEmail(email, otp);

      req.flash(
        "success_msg",
        "OTP sent to " + email + ". Please verify to complete registration.",
      );

      res.redirect("/verify-otp");
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      req.flash("error_msg", "Registration failed. Please try again.");
      res.redirect("/register");
    }
  });

  // GET Verify OTP page
  router.get("/verify-otp", (req, res) => {
    if (!req.session.pendingRegistration) {
      req.flash(
        "error_msg",
        "No pending registration found. Please register first.",
      );
      return res.redirect("/register");
    }
    res.render("auth/verify-otp", {
      title: "Verify Email - LeaveDESK",
      email: req.session.pendingRegistration.email,
    });
  });

  // POST Verify OTP - Step 2: create user
  router.post("/verify-otp", async (req, res) => {
    try {
      const { otp } = req.body;
      const pending = req.session.pendingRegistration;

      if (!pending) {
        req.flash("error_msg", "Session expired. Please register again.");
        return res.redirect("/register");
      }

      if (Date.now() > pending.otpExpiry) {
        delete req.session.pendingRegistration;
        req.flash("error_msg", "OTP has expired. Please register again.");
        return res.redirect("/register");
      }

      if (otp.trim() !== pending.otp) {
        req.flash("error_msg", "Invalid OTP. Please try again.");
        return res.render("auth/verify-otp", {
          title: "Verify Email - LeaveDESK",
          email: pending.email,
        });
      }

      const user = new User({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        role: pending.role,
        department: pending.department,
        employeeId: pending.employeeId,
      });
      await user.save();

      delete req.session.pendingRegistration;
      req.flash(
        "success_msg",
        "Email verified! Registration successful. Please login.",
      );
      res.redirect("/login");
    } catch (err) {
      console.error(err);
      req.flash("error_msg", "Verification failed. Please try again.");
      res.redirect("/verify-otp");
    }
  });

  // POST Resend OTP
  router.post("/resend-otp", async (req, res) => {
    try {
      const pending = req.session.pendingRegistration;
      if (!pending) {
        req.flash("error_msg", "No pending registration. Please register again.");
        return res.redirect("/register");
      }
      const newOtp = generateOTP();
      pending.otp = newOtp;
      pending.otpExpiry = Date.now() + 10 * 60 * 1000;
      req.session.pendingRegistration = pending;
      await sendOTPEmail(pending.email, newOtp);
      req.flash("success_msg", "A new OTP has been sent to your email.");
      res.redirect("/verify-otp");
    } catch (err) {
      console.error(err);
      req.flash("error_msg", "Failed to resend OTP. Try again.");
      res.redirect("/verify-otp");
    }
  });

  // GET Logout
  router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
  });

  module.exports = router;
