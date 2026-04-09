const nodemailer = require("nodemailer");

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // ✅ Enforces SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP to user's college email for registration verification
 * @param {string} toEmail  - recipient college email
 * @param {string} otp      - 6-digit OTP
 */
async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: `"LeaveDESK – Aditya College" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Registration OTP – LeaveDESK",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden">
        <div style="background:#1a3c5e;padding:20px;text-align:center">
          <h2 style="color:#fff;margin:0">LEAVEDESK</h2>
          <p style="color:#aac4e0;margin:4px 0 0">Aditya College of Engineering</p>
        </div>
        <div style="padding:30px">
          <p style="font-size:15px;color:#333">Hello,</p>
          <p style="font-size:15px;color:#333">
            Use the OTP below to verify your college email and complete registration.
            This OTP is valid for <strong>10 minutes</strong>.
          </p>
          <div style="text-align:center;margin:30px 0">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a3c5e;background:#eef4fb;padding:14px 28px;border-radius:8px;display:inline-block">
              ${otp}
            </span>
          </div>
          <p style="font-size:13px;color:#888">
            If you did not request this, please ignore this email.
          </p>
        </div>
        <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} Aditya College of Engineering &amp; Technology
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

/**
 * Send leave status notification to faculty
 * @param {object} options
 * @param {string} options.toEmail       - faculty email
 * @param {string} options.facultyName   - faculty full name
 * @param {string} options.leaveType     - e.g. "Casual Leave"
 * @param {string} options.startDate     - formatted start date string
 * @param {string} options.endDate       - formatted end date string
 * @param {string} options.status        - "Approved" | "Rejected"
 * @param {string} options.hodComment    - HOD's comment (optional)
 * @param {string} options.hodName       - HOD's name
 */
async function sendLeaveStatusEmail({
  toEmail,
  facultyName,
  leaveType,
  startDate,
  endDate,
  status,
  hodComment,
  hodName,
}) {
  const isApproved = status === "Approved";
  const statusColor = isApproved ? "#28a745" : "#dc3545";
  const statusBg = isApproved ? "#eafaf1" : "#fdecea";
  const statusIcon = isApproved ? "✅" : "❌";

  const mailOptions = {
    from: `"LeaveDESK – Aditya College" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Leave Request ${status} – LeaveDESK`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden">
        <div style="background:#1a3c5e;padding:20px;text-align:center">
          <h2 style="color:#fff;margin:0">LEAVEDESK</h2>
          <p style="color:#aac4e0;margin:4px 0 0">Aditya College of Engineering</p>
        </div>
        <div style="padding:30px">
          <p style="font-size:15px;color:#333">Dear <strong>${facultyName}</strong>,</p>
          <p style="font-size:15px;color:#333">
            Your leave request has been reviewed by the HOD.
          </p>

          <!-- Status Badge -->
          <div style="text-align:center;margin:20px 0">
            <span style="font-size:20px;font-weight:bold;color:${statusColor};background:${statusBg};padding:10px 28px;border-radius:6px;display:inline-block;border:1px solid ${statusColor}">
              ${statusIcon} ${status}
            </span>
          </div>

          <!-- Leave Details Table -->
          <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px">
            <tr style="background:#f2f6fc">
              <td style="padding:10px 14px;border:1px solid #dde5ef;font-weight:bold;color:#555;width:40%">Leave Type</td>
              <td style="padding:10px 14px;border:1px solid #dde5ef;color:#333">${leaveType}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #dde5ef;font-weight:bold;color:#555">From</td>
              <td style="padding:10px 14px;border:1px solid #dde5ef;color:#333">${startDate}</td>
            </tr>
            <tr style="background:#f2f6fc">
              <td style="padding:10px 14px;border:1px solid #dde5ef;font-weight:bold;color:#555">To</td>
              <td style="padding:10px 14px;border:1px solid #dde5ef;color:#333">${endDate}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #dde5ef;font-weight:bold;color:#555">Reviewed By</td>
              <td style="padding:10px 14px;border:1px solid #dde5ef;color:#333">${hodName} (HOD)</td>
            </tr>
            ${
              hodComment
                ? `<tr style="background:#f2f6fc">
              <td style="padding:10px 14px;border:1px solid #dde5ef;font-weight:bold;color:#555">HOD Comment</td>
              <td style="padding:10px 14px;border:1px solid #dde5ef;color:#333">${hodComment}</td>
            </tr>`
                : ""
            }
          </table>

          <p style="font-size:13px;color:#888;margin-top:24px">
            Please log in to the LeaveDESK portal for more details.
          </p>
        </div>
        <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} Aditya College of Engineering &amp; Technology
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail, sendLeaveStatusEmail };
