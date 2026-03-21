// hod.test.js
const request = require("supertest");
const hodRouter = require("../../routes/hod");
const LeaveRequest = require("../../models/LeaveRequest");
const User = require("../../models/User");
const setupApp = require("./test-setup");

jest.mock("../../models/LeaveRequest");
jest.mock("../../models/User");

const mockHOD = { _id: "h1", role: "hod", department: "CS" };

describe("HOD Routes", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => jest.clearAllMocks());

  describe("Auth Middleware", () => {
    it("redirects to login if not authenticated", async () => {
      const app = setupApp(hodRouter, null);
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(302);
    });

    it("redirects faculty to faculty dashboard", async () => {
      const app = setupApp(hodRouter, { role: "faculty" });
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/dashboard");
    });
  });

  describe("GET /dashboard & /leave-requests", () => {
    const app = setupApp(hodRouter, mockHOD);

    it("renders dashboard with stats", async () => {
      LeaveRequest.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest
            .fn()
            .mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
        }),
      });
      LeaveRequest.countDocuments.mockResolvedValue(0);
      User.countDocuments.mockResolvedValue(0);

      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("hod/dashboard");
    });

    it("renders leave requests with query filters", async () => {
      LeaveRequest.find.mockReturnValue({
        populate: jest
          .fn()
          .mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      });
      const res = await request(app).get(
        "/leave-requests?status=Approved&leaveType=Casual Leave",
      );
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("hod/leave-requests");
    });

    it("GET /dashboard handles database errors", async () => {
      LeaveRequest.find.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });

    it("GET /leave-requests handles database errors", async () => {
      LeaveRequest.find.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const res = await request(app).get("/leave-requests");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/dashboard");
    });
  });

  describe("POST /leave/:id/review", () => {
    const app = setupApp(hodRouter, mockHOD);

    it("redirects if leave not found", async () => {
      LeaveRequest.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post("/leave/123/review")
        .send({ action: "approve" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/leave-requests");
    });

    it("redirects if leave is already reviewed", async () => {
      LeaveRequest.findOne.mockResolvedValue({ status: "Approved" });
      const res = await request(app)
        .post("/leave/123/review")
        .send({ action: "approve" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/leave/123");
    });

    it("approves leave successfully", async () => {
      const mockLeave = {
        status: "Pending",
        save: jest.fn().mockResolvedValue(true),
      };
      LeaveRequest.findOne.mockResolvedValue(mockLeave);

      const res = await request(app)
        .post("/leave/123/review")
        .send({ action: "approve", hodComment: "OK" });

      expect(mockLeave.status).toBe("Approved");
      expect(mockLeave.hodComment).toBe("OK");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/leave-requests");
    });

    it("handles review errors", async () => {
      LeaveRequest.findOne.mockRejectedValue(new Error("DB Error"));
      const res = await request(app)
        .post("/leave/123/review")
        .send({ action: "approve" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/leave-requests");
    });
  });

  describe("GET /faculty", () => {
    const app = setupApp(hodRouter, mockHOD);

    it("renders faculty list with leave stats", async () => {
      const mockFacultyList = [
        { _id: "f1", toObject: () => ({ name: "John" }) },
      ];
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockFacultyList),
        }),
      });
      LeaveRequest.countDocuments.mockResolvedValue(2);

      const res = await request(app).get("/faculty");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("hod/faculty-list");
      expect(res.body.options.facultyList[0].leaveCount).toBe(2);
    });

    it("handles errors in faculty list", async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error("DB Error")),
        }),
      });
      const res = await request(app).get("/faculty");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/dashboard");
    });
  });

  describe("GET /leave/:id & /profile", () => {
    const app = setupApp(hodRouter, mockHOD);

    it("GET /leave/:id renders leave detail", async () => {
      LeaveRequest.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({ _id: "123" }),
        }),
      });
      const res = await request(app).get("/leave/123");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("hod/leave-detail");
    });

    it("GET /leave/:id redirects if not found", async () => {
      LeaveRequest.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });
      const res = await request(app).get("/leave/123");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/leave-requests");
    });

    it("GET /leave/:id handles database errors", async () => {
      LeaveRequest.findOne.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const res = await request(app).get("/leave/123");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/leave-requests");
    });

    it("GET /profile renders profile", async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ name: "HOD User" }),
      });
      const res = await request(app).get("/profile");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("hod/profile");
    });

    it("GET /profile handles database errors", async () => {
      User.findById.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const res = await request(app).get("/profile");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/dashboard");
    });
  });
});
