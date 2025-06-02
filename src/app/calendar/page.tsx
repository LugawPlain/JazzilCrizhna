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
  parseISO, // Import parseISO for converting YYYY-MM-DD strings
} from "date-fns";
import { Button } from "@/components/ui/button";

import CalendarDayModal from "@/components/CalendarDayModal";
import CalendarSelectMonth from "@/components/CalendarSelectMonth";
import CalendarSelectYear from "@/components/CalendarSelectYear";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  displayDate: string;
  start: string; // Expected to be YYYY-MM-DD after parsing
  end: string; // Expected to be YYYY-MM-DD after parsing
  startTimestamp?: number; // Added: Numeric timestamp for start
  endTimestamp?: number; // Added: Numeric timestamp for end
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

  const CACHE_KEY = "calendar_events_cache";
  const CACHE_DURATION_MS = 20 * 60 * 1000;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = fnsEachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const now = useMemo(() => new Date(), []);
  const threeDaysFromNow = useMemo(
    () => new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    [now]
  );

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
          // Ensure cached data also has timestamps if this logic is newer than cache
          const eventsWithTimestamps = parsedCache.data
            .map((event: CalendarEvent) => {
              if (
                event.start &&
                event.end &&
                (!event.startTimestamp || !event.endTimestamp)
              ) {
                try {
                  return {
                    ...event,
                    startTimestamp: parseISO(event.start).getTime(),
                    endTimestamp: parseISO(event.end).getTime(),
                  };
                } catch (e) {
                  console.warn(
                    `Error parsing cached event dates ${event.id}:`,
                    e
                  );
                  return {
                    ...event,
                    startTimestamp: undefined,
                    endTimestamp: undefined,
                  };
                }
              }
              return event;
            })
            .filter(
              (event: CalendarEvent) =>
                event.startTimestamp && event.endTimestamp
            );
          setEvents(eventsWithTimestamps);
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
        const processedEvents = data
          .map((event) => {
            const parsedDates = parseDisplayDate(event.displayDate);
            const startStr = parsedDates
              ? parsedDates.start
              : event.start || "";
            const endStr = parsedDates ? parsedDates.end : event.end || "";

            let startTs, endTs;
            if (startStr && endStr) {
              try {
                startTs = parseISO(startStr).getTime();
                endTs = parseISO(endStr).getTime();
              } catch (e) {
                console.warn(
                  `Error parsing dates for event ${event.id}: start='${startStr}', end='${endStr}'`,
                  e
                );
              }
            }

            return {
              ...event,
              start: startStr,
              end: endStr,
              startTimestamp: startTs,
              endTimestamp: endTs,
            };
          })
          .filter(
            (event) =>
              event.startTimestamp &&
              event.endTimestamp &&
              event.start &&
              event.end
          ); // Ensure valid events
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
  }, [CACHE_DURATION_MS, CACHE_KEY]);

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

  const hasUpcomingEvent = (eventsOnDay: CalendarEvent[]): boolean => {
    if (eventsOnDay.length === 0) return false;
    const threeDaysFromNowTimestamp = threeDaysFromNow.getTime();

    return eventsOnDay.some((event) => {
      if (!event.startTimestamp) return false;
      return event.startTimestamp > threeDaysFromNowTimestamp;
    });
  };

  const hasHappeningSoonEvent = (eventsOnDay: CalendarEvent[]): boolean => {
    if (eventsOnDay.length === 0) return false;

    const nowTimestamp = now.getTime();
    const threeDaysFromNowTimestamp = threeDaysFromNow.getTime();

    return eventsOnDay.some((event) => {
      if (!event.startTimestamp || !event.endTimestamp) return false;

      // Event is happening soon if it starts within 3 days AND ends within 3 days

      return (
        event.startTimestamp > nowTimestamp &&
        event.startTimestamp <= threeDaysFromNowTimestamp &&
        event.endTimestamp <= threeDaysFromNowTimestamp
      );
    });
  };

  const hasPastEvent = (eventsOnDay: CalendarEvent[]): boolean => {
    if (eventsOnDay.length === 0) return false;
    const nowMs = now.getTime(); // 'now' is from useMemo

    // Check if any event on this day is still upcoming or happening now
    const isFutureOrCurrentEventPresent = eventsOnDay.some(
      (event) => event.endTimestamp && event.endTimestamp >= nowMs
    );
    if (isFutureOrCurrentEventPresent) return false;

    return eventsOnDay.some((event) => {
      if (!event.endTimestamp) return false;
      return event.endTimestamp < nowMs;
    });
  };

  const hasHappeningNowEvent = (eventsOnDay: CalendarEvent[]): boolean => {
    if (eventsOnDay.length === 0) return false;
    const nowTimestamp = now.getTime();

    return eventsOnDay.some((event) => {
      if (!event.startTimestamp || !event.endTimestamp) return false;
      return (
        event.startTimestamp <= nowTimestamp &&
        nowTimestamp < event.endTimestamp + 86399000
      );
    });
  };

  const categorizedEvents = useMemo(() => {
    const happeningNow: CalendarEvent[] = [];
    const soon: CalendarEvent[] = [];
    const future: CalendarEvent[] = [];

    const nowTimestamp = now.getTime();
    const threeDaysFromNowTimestamp = threeDaysFromNow.getTime();
    const endOfDayOffset = 86399000; // 23:59:59 in milliseconds

    events.forEach((event) => {
      // Use pre-calculated timestamps
      if (!event.startTimestamp || !event.endTimestamp) return;

      if (
        event.startTimestamp <= nowTimestamp &&
        nowTimestamp < event.endTimestamp + endOfDayOffset
      ) {
        happeningNow.push(event);
      } else if (
        event.startTimestamp > nowTimestamp &&
        event.startTimestamp <= threeDaysFromNowTimestamp
      ) {
        soon.push(event);
      } else if (event.startTimestamp > threeDaysFromNowTimestamp) {
        future.push(event);
      }
    });

    return { happeningNow, soon, future };
  }, [events, now, threeDaysFromNow]);

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
                  <div className="flex items-center gap-2">
                    <CalendarSelectMonth
                      currentDate={currentDate}
                      onDateChange={setCurrentDate}
                    />

                    <CalendarSelectYear
                      currentDate={currentDate}
                      onDateChange={setCurrentDate}
                    />
                  </div>
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
                    const eventsOnDay = getEventsForDay(day);
                    const hasUpcoming = hasUpcomingEvent(eventsOnDay);
                    const hasHappeningSoon = hasHappeningSoonEvent(eventsOnDay);
                    const hasHappeningNow = hasHappeningNowEvent(eventsOnDay);
                    const hasPast = hasPastEvent(eventsOnDay);

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
                            hasHappeningNow
                              ? "bg-blue-500/80 rounded-md text-white"
                              : hasUpcoming
                              ? "bg-red-500/80 rounded-md text-white"
                              : hasHappeningSoon
                              ? "bg-yellow-500/80 rounded-md text-white"
                              : hasPast
                              ? "bg-neutral-600/70 rounded-md"
                              : "rounded-md"
                          }
                          ${
                            !isCurrentMonth &&
                            !hasUpcoming &&
                            !hasHappeningSoon &&
                            !hasHappeningNow &&
                            !hasPast
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
                          disabled={
                            !isCurrentMonth &&
                            !hasUpcoming &&
                            !hasHappeningSoon &&
                            !hasHappeningNow &&
                            !hasPast
                          }
                        >
                          <span
                            className={`text-sm ${
                              isToday
                                ? "font-bold bg-blue-400 rounded-full h-6 w-6 flex items-center justify-center"
                                : ""
                            }`}
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
              happeningNowEvents={categorizedEvents.happeningNow}
              soonEvents={categorizedEvents.soon}
              futureEvents={categorizedEvents.future}
            />
          </div>
        </div>
      </div>
    </>
  );
}
