"use client";
import DisplayUpcomingEvents from "@/components/DisplayUpcomingEvents";
import { useEffect, useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval as fnsEachDayOfInterval, // Renamed to avoid conflict
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isFuture,
  isPast,
  parseISO, // Import parseISO for converting YYYY-MM-DD strings
} from "date-fns";
import { Button } from "@/components/ui/button";
import CalendarDayModal from "@/components/CalendarDayModal";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  displayDate: string;
  start: string; // Expected to be YYYY-MM-DD after parsing
  end: string; // Expected to be YYYY-MM-DD after parsing
}

function parseDisplayDate(
  displayDate: string
): { start: string; end: string } | null {
  // Range with dash
  if (displayDate.includes(" - ")) {
    const [startStr, endStrPart] = displayDate.split(" - ");

    const yearFromStart = new Date(startStr).getFullYear();
    const endStr = endStrPart.includes(String(yearFromStart))
      ? endStrPart
      : `${endStrPart}, ${yearFromStart}`;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
      };
    }
  }

  // Duration or single date/time
  const dateMatch = displayDate.match(
    /^([A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4})/
  );
  if (dateMatch) {
    const date = new Date(dateMatch[1]);
    if (!isNaN(date.getTime())) {
      return {
        start: format(date, "yyyy-MM-dd"),
        end: format(date, "yyyy-MM-dd"),
      };
    }
  }
  console.warn("Could not parse displayDate:", displayDate);
  return null;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorFetchingEvents, setErrorFetchingEvents] = useState<string | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  // const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null); // Not used in provided snippet

  const CACHE_KEY = "calendar_events_cache";
  const CACHE_DURATION_MS = 5 * 60 * 1000;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = fnsEachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthYear = format(currentDate, "MMMM yyyy"); // Corrected format

  useEffect(() => {
    setLoadingEvents(true);
    setErrorFetchingEvents(null);

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        if (
          parsedCache.timestamp &&
          Date.now() - parsedCache.timestamp < CACHE_DURATION_MS &&
          parsedCache.data
        ) {
          setEvents(parsedCache.data);
          setLoadingEvents(false);
          return;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    fetch("/api/calendar/events")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: CalendarEvent[]) => {
        // Assuming API returns data that might need parsing for start/end
        const processedEvents = data
          .map((event) => {
            const parsedDates = parseDisplayDate(event.displayDate);
            return {
              ...event,
              start: parsedDates ? parsedDates.start : event.start || "",
              end: parsedDates ? parsedDates.end : event.end || "",
            };
          })
          .filter((event) => event.start && event.end);

        setEvents(processedEvents);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: processedEvents })
          );
        } catch {}
      })
      .catch((error) => {
        console.error("Error fetching calendar events:", error);
        setErrorFetchingEvents("Failed to load events.");
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, [CACHE_DURATION_MS]);

  // --- START: Optimized Event Handling ---
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (!events || events.length === 0) return map;

    events.forEach((event) => {
      if (event.start && event.end && event.start !== "" && event.end !== "") {
        try {
          const startDate = parseISO(event.start);
          const endDate = parseISO(event.end);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn(
              `Invalid date strings for event ${event.id}: start='${event.start}', end='${event.end}'`
            );
            return;
          }

          if (startDate > endDate) {
            console.warn(`Event ${event.id} has start date after end date.`);
            return;
          }

          const intervalDays = fnsEachDayOfInterval({
            start: startDate,
            end: endDate,
          });
          intervalDays.forEach((dayInInterval) => {
            const dayKey = format(dayInInterval, "yyyy-MM-dd");
            const existingEvents = map.get(dayKey) || [];
            map.set(dayKey, [...existingEvents, event]);
          });
        } catch (e) {
          console.error(
            `Error processing event dates for event ${event.id}:`,
            e,
            event
          );
        }
      } else {
        console.warn(
          `Event ${event.id} has missing or empty start/end dates after processing.`
        );
      }
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dayKey = format(day, "yyyy-MM-dd");
    return eventsByDate.get(dayKey) || [];
  };

  const dayHasUpcomingEvent = (day: Date): boolean => {
    const eventsOnDay = getEventsForDay(day);
    if (eventsOnDay.length === 0) return false;
    return eventsOnDay.some(
      (event) => event.end && isFuture(parseISO(event.end))
    );
  };

  const dayHasPastEvent = (day: Date): boolean => {
    const eventsOnDay = getEventsForDay(day);
    if (eventsOnDay.length === 0) return false;
    const isUpcomingPresent = eventsOnDay.some(
      (event) => event.end && isFuture(parseISO(event.end))
    );
    if (isUpcomingPresent) return false;
    return eventsOnDay.some(
      (event) => event.end && isPast(parseISO(event.end))
    );
  };

  const upcomingEventsList = useMemo(() => {
    return events
      .filter((event) => {
        if (!event.end) return false;
        try {
          return isFuture(parseISO(event.end));
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        if (!a.start || !b.start) return 0;
        try {
          return parseISO(a.start).getTime() - parseISO(b.start).getTime();
        } catch {
          return 0;
        }
      });
  }, [events]);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <CalendarDayModal open={open} onClose={() => setOpen(false)}>
        {selectedDay ? (
          (() => {
            const dayEvents = getEventsForDay(selectedDay);
            return dayEvents.length > 0 ? (
              dayEvents.map((event) => (
                <div key={event.id} className="">
                  <h2 className="font-bold text-lg leading-tight mt-2 ">
                    {event.title}
                  </h2>
                  <p className="text-sm text-neutral-800">
                    {event.displayDate}
                  </p>
                  {event.description && (
                    <p className="text-neutral-800">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-xs text-neutral-800">{event.location}</p>
                  )}
                </div>
              ))
            ) : (
              <p>No events for this day.</p>
            );
          })()
        ) : (
          <p>No day selected.</p>
        )}
      </CalendarDayModal>

      <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
        <div className="relative z-10 py-20 px-4 pt-24">
          <div className="container mx-auto px-4 py-8 max-w-4xl gap-4">
            <div className="bg-neutral-800 rounded-lg shadow-xl overflow-hidden border border-neutral-700 relative">
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

              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {dayNames.map((dayName) => (
                    <div
                      key={dayName}
                      className="text-center text-sm font-medium text-neutral-300 py-2"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    const hasUpcoming = dayHasUpcomingEvent(day);
                    const hasPast = dayHasPastEvent(day);

                    return (
                      <div
                        key={index}
                        className={`
                          aspect-square flex flex-col items-center justify-center
                          transition-colors
                       
                          ${
                            isCurrentMonth
                              ? "text-neutral-200 border-neutral-700    border-2 "
                              : "text-neutral-200 opacity-50 border-neutral-700/50 border"
                          }
                          ${
                            isToday && hasUpcoming
                              ? "bg-violet-600 rounded-3xl text-white"
                              : isToday && !hasUpcoming
                              ? "bg-blue-500 rounded-md text-white"
                              : hasUpcoming
                              ? "bg-red-400/70 rounded-md"
                              : hasPast
                              ? "bg-neutral-600/70 rounded-md"
                              : "rounded-md"
                          }
                          ${
                            !isCurrentMonth && !hasUpcoming && !hasPast
                              ? "bg-neutral-800/30"
                              : ""
                          } // Dim out-of-month days without events further
                        `}
                      >
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay(day);
                            setOpen(true);
                          }}
                          variant="ghost"
                          className="w-full h-full hover:bg-neutral-500/50 focus:bg-neutral-500/30"
                          disabled={!isCurrentMonth && !hasUpcoming && !hasPast}
                        >
                          <span
                            className={`text-sm ${isToday ? "font-bold" : ""}`}
                          >
                            {format(day, "d")}
                          </span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DisplayUpcomingEvents
              loadingEvents={loadingEvents}
              errorFetchingEvents={errorFetchingEvents}
              upcomingEventsList={upcomingEventsList}
            />
          </div>
        </div>
      </div>
    </>
  );
}
