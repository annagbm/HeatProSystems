
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      requirement,
      website = ""
    } = body;

    // Honeypot anti-spam field.
    // Normal visitors should never fill this.
    if (website) {
      return Response.json({
        success: true,
        message: "Thank you. Your enquiry has been received."
      });
    }

    // Validation
    if (!name || !phone || !requirement) {
      return Response.json(
        {
          success: false,
          message: "Please enter your name, phone number and requirement."
        },
        { status: 400 }
      );
    }

    if (name.length > 100 || phone.length > 30 || requirement.length > 3000) {
      return Response.json(
        {
          success: false,
          message: "Some of the submitted information is too long."
        },
        { status: 400 }
      );
    }

    const safeEmail =
      email && email.includes("@") ? email.trim() : "Not provided";

    // --------------------------------
    // 1. SEND EMAIL USING RESEND
    // --------------------------------

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto">
        <h2 style="color:#ed4b23;">New HeatPro Website Enquiry</h2>

        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:10px;border:1px solid #ddd"><strong>Name</strong></td>
            <td style="padding:10px;border:1px solid #ddd">${escapeHtml(name)}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd"><strong>Phone</strong></td>
            <td style="padding:10px;border:1px solid #ddd">${escapeHtml(phone)}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd"><strong>Email</strong></td>
            <td style="padding:10px;border:1px solid #ddd">${escapeHtml(safeEmail)}</td>
          </tr>
        </table>

        <h3>Requirement</h3>

        <div style="
          padding:15px;
          background:#f5f5f5;
          border-left:4px solid #ed4b23;
          white-space:pre-wrap;
        ">${escapeHtml(requirement)}</div>

        <p style="margin-top:20px;color:#666;font-size:13px">
          Sent from the HeatPro Systems website enquiry form.
        </p>
      </div>
    `;

    let emailSuccess = false;
    let smsSuccess = false;

    try {
      const emailResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            from:
              process.env.EMAIL_FROM ||
              "HeatPro Website <enquiries@heat-pro-systems.com>",

            to: ["heatprosystems@gmail.com"],

            reply_to:
              safeEmail !== "Not provided"
                ? safeEmail
                : undefined,

            subject: `New HeatPro Enquiry - ${name}`,

            html: emailHtml
          })
        }
      );

      emailSuccess = emailResponse.ok;

      if (!emailSuccess) {
        console.error(
          "Resend error:",
          await emailResponse.text()
        );
      }
    } catch (error) {
      console.error("Email error:", error);
    }

    // --------------------------------
    // 2. SEND SMS USING TWILIO
    // --------------------------------

    try {
      const smsText = [
        "NEW HEATPRO ENQUIRY",
        "",
        `Name: ${name}`,
        `Phone: ${phone}`,
        safeEmail !== "Not provided"
          ? `Email: ${safeEmail}`
          : "",
        "",
        `Requirement: ${requirement.substring(0, 500)}`
      ]
        .filter(Boolean)
        .join("\n");

      const accountSid =
        process.env.TWILIO_ACCOUNT_SID;

      const authToken =
        process.env.TWILIO_AUTH_TOKEN;

      const twilioUrl =
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const parameters = new URLSearchParams();

      parameters.append(
        "To",
        process.env.OWNER_PHONE
      );

      parameters.append(
        "From",
        process.env.TWILIO_PHONE_NUMBER
      );

      parameters.append(
        "Body",
        smsText
      );

      const smsResponse = await fetch(twilioUrl, {
        method: "POST",

        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${accountSid}:${authToken}`
            ).toString("base64"),

          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body: parameters
      });

      smsSuccess = smsResponse.ok;

      if (!smsSuccess) {
        console.error(
          "Twilio error:",
          await smsResponse.text()
        );
      }
    } catch (error) {
      console.error("SMS error:", error);
    }

    // At least one notification succeeded
    if (emailSuccess || smsSuccess) {
      return Response.json({
        success: true,
        message:
          "Thank you! Your enquiry has been sent successfully."
      });
    }

    return Response.json(
      {
        success: false,
        message:
          "We could not send your enquiry. Please contact HeatPro directly."
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Enquiry API error:", error);

    return Response.json(
      {
        success: false,
        message:
          "Something went wrong. Please try again."
      },
      { status: 500 }
    );
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
