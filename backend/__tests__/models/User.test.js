const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");

jest.mock("bcryptjs");

describe("User Model", () => {
  // Disable Mongoose buffering so it doesn't hang waiting for a DB connection
  beforeAll(() => mongoose.set("bufferCommands", false));
  afterEach(() => jest.clearAllMocks());

  it("should hash the password before saving if modified", async () => {
    bcrypt.hash.mockResolvedValue("hashedPassword");
    const user = new User({ password: "plainPassword" });

    try {
      await user.save({ validateBeforeSave: false });
    } catch (err) {
      // Catch the expected buffer timeout error
    }

    expect(bcrypt.hash).toHaveBeenCalledWith("plainPassword", 12);
    expect(user.password).toBe("hashedPassword");
  });

  it("should not hash the password if not modified", async () => {
    const user = new User({ password: "hashedPassword" });
    jest.spyOn(user, "isModified").mockReturnValue(false);

    try {
      await user.save({ validateBeforeSave: false });
    } catch (err) {}

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("should compare passwords correctly", async () => {
    bcrypt.compare.mockResolvedValue(true);
    const user = new User({ password: "hashedPassword" });

    const isMatch = await user.comparePassword("plainPassword");
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "plainPassword",
      "hashedPassword",
    );
    expect(isMatch).toBe(true);
  });
});
