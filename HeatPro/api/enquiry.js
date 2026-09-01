import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      name,
      phone,
      email,
      requirement,
      website = ""
    } = body;

    // Anti-spam honeypot
    if (website) {
      return res.status(200).json({
        success: true,
        message: "Thank you. Your enquiry has been received."
      });
    }

    if (!name || !email || !requirement) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name, email and requirement."
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD
      }
    });

    const submittedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const text = `
NEW HEATPRO WEBSITE ENQUIRY

Name: ${name}
Phone: ${phone || "Not provided"}
Email: ${email}

Requirement:
${requirement}

Submitted:
${submittedAt}
`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto">
        <h2 style="color:#f26722;">New HeatPro Website Enquiry</h2>

        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>

        <h3>Requirement</h3>

        <div style="
          padding:15px;
          background:#f5f5f5;
          border-left:4px solid #f26722;
          white-space:pre-wrap;
        ">${escapeHtml(requirement)}</div>

        <p style="margin-top:20px;color:#666;font-size:13px;">
          Submitted: ${submittedAt}
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"HeatPro Website" <${process.env.SMTP_USER}>`,

      to: [
        "heatprosystems@gmail.com",
        "annagbm18@gmail.com"
      ],

      replyTo: email,

      subject: `New HeatPro Enquiry - ${name}`,

      text,
      html
    });

    return res.status(200).json({
      success: true,
      message: "Thank you. Your enquiry has been sent successfully."
    });

  } catch (error) {
    console.error("HeatPro enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send your enquiry right now. Please try again."
    });
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
