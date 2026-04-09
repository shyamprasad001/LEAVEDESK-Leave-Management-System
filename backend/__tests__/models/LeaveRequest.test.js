const mongoose = require("mongoose");
const LeaveRequest = require("../../models/LeaveRequest");

describe("LeaveRequest Model", () => {
  beforeAll(() => mongoose.set("bufferCommands", false));

  it("should calculate totalDays correctly before saving", async () => {
    const start = new Date("2023-10-01");
    const end = new Date("2023-10-05"); // 4 days difference + 1 = 5 days total

    const leave = new LeaveRequest({
      startDate: start,
      endDate: end,
    });

    try {
      await leave.save({ validateBeforeSave: false });
    } catch (err) {}

    expect(leave.totalDays).toBe(5);
  });

  it("should skip totalDays calculation if dates are missing", async () => {
    const leave = new LeaveRequest({});
    try {
      await leave.save({ validateBeforeSave: false });
    } catch (err) {}
    expect(leave.totalDays).toBeUndefined();
  });
});
