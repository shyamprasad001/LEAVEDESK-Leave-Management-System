const nodemailer = require("nodemailer");
const { sendOTPEmail, sendLeaveStatusEmail } = require("../../utils/mailer");

// Mock the transport creation directly
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

describe("Mailer Utils", () => {
  let transporterMock;

  beforeEach(() => {
    transporterMock = nodemailer.createTransport();
    process.env.EMAIL_USER = "test@test.com";
  });

  afterEach(() => jest.clearAllMocks());

  it("should send OTP email", async () => {
    await sendOTPEmail("student@gmail.com", "123456");
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1);
    expect(transporterMock.sendMail.mock.calls[0][0].to).toBe(
      "student@gmail.com",
    );
    expect(transporterMock.sendMail.mock.calls[0][0].html).toContain("123456");
  });

  it("should send approved leave status email", async () => {
    await sendLeaveStatusEmail({
      toEmail: "faculty@gmail.com",
      facultyName: "John",
      leaveType: "Casual Leave",
      startDate: "Oct 10, 2023",
      endDate: "Oct 12, 2023",
      status: "Approved",
      hodComment: "Enjoy",
      hodName: "Dr. Smith",
    });
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1);
    expect(transporterMock.sendMail.mock.calls[0][0].html).toContain("✅");
    expect(transporterMock.sendMail.mock.calls[0][0].html).toContain("Enjoy");
  });

  it("should send rejected leave status email without comment", async () => {
    await sendLeaveStatusEmail({
      toEmail: "faculty@gmail.com",
      status: "Rejected",
    });
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1);
    expect(transporterMock.sendMail.mock.calls[0][0].html).toContain("❌");
  });
});
