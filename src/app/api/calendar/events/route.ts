// pages/api/events.ts

import { google } from "googleapis";
import { NextResponse } from "next/server";

let eventCache: { data: any[] | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();
  if (eventCache.data && now - eventCache.timestamp < CACHE_DURATION) {
    return NextResponse.json(eventCache.data, { status: 200 });
  }

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
      maxResults: 100, // Increase to cover more events if needed
    });

    const events = response.data.items || [];

    if (events.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    // console.log("Events:", events);

    const filteredEvents = events.map((event) => {
      const start = event.start?.dateTime || event.start?.date || "";
      const end = event.end?.dateTime || event.end?.date || "";

      const startDate = new Date(start);
      let endDate = new Date(end);
      const isAllDay = !!event.start?.date && !event.start?.dateTime;
      if (isAllDay) {
        // Subtract 1 day from end for all-day events (Google Calendar exclusive end)
        endDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      }
      const isSameDay =
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate();
      const isSameTime = startDate.getTime() === endDate.getTime();
      let displayDate = "";
      if (isAllDay) {
        if (isSameDay || isSameTime) {
          displayDate = startDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else {
          displayDate =
            startDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            }) +
            " - " +
            endDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
        }
      } else {
        if (isSameDay) {
          if (isSameTime) {
            // Same date and time
            displayDate = startDate.toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          } else {
            // Same date, different times: show date and duration
            const diffMs = endDate.getTime() - startDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const minutes = diffMins % 60;
            let duration = "";
            if (hours > 0) duration += `${hours} hour${hours > 1 ? "s" : ""}`;
            if (minutes > 0)
              duration += `${hours > 0 ? " " : ""}${minutes} minute${
                minutes > 1 ? "s" : ""
              }`;
            displayDate =
              startDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              }) + (duration ? `, ${duration}` : "");
          }
        } else {
          // Different dates
          displayDate =
            startDate.toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }) +
            "  -  " +
            endDate.toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
        }
      }
      let title = "Client Event"; // Default generic title
      let location = null; // Default hidden location
      // Check if the event is within the 3-day window from now
      // And also check if the event is in the future (not already passed)
      const eventStartTime = new Date(start || "");
      if (eventStartTime <= threeDaysFromNow) {
        title = event.summary || "Unnamed Event"; // Use actual summary if available
        location = event.location || null; // Include location
      }
      return {
        id: event.id,
        displayDate,
        title,
        location,
        description: event.description,
      };
    });

    // Optionally filter out events that have already passed if you only want future ones in the final display
    // const futureEvents = filteredEvents.filter(event => new Date(event.end) >= now);

    console.log("Filtered events (with conditional content):", filteredEvents);

    eventCache = { data: filteredEvents, timestamp: Date.now() };
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
