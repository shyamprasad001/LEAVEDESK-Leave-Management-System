const express = require("express");
const router = express.Router();
const User = require("../models/User");

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
    departments: [
      "Computer Science",
      "Electronics",
      "Mechanical",
      "Civil",
      "Electrical",
      "Information Technology",
    ],
  });
});

// POST Register
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
    const departments = [
      "Computer Science",
      "Electronics",
      "Mechanical",
      "Civil",
      "Electrical",
      "Information Technology",
    ];

    // if (password !== confirmPassword) {
    //   req.flash('error_msg', 'Passwords do not match');
    //   return res.render('auth/register', { title: 'Register', departments, formData: req.body });
    // }

    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }],
    });
    if (existingUser) {
      req.flash("error_msg", "Email or Employee ID already registered");
      return res.render("auth/register", {
        title: "Register",
        departments,
        formData: req.body,
      });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      department,
      employeeId,
    });
    await user.save();

    req.flash("success_msg", "Registration successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Registration failed. Please try again.");
    res.redirect("/register");
  }
});

// GET Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
