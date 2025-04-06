import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Email options
    const mailOptions = {
      from: `"${name}" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Message from ${name}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
              <div style="background-color: #4a90e2; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Message from ${name}</h1>
              </div>
              <div style="padding: 30px; background-color: #ffffff;">
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                  <p style="margin: 5px 0; color: #333333;"><strong style="color: #4a90e2;">Name:</strong> ${name}</p>
                  <p style="margin: 5px 0; color: #333333;"><strong style="color: #4a90e2;">Email:</strong> ${email}</p>
                  <p style="margin: 5px 0; color: #333333;"><strong style="color: #4a90e2;">Subject:</strong> ${subject}</p>
                </div>
                <div style="margin-top: 20px;">
                  <h2 style="color: #333333; font-size: 18px; margin-bottom: 10px;">Message:</h2>
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #4a90e2;">
                    <p style="margin: 0; color: #333333; white-space: pre-wrap; line-height: 1.5;">${message}</p>
                  </div>
                </div>
              </div>
              <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">This message was sent from your Yorticia's website contact form.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
