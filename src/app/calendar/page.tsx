"use client";

import { useEffect, useState, useMemo } from "react"; // Added useMemo for optimization
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isFuture,
  isPast,
  isBefore,
  isAfter,
} from "date-fns";

// Define the shape of your event data returned from the API
interface CalendarEvent {
  id: string;
  start: string; // ISO string like "2024-05-27T10:00:00Z" or "2024-05-27"
  end: string; // ISO string
  title: string;
  description?: string; // Optional, only present for upcoming events
  location?: string; // Optional, only present for upcoming events
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorFetchingEvents, setErrorFetchingEvents] = useState<string | null>(
    null
  );

  // Calendar calculations (these are good as they are)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthYear = format(currentDate, "MMMM yyyy"); // Corrected format for "YYYY"

  // Fetch events from your API route
  useEffect(() => {
    setLoadingEvents(true);
    setErrorFetchingEvents(null);

    fetch("/api/calendar/events") // Your API route
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: CalendarEvent[]) => {
        setEvents(data);
        console.log("Fetched events for client-side:", data);
      })
      .catch((error) => {
        console.error("Error fetching calendar events:", error);
        setErrorFetchingEvents("Failed to load events.");
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, []); // Empty dependency array: fetch once on mount. If you want to re-fetch when month changes, add currentDate here.

  // Helper function to check if a day has an upcoming event for highlighting
  const hasUpcomingEventOnDay = (day: Date): boolean => {
    return events.some((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end); // Use event end for "is it still relevant?"

      // Check if the event's start date matches the calendar day
      // AND the event's end time is in the future (meaning it's not over yet)
      return isSameDay(eventStart, day) && isFuture(eventEnd);
    });
  };

  // Helper function to check if a day has a past event (for different styling)
  const hasPastEventOnDay = (day: Date): boolean => {
    return events.some((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Event started on this day AND has already ended
      return isSameDay(eventStart, day) && isPast(eventEnd);
    });
  };

  // Filter events to display ONLY upcoming events in the list below the calendar
  const upcomingEventsList = useMemo(() => {
    const now = new Date();
    // Filter events that have not yet ended
    return events
      .filter((event) => {
        const eventEnd = new Date(event.end);
        return isFuture(eventEnd);
      })
      .sort((a, b) => {
        // Sort by start time to show nearest events first
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
  }, [events]); // Re-calculate when 'events' state changes

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Day names for the header
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Background Images - (your existing code) */}

      {/* Content */}
      <div className="relative z-10 py-20 px-4 pt-24">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-neutral-800 rounded-lg shadow-xl overflow-hidden border border-neutral-700 relative">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-neutral-700 to-neutral-800 p-6 text-white border-b border-neutral-700">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-100">
                  {monthYear}
                </h1>
                <div className="flex space-x-2">
                  <button
                    onClick={prevMonth}
                    className="p-2 rounded-full hover:bg-neutral-600/50 transition-colors"
                    aria-label="Previous month"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 rounded-md bg-neutral-600/50 hover:bg-neutral-600 transition-colors text-sm text-neutral-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-full hover:bg-neutral-600/50 transition-colors"
                    aria-label="Next month"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-neutral-300 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const hasUpcoming = hasUpcomingEventOnDay(day); // Check for upcoming event
                  const hasPast = hasPastEventOnDay(day); // Check for past event on this day

                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square p-1 flex flex-col items-center justify-center
                         hover:bg-neutral-700 rounded-md transition-colors
                        border border-neutral-700
                        ${
                          isCurrentMonth
                            ? "text-neutral-200"
                            : "text-neutral-500"
                        }
                        ${
                          isToday
                            ? "bg-blue-600 rounded-full font-bold text-white"
                            : ""
                        }
                        ${hasUpcoming ? "bg-red-400/50 text-white" : ""}
                        ${
                          hasPast && !hasUpcoming
                            ? "bg-neutral-700 text-neutral-400"
                            : ""
                        }
                       
                      `}
                    >
                      <span className="text-sm">{format(day, "d")}</span>
                      {/* Small dot/indicator for events */}
                      {hasUpcoming && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full mt-1"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Display ONLY UPCOMING events in the list below the calendar */}
          <div className="mt-8 p-6 bg-neutral-700 rounded-lg border border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-200 mb-4">
              Upcoming Events
            </h2>
            {loadingEvents ? (
              <p className="text-neutral-400">Loading upcoming events...</p>
            ) : errorFetchingEvents ? (
              <p className="text-red-400">{errorFetchingEvents}</p>
            ) : upcomingEventsList.length === 0 ? ( // Use the filtered list here
              <p className="text-neutral-400">
                No upcoming events found for this period.
              </p>
            ) : (
              <ul className="space-y-4">
                {upcomingEventsList.map(
                  (
                    event // Iterate over the filtered list
                  ) => {
                    const isAllDay =
                      !!event.start && !event.start.includes("T");

                    return (
                      <li
                        key={event.id}
                        className="bg-neutral-600 p-4 rounded-md border border-neutral-500"
                      >
                        <h3 className="text-lg font-semibold text-neutral-100">
                          {event.title}
                        </h3>
                        <p className="text-sm text-neutral-300">
                          {isAllDay
                            ? new Date(event.start).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : new Date(event.start).toLocaleString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                          {!isAllDay && (
                            <>
                              {" - "}
                              {new Date(event.end).toLocaleString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </>
                          )}
                        </p>

                        {/* <p className="text-neutral-400 mt-2 text-sm">
                          Description: {event.description}
                        </p>

                        <p className="text-neutral-400 text-sm">
                          Location: {event.location}
                        </p> */}
                      </li>
                    );
                  }
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
