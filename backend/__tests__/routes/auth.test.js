const request = require("supertest");
const express = require("express");
const authRouter = require("../../routes/auth");
const User = require("../../models/User");
const mailer = require("../../utils/mailer");

jest.mock("../../utils/mailer");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let mockSession = {};
app.use((req, res, next) => {
  req.session = mockSession;
  if (!req.session.destroy) req.session.destroy = jest.fn((cb) => cb && cb());
  req.flash = jest.fn();
  res.render = jest.fn((view, data) => res.send("Mocked View"));
  next();
});
app.use("/", authRouter);

describe("Auth Routes", () => {
  beforeEach(() => {
    mockSession = {};
    jest.spyOn(User, "findOne").mockReset();
    jest.spyOn(User.prototype, "save").mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  describe("GET /login", () => {
    it("should render login if no session", async () => {
      const res = await request(app).get("/login");
      expect(res.text).toBe("Mocked View");
    });
    it("should redirect HOD to dashboard", async () => {
      mockSession = { user: { role: "hod" } };
      const res = await request(app).get("/login");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/hod/dashboard");
    });
    it("should redirect faculty to dashboard", async () => {
      mockSession = { user: { role: "faculty" } };
      const res = await request(app).get("/login");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/faculty/dashboard");
    });
  });

  describe("POST /login", () => {
    it("should fail without email or password", async () => {
      const res = await request(app).post("/login").send({});
      expect(res.status).toBe(302);
    });
    it("should fail on invalid user", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      const res = await request(app)
        .post("/login")
        .send({ email: "a@gmail.com", password: "123" });
      expect(res.status).toBe(302);
    });
    it("should fail on invalid password", async () => {
      jest
        .spyOn(User, "findOne")
        .mockResolvedValue({
          comparePassword: jest.fn().mockResolvedValue(false),
        });
      const res = await request(app)
        .post("/login")
        .send({ email: "a@gmail.com", password: "123" });
      expect(res.status).toBe(302);
    });
    it("should login faculty successfully", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue({
        _id: "1",
        role: "faculty",
        comparePassword: jest.fn().mockResolvedValue(true),
      });
      const res = await request(app)
        .post("/login")
        .send({ email: "a@gmail.com", password: "123" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/faculty/dashboard");
    });
    it("should login HOD successfully", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue({
        _id: "2",
        role: "hod",
        comparePassword: jest.fn().mockResolvedValue(true),
      });
      const res = await request(app)
        .post("/login")
        .send({ email: "hod@gmail.com", password: "123" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/hod/dashboard");
    });
    it("should handle server errors", async () => {
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("DB Error"));
      const res = await request(app)
        .post("/login")
        .send({ email: "a@gmail.com", password: "123" });
      expect(res.status).toBe(302);
    });
  });

  describe("GET /register", () => {
    it("should render register page", async () => {
      const res = await request(app).get("/register");
      expect(res.text).toBe("Mocked View");
    });
  });

  describe("POST /register", () => {
    it("should reject non-college domain", async () => {
      const res = await request(app)
        .post("/register")
        .send({ email: "test@yahoo.com" });
      expect(res.text).toBe("Mocked View");
    });
    it("should reject password mismatch", async () => {
      const res = await request(app)
        .post("/register")
        .send({ email: "test@gmail.com", password: "1", confirmPassword: "2" });
      expect(res.text).toBe("Mocked View");
    });
    it("should reject existing user", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(true);
      const res = await request(app)
        .post("/register")
        .send({ email: "test@gmail.com", password: "1", confirmPassword: "1" });
      expect(res.text).toBe("Mocked View");
    });
    it("should initiate registration and send OTP", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      mailer.sendOTPEmail.mockResolvedValue(true);
      const res = await request(app)
        .post("/register")
        .send({ email: "test@gmail.com", password: "1", confirmPassword: "1" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/verify-otp");
    });
    it("should handle server errors", async () => {
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("Error"));
      const res = await request(app)
        .post("/register")
        .send({ email: "test@gmail.com", password: "1", confirmPassword: "1" });
      expect(res.status).toBe(302);
    });
  });

  describe("GET /verify-otp", () => {
    it("should redirect if no pending registration", async () => {
      const res = await request(app).get("/verify-otp");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/register");
    });
    it("should render verify page if pending", async () => {
      mockSession = { pendingRegistration: { email: "test@gmail.com" } };
      const res = await request(app).get("/verify-otp");
      expect(res.text).toBe("Mocked View");
    });
  });

  describe("POST /verify-otp", () => {
    it("should fail if no pending session", async () => {
      const res = await request(app)
        .post("/verify-otp")
        .send({ otp: "123456" });
      expect(res.status).toBe(302);
    });
    it("should fail if OTP has expired", async () => {
      mockSession = { pendingRegistration: { otpExpiry: Date.now() - 10000 } };
      const res = await request(app)
        .post("/verify-otp")
        .send({ otp: "123456" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/register");
    });
    it("should fail if OTP is incorrect", async () => {
      mockSession = {
        pendingRegistration: { otpExpiry: Date.now() + 10000, otp: "111111" },
      };
      const res = await request(app)
        .post("/verify-otp")
        .send({ otp: "222222" });
      expect(res.text).toBe("Mocked View");
    });
    it("should create user and redirect on success", async () => {
      mockSession = {
        pendingRegistration: { otpExpiry: Date.now() + 10000, otp: "123456" },
      };
      jest.spyOn(User.prototype, "save").mockResolvedValue(true);
      const res = await request(app)
        .post("/verify-otp")
        .send({ otp: "123456" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });
    it("should catch errors during verify", async () => {
      mockSession = {
        pendingRegistration: { otpExpiry: Date.now() + 10000, otp: "123456" },
      };
      jest
        .spyOn(User.prototype, "save")
        .mockRejectedValue(new Error("DB error"));
      const res = await request(app)
        .post("/verify-otp")
        .send({ otp: "123456" });
      expect(res.status).toBe(302);
    });
  });

  describe("POST /resend-otp", () => {
    it("should fail if no pending registration", async () => {
      const res = await request(app).post("/resend-otp");
      expect(res.status).toBe(302);
    });
    it("should resend OTP successfully", async () => {
      mockSession = { pendingRegistration: { email: "test@gmail.com" } };
      mailer.sendOTPEmail.mockResolvedValue(true);
      const res = await request(app).post("/resend-otp");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/verify-otp");
    });
    it("should catch error on resend", async () => {
      mockSession = { pendingRegistration: { email: "test@gmail.com" } };
      mailer.sendOTPEmail.mockRejectedValue(new Error("SMTP"));
      const res = await request(app).post("/resend-otp");
      expect(res.status).toBe(302);
    });
  });

  describe("GET /logout", () => {
    it("should destroy session and redirect", async () => {
      const res = await request(app).get("/logout");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });
  });
});
