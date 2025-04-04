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
    <div className="min-h-screen bg-slate-900 py-20 px-4">
      <div className="container mt-20 mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">{monthYear}</h1>
              <div className="flex space-x-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-full hover:bg-blue-500/50 transition-colors"
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
                  className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-sm text-white"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-full hover:bg-blue-500/50 transition-colors"
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
                  className="text-center text-sm font-medium text-slate-400 py-2"
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
                    ${isCurrentMonth ? "text-slate-200" : "text-slate-600"}
                    ${
                      isToday
                        ? "bg-blue-500 rounded-full font-bold text-white"
                        : ""
                    }
                    hover:bg-slate-700 rounded-md transition-colors
                    border border-slate-700
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
        <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200 mb-2">
            Google Calendar Integration
          </h2>
          <p className="text-slate-400">
            This calendar will be integrated with Google Calendar in the future.
            You'll be able to view and manage your Google Calendar events
            directly from this interface.
          </p>
        </div>
      </div>
    </div>
  );
}
