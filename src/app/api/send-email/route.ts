import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Create a rate limiter that allows 5 requests per hour per IP
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
});

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

// Function to verify reCAPTCHA token
async function verifyRecaptcha(token: string) {
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    {
      method: "POST",
    }
  );
  const data = await response.json();
  return data.success;
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";

    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    const { name, email, subject, message, recaptchaToken, website } =
      await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message || !recaptchaToken) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for honeypot field
    if (website) {
      // Silently succeed if honeypot is filled
      return NextResponse.json({ success: true });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA (only in production)
    if (process.env.NODE_ENV !== "development") {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!isRecaptchaValid) {
        console.error("reCAPTCHA verification failed."); // Log for clarity
        return NextResponse.json(
          { error: "reCAPTCHA verification failed" },
          { status: 400 }
        );
      }
    } else {
      console.log("Skipping reCAPTCHA verification in development mode."); // Log for clarity
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
    let errorMessage = "Unknown error";
    let errorStack = undefined;

    // Check if the caught object is an Error instance
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    }

    // Log the specific error message
    console.error(
      "Error sending email:",
      errorMessage,
      errorStack // Optionally log the stack trace for more detail
    );
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
