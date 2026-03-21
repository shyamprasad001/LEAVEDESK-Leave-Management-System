const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
require("dotenv").config();
const app = express();

// MongoDB Connection

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// View Engine — points to frontend/views
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Serve static files from frontend/public
app.use(express.static(path.join(__dirname, "public")));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "faculty_leave_secret_2024",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  }),
);

// Flash messages
app.use(flash());

// Global variables for views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use("/", require("./routes/auth"));
app.use("/faculty", require("./routes/faculty"));
app.use("/hod", require("./routes/hod"));

// Home redirect
app.get("/", (req, res) => res.redirect("/login"));

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);

module.exports = app;
