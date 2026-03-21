// auth.test.js
const request = require("supertest");
const authRouter = require("../../routes/auth");
const User = require("../../models/User");
const setupApp = require("./test-setup");

jest.mock("../../models/User");

describe("Auth Routes", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /login", () => {
    it("redirects HOD to hod dashboard if logged in", async () => {
      const app = setupApp(authRouter, { role: "hod" });
      const res = await request(app).get("/login");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/dashboard");
    });

    it("redirects faculty to faculty dashboard if logged in", async () => {
      const app = setupApp(authRouter, { role: "faculty" });
      const res = await request(app).get("/login");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/dashboard");
    });

    it("renders login page if not logged in", async () => {
      const app = setupApp(authRouter);
      const res = await request(app).get("/login");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("auth/login");
    });
  });

  describe("POST /login", () => {
    const app = setupApp(authRouter);

    it("redirects with error if missing email or password", async () => {
      const res = await request(app)
        .post("/login")
        .send({ email: "test@test.com" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });

    it("redirects with error if user not found", async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post("/login")
        .send({ email: "a@a.com", password: "123" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });

    it("redirects with error if password does not match", async () => {
      User.findOne.mockResolvedValue({
        comparePassword: jest.fn().mockResolvedValue(false),
      });
      const res = await request(app)
        .post("/login")
        .send({ email: "a@a.com", password: "123" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });

    it("logs in HOD successfully", async () => {
      User.findOne.mockResolvedValue({
        _id: "123",
        name: "John",
        email: "a@a.com",
        role: "hod",
        department: "CS",
        employeeId: "E1",
        comparePassword: jest.fn().mockResolvedValue(true),
      });
      const res = await request(app)
        .post("/login")
        .send({ email: "a@a.com", password: "123" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/hod/dashboard");
    });

    it("handles server errors", async () => {
      User.findOne.mockRejectedValue(new Error("DB Error"));
      const res = await request(app)
        .post("/login")
        .send({ email: "a@a.com", password: "123" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });

    it("logs in Faculty successfully", async () => {
      User.findOne.mockResolvedValue({
        _id: "456",
        name: "Jane",
        email: "faculty@test.com",
        role: "faculty",
        department: "CS",
        employeeId: "E2",
        comparePassword: jest.fn().mockResolvedValue(true),
      });
      const res = await request(app)
        .post("/login")
        .send({ email: "faculty@test.com", password: "123" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/faculty/dashboard");
    });
  });

  describe("GET /register", () => {
    it("renders register page", async () => {
      const app = setupApp(authRouter);
      const res = await request(app).get("/register");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("auth/register");
    });
  });

  describe("POST /register", () => {
    const app = setupApp(authRouter);

    it("renders register with error if user exists", async () => {
      User.findOne.mockResolvedValue({ email: "test@test.com" });
      const res = await request(app)
        .post("/register")
        .send({ email: "test@test.com", employeeId: "123" });
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("auth/register");
    });

    it("registers user successfully", async () => {
      User.findOne.mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue(true);
      const res = await request(app)
        .post("/register")
        .send({ email: "new@test.com" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });

    it("handles server error on register", async () => {
      User.findOne.mockRejectedValue(new Error("DB Error"));
      const res = await request(app)
        .post("/register")
        .send({ email: "new@test.com" });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/register");
    });
  });

  describe("GET /logout", () => {
    it("destroys session and redirects to login", async () => {
      const app = setupApp(authRouter, { name: "John" });
      const res = await request(app).get("/logout");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe("/login");
    });
  });
});
