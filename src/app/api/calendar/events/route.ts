// pages/api/events.ts

import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Retrieve environment variables
  const serviceAccountKeyBase64 = process.env.GOOGLE_CALENDAR_SA_BASE64_CONTENT;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!serviceAccountKeyBase64 || !calendarId) {
    console.error(
      "Missing GOOGLE_CALENDAR_SA_BASE64_CONTENT or GOOGLE_CALENDAR_ID environment variables."
    );
    return NextResponse.json(
      { message: "Server configuration error." },
      { status: 500 }
    );
  }

  // Decode the Base64 key
  const serviceAccountKey = JSON.parse(
    Buffer.from(serviceAccountKeyBase64, "base64").toString("utf8")
  );

  const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountKey.client_email,
        private_key: serviceAccountKey.private_key,
      },
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Calculate the date range: previous month start to end of next 2 months
    const now = new Date();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfNext2Months = new Date(
      now.getFullYear(),
      now.getMonth() + 3,
      0, // Day 0 of the next month is the last day of the current month
      23,
      59,
      59 // Set to end of the day
    );

    // Calculate the threshold for displaying full content (3 days from now)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfPrevMonth.toISOString(),
      timeMax: endOfNext2Months.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500, // Increase to cover more events if needed
    });

    const events = response.data.items || [];

    if (events.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const filteredEvents = events.map((event) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      const eventStartTime = new Date(start || ""); // Convert event start time to Date object

      let title = "Client Event"; // Default generic title
      let location = null; // Default hidden location
      let description = "hidden for now"; // Default hidden description

      // Check if the event is within the 3-day window from now
      // And also check if the event is in the future (not already passed)
      if (eventStartTime <= threeDaysFromNow) {
        title = event.summary || "Unnamed Event"; // Use actual summary if available
        location = event.location || null; // Include location
        description = event.description || ""; // Include description
      }

      return {
        id: event.id,
        start: start,
        end: end,
        title: title,
        description: description,
        location: location,
      };
    });

    // Optionally filter out events that have already passed if you only want future ones in the final display
    // const futureEvents = filteredEvents.filter(event => new Date(event.end) >= now);

    console.log("Filtered events (with conditional content):", filteredEvents);

    return NextResponse.json(filteredEvents, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch calendar events.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
