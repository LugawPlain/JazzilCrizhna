"use client";

import { useState } from "react";
import { format } from "date-fns";

interface TimelineEvent {
  date: Date;
  title: string;
}

export default function CalendarPage() {
  const [events] = useState<TimelineEvent[]>([
    { date: new Date(2024, 3, 10), title: "Appointment" }, // April 10, 2024
    { date: new Date(2024, 3, 15), title: "Meeting" }, // April 15, 2024
  ]);

  const startDate = new Date(2024, 3, 1); // April 1, 2024
  const endDate = new Date(2024, 3, 30); // April 30, 2024
  const days = Array.from(
    {
      length: Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    },
    (_, i) => new Date(startDate.getTime() + i * (1000 * 60 * 60 * 24))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto flex justify-end">
        <div className="w-64">
          <h1 className="text-3xl font-bold mb-8">Calendar Timeline</h1>

          <div className="relative h-[600px]">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 w-1 bg-gray-300 right-1/2" />

            <div className="relative h-full flex flex-col justify-between">
              {days.map((day, index) => {
                const hasEvent = events.some(
                  (event) => event.date.toDateString() === day.toDateString()
                );

                return (
                  <div key={index} className="relative">
                    {/* Date marker */}
                    <div
                      className={`w-4 h-4 rounded-full ${
                        hasEvent ? "bg-blue-500" : "bg-gray-400"
                      } transform translate-x-1/2`}
                    />

                    {/* Date label */}
                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-sm">
                      {format(day, "MMM d")}
                    </div>

                    {/* Event tooltip */}
                    {hasEvent && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 translate-x-4 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">
                        {
                          events.find(
                            (event) =>
                              event.date.toDateString() === day.toDateString()
                          )?.title
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
