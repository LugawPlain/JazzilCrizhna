"use client";

import { useState } from "react";
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
} from "date-fns";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the first day of the current month
  const monthStart = startOfMonth(currentDate);
  // Get the last day of the current month
  const monthEnd = endOfMonth(currentDate);
  // Get the start of the week for the first day of the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Get the end of the week for the last day of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Get all days in the calendar view
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Format the current month and year for display
  const monthYear = format(currentDate, "MMMM yyyy");

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
      {/* Background Images */}

      {/* Content */}
      <div className="relative z-10 py-20 px-4 pt-24">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className=" bg-neutral-800 rounded-lg shadow-xl overflow-hidden border border-neutral-700 relative">
            {/* Under Construction Overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-xl transform -rotate-12 shadow-lg">
                Under Construction
              </div>
            </div>
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

                  return (
                    <div
                      key={index}
                      className={`
                      aspect-square p-1 flex flex-col items-center justify-center
                      ${
                        isCurrentMonth ? "text-neutral-200" : "text-neutral-500"
                      }
                      ${
                        isToday
                          ? "bg-neutral-600 rounded-full font-bold text-white"
                          : ""
                      }
                      hover:bg-neutral-700 rounded-md transition-colors
                      border border-neutral-700
                    `}
                    >
                      <span className="text-sm">{format(day, "d")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Placeholder for future Google Calendar integration */}
          <div className="mt-8 p-6  bg-neutral-700 rounded-lg border border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-200 mb-2"></h2>
            <p className="text-neutral-400">
              This calendar integration will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
