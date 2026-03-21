// faculty.test.js
const request = require("supertest");
const facultyRouter = require("../../routes/faculty");
const LeaveRequest = require("../../models/LeaveRequest");
const User = require("../../models/User");
const setupApp = require("./test-setup");

jest.mock("../../models/LeaveRequest");
jest.mock("../../models/User");

const mockFaculty = { _id: "f1", role: "faculty", department: "CS" };

describe("Faculty Routes", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => jest.clearAllMocks());

  describe("Auth Middleware", () => {
    it("redirects to login if not authenticated", async () => {
      const app = setupApp(facultyRouter, null);
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });

    it("redirects HOD to HOD dashboard", async () => {
      const app = setupApp(facultyRouter, { role: "hod" });
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/dashboard");
    });
  });

  describe("GET /dashboard", () => {
    it("renders dashboard with stats", async () => {
      LeaveRequest.find.mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
      });
      LeaveRequest.countDocuments.mockResolvedValue(1);

      const app = setupApp(facultyRouter, mockFaculty);
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("faculty/dashboard");
    });

    it("handles errors", async () => {
      LeaveRequest.find.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const app = setupApp(facultyRouter, mockFaculty);
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });
  });

  describe("POST /apply", () => {
    const app = setupApp(facultyRouter, mockFaculty);

    it("redirects with error if end date is before start date", async () => {
      const res = await request(app)
        .post("/apply")
        .send({ startDate: "2026-03-22", endDate: "2026-03-21" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/apply");
    });

    it("saves leave successfully", async () => {
      LeaveRequest.prototype.save = jest.fn().mockResolvedValue(true);
      const res = await request(app)
        .post("/apply")
        .send({ startDate: "2026-03-21", endDate: "2026-03-22" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/my-leaves");
    });

    it("handles save errors", async () => {
      LeaveRequest.prototype.save = jest
        .fn()
        .mockRejectedValue(new Error("Save Failed"));
      const res = await request(app)
        .post("/apply")
        .send({ startDate: "2026-03-21", endDate: "2026-03-22" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/apply");
    });
  });

  describe("GET /my-leaves & /leave/:id & /profile", () => {
    const app = setupApp(facultyRouter, mockFaculty);

    it("GET /my-leaves applies filters and renders", async () => {
      LeaveRequest.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });
      const res = await request(app).get(
        "/my-leaves?status=Pending&leaveType=Medical Leave",
      );
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("faculty/my-leaves");
    });

    it("GET /leave/:id redirects if not found", async () => {
      LeaveRequest.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      const res = await request(app).get("/leave/123");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/my-leaves");
    });

    it("POST /leave/:id/cancel cancels leave", async () => {
      LeaveRequest.findOne.mockResolvedValue({ _id: "123" });
      LeaveRequest.findByIdAndDelete.mockResolvedValue(true);
      const res = await request(app).post("/leave/123/cancel");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/my-leaves");
    });

    it("GET /profile renders profile", async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ name: "John" }),
      });
      const res = await request(app).get("/profile");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("faculty/profile");
    });

    it("GET /my-leaves handles database errors", async () => {
      LeaveRequest.find.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const res = await request(app).get("/my-leaves");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/dashboard");
    });

    it("GET /leave/:id handles database errors", async () => {
      LeaveRequest.findOne.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const res = await request(app).get("/leave/123");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/my-leaves");
    });

    it("POST /leave/:id/cancel handles database errors", async () => {
      LeaveRequest.findOne.mockRejectedValue(new Error("DB Error"));
      const res = await request(app).post("/leave/123/cancel");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/my-leaves");
    });

    it("GET /profile handles database errors", async () => {
      User.findById.mockImplementation(() => {
        throw new Error("DB Error");
      });
      const res = await request(app).get("/profile");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/dashboard");
    });
  });
});
