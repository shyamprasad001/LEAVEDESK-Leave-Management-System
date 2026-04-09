const request = require("supertest");
const express = require("express");
const hodRouter = require("../../routes/hod");
const LeaveRequest = require("../../models/LeaveRequest");
const User = require("../../models/User");
const mailer = require("../../utils/mailer");

jest.mock("../../utils/mailer");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let mockSession = {};
app.use((req, res, next) => {
  req.session = mockSession;
  req.flash = jest.fn();
  res.render = jest.fn((view, data) => res.send("Mocked View"));
  next();
});
app.use("/hod", hodRouter);

describe("HOD Routes", () => {
  beforeEach(() => {
    mockSession = {
      user: { _id: "456", role: "hod", department: "CS", name: "HOD Name" },
    };
    jest.spyOn(LeaveRequest, "find").mockReset();
    jest.spyOn(LeaveRequest, "countDocuments").mockReset();
    jest.spyOn(LeaveRequest, "findOne").mockReset();
    jest.spyOn(LeaveRequest.prototype, "save").mockReset();
    jest.spyOn(User, "find").mockReset();
    jest.spyOn(User, "countDocuments").mockReset();
    jest.spyOn(User, "findById").mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  describe("Auth Middleware", () => {
    it("should redirect to login if no session", async () => {
      mockSession = {};
      const res = await request(app).get("/hod/dashboard");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });
    it("should redirect faculty away from HOD routes", async () => {
      mockSession = { user: { role: "faculty" } };
      const res = await request(app).get("/hod/dashboard");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/faculty/dashboard");
    });
  });

  describe("Dashboard & Leave Requests", () => {
    it("GET /dashboard should load HOD dashboard", async () => {
      jest.spyOn(LeaveRequest, "find").mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest
            .fn()
            .mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
        }),
      });
      jest.spyOn(LeaveRequest, "countDocuments").mockResolvedValue(0);
      jest.spyOn(User, "countDocuments").mockResolvedValue(0);
      const res = await request(app).get("/hod/dashboard");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /dashboard should catch error", async () => {
      jest.spyOn(LeaveRequest, "find").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/hod/dashboard");
      expect(res.status).toBe(302);
    });

    it("GET /leave-requests should load with filters", async () => {
      jest.spyOn(LeaveRequest, "find").mockReturnValue({
        populate: jest
          .fn()
          .mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      });
      const res = await request(app).get(
        "/hod/leave-requests?status=Pending&leaveType=Casual Leave",
      );
      expect(res.text).toBe("Mocked View");
    });
    it("GET /leave-requests should catch error", async () => {
      jest.spyOn(LeaveRequest, "find").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/hod/leave-requests");
      expect(res.status).toBe(302);
    });
  });

  describe("Review Actions", () => {
    it("GET /leave/:id should render details", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockReturnValue({
        populate: jest
          .fn()
          .mockReturnValue({ populate: jest.fn().mockResolvedValue({}) }),
      });
      const res = await request(app).get("/hod/leave/1");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /leave/:id should redirect if not found", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockReturnValue({
        populate: jest
          .fn()
          .mockReturnValue({ populate: jest.fn().mockResolvedValue(null) }),
      });
      const res = await request(app).get("/hod/leave/1");
      expect(res.status).toBe(302);
    });
    it("GET /leave/:id should catch error", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/hod/leave/1");
      expect(res.status).toBe(302);
    });

    it("POST /leave/:id/review should approve and send email", async () => {
      const mockLeave = {
        status: "Pending",
        faculty: { email: "f@gmail.com", name: "Fac" },
        save: jest.fn().mockResolvedValue(true),
      };
      jest
        .spyOn(LeaveRequest, "findOne")
        .mockReturnValue({ populate: jest.fn().mockResolvedValue(mockLeave) });
      mailer.sendLeaveStatusEmail.mockResolvedValue(true);

      const res = await request(app)
        .post("/hod/leave/1/review")
        .send({ action: "approve" });
      expect(mockLeave.status).toBe("Approved");
      expect(res.status).toBe(302);
    });
    it("POST /leave/:id/review should reject if leave not found", async () => {
      jest
        .spyOn(LeaveRequest, "findOne")
        .mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      const res = await request(app)
        .post("/hod/leave/1/review")
        .send({ action: "approve" });
      expect(res.status).toBe(302);
    });
    it("POST /leave/:id/review should reject if already reviewed", async () => {
      const mockLeave = { status: "Approved" };
      jest
        .spyOn(LeaveRequest, "findOne")
        .mockReturnValue({ populate: jest.fn().mockResolvedValue(mockLeave) });
      const res = await request(app)
        .post("/hod/leave/1/review")
        .send({ action: "approve" });
      expect(res.status).toBe(302);
    });

    // FIX: Using an internal rejected promise for populate() completely stops Jest from crashing
    it("POST /leave/:id/review should catch errors gracefully", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("DB")),
      });
      const res = await request(app)
        .post("/hod/leave/1/review")
        .send({ action: "approve" });
      expect(res.status).toBe(302);
    });

    it("POST /leave/:id/review should handle email failure gracefully during review", async () => {
      const mockLeave = {
        status: "Pending",
        faculty: { email: "f@gmail.com" },
        save: jest.fn().mockResolvedValue(true),
      };
      jest
        .spyOn(LeaveRequest, "findOne")
        .mockReturnValue({ populate: jest.fn().mockResolvedValue(mockLeave) });
      mailer.sendLeaveStatusEmail.mockImplementation(() =>
        Promise.reject(new Error("SMTP down")),
      );

      const res = await request(app)
        .post("/hod/leave/1/review")
        .send({ action: "reject" });
      expect(mockLeave.status).toBe("Rejected");
      expect(res.status).toBe(302);
    });
  });

  describe("Faculty List & Profile", () => {
    it("GET /faculty should load faculty list", async () => {
      const mockFaculty = { toObject: () => ({ _id: "1", name: "A" }) };
      jest.spyOn(User, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockFaculty]),
        }),
      });
      jest.spyOn(LeaveRequest, "countDocuments").mockResolvedValue(0);
      const res = await request(app).get("/hod/faculty");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /faculty should catch error", async () => {
      jest.spyOn(User, "find").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/hod/faculty");
      expect(res.status).toBe(302);
    });

    it("GET /profile should load profile", async () => {
      jest
        .spyOn(User, "findById")
        .mockReturnValue({ select: jest.fn().mockResolvedValue({}) });
      const res = await request(app).get("/hod/profile");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /profile should catch error", async () => {
      jest.spyOn(User, "findById").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/hod/profile");
      expect(res.status).toBe(302);
    });
  });
});
