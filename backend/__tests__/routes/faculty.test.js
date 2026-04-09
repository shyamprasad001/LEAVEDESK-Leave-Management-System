const request = require("supertest");
const express = require("express");
const facultyRouter = require("../../routes/faculty");
const LeaveRequest = require("../../models/LeaveRequest");
const User = require("../../models/User");

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
app.use("/faculty", facultyRouter);

describe("Faculty Routes", () => {
  beforeEach(() => {
    mockSession = { user: { _id: "123", role: "faculty", department: "CS" } };
    jest.spyOn(LeaveRequest, "find").mockReset();
    jest.spyOn(LeaveRequest, "countDocuments").mockReset();
    jest.spyOn(LeaveRequest, "findOne").mockReset();
    jest.spyOn(LeaveRequest, "findByIdAndDelete").mockReset();
    jest.spyOn(LeaveRequest.prototype, "save").mockReset();
    jest.spyOn(User, "findById").mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  describe("Auth Middleware", () => {
    it("should redirect to login if no session", async () => {
      mockSession = {};
      const res = await request(app).get("/faculty/dashboard");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });
    it("should redirect HOD away from faculty routes", async () => {
      mockSession = { user: { role: "hod" } };
      const res = await request(app).get("/faculty/dashboard");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/hod/dashboard");
    });
  });

  describe("Dashboard & Apply", () => {
    it("GET /dashboard should load leaves", async () => {
      jest
        .spyOn(LeaveRequest, "find")
        .mockReturnValue({
          sort: jest
            .fn()
            .mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
        });
      jest.spyOn(LeaveRequest, "countDocuments").mockResolvedValue(0);
      const res = await request(app).get("/faculty/dashboard");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /dashboard should catch errors", async () => {
      jest.spyOn(LeaveRequest, "find").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/faculty/dashboard");
      expect(res.status).toBe(302);
    });

    it("GET /apply should render apply form", async () => {
      const res = await request(app).get("/faculty/apply");
      expect(res.text).toBe("Mocked View");
    });

    it("POST /apply should reject end date before start date", async () => {
      const res = await request(app)
        .post("/faculty/apply")
        .send({ startDate: "2023-10-05", endDate: "2023-10-01" });
      expect(res.status).toBe(302);
    });
    it("POST /apply should save leave request", async () => {
      jest.spyOn(LeaveRequest.prototype, "save").mockResolvedValue(true);
      const res = await request(app)
        .post("/faculty/apply")
        .send({ startDate: "2023-10-01", endDate: "2023-10-05" });
      expect(res.status).toBe(302);
    });
    it("POST /apply should catch save errors", async () => {
      jest
        .spyOn(LeaveRequest.prototype, "save")
        .mockRejectedValue(new Error("DB"));
      const res = await request(app)
        .post("/faculty/apply")
        .send({ startDate: "2023-10-01", endDate: "2023-10-05" });
      expect(res.status).toBe(302);
    });
  });

  describe("My Leaves & Detail", () => {
    it("GET /my-leaves should load list with specific filters", async () => {
      jest
        .spyOn(LeaveRequest, "find")
        .mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      const res = await request(app).get(
        "/faculty/my-leaves?status=Pending&leaveType=Casual Leave",
      );
      expect(res.text).toBe("Mocked View");
    });
    it("GET /my-leaves should load list with 'all' filters", async () => {
      jest
        .spyOn(LeaveRequest, "find")
        .mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      const res = await request(app).get(
        "/faculty/my-leaves?status=all&leaveType=all",
      );
      expect(res.text).toBe("Mocked View");
    });
    it("GET /my-leaves should load list with no filters", async () => {
      jest
        .spyOn(LeaveRequest, "find")
        .mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      const res = await request(app).get("/faculty/my-leaves");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /my-leaves should catch error", async () => {
      jest.spyOn(LeaveRequest, "find").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/faculty/my-leaves");
      expect(res.status).toBe(302);
    });

    it("GET /leave/:id should render details", async () => {
      jest
        .spyOn(LeaveRequest, "findOne")
        .mockReturnValue({ populate: jest.fn().mockResolvedValue({}) });
      const res = await request(app).get("/faculty/leave/1");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /leave/:id should redirect if not found", async () => {
      jest
        .spyOn(LeaveRequest, "findOne")
        .mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      const res = await request(app).get("/faculty/leave/1");
      expect(res.status).toBe(302);
    });
    it("GET /leave/:id should catch error", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/faculty/leave/1");
      expect(res.status).toBe(302);
    });

    it("POST /leave/:id/cancel should delete pending leave", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockResolvedValue({ _id: "1" });
      jest.spyOn(LeaveRequest, "findByIdAndDelete").mockResolvedValue(true);
      const res = await request(app).post("/faculty/leave/1/cancel");
      expect(res.status).toBe(302);
    });
    it("POST /leave/:id/cancel should redirect if not pending", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockResolvedValue(null);
      const res = await request(app).post("/faculty/leave/1/cancel");
      expect(res.status).toBe(302);
    });
    it("POST /leave/:id/cancel should catch error", async () => {
      jest.spyOn(LeaveRequest, "findOne").mockRejectedValue(new Error("DB"));
      const res = await request(app).post("/faculty/leave/1/cancel");
      expect(res.status).toBe(302);
    });
  });

  describe("Profile", () => {
    it("GET /profile should load user profile", async () => {
      jest
        .spyOn(User, "findById")
        .mockReturnValue({ select: jest.fn().mockResolvedValue({}) });
      const res = await request(app).get("/faculty/profile");
      expect(res.text).toBe("Mocked View");
    });
    it("GET /profile should catch error", async () => {
      jest.spyOn(User, "findById").mockImplementation(() => {
        throw new Error("DB");
      });
      const res = await request(app).get("/faculty/profile");
      expect(res.status).toBe(302);
    });
  });
});
