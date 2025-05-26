import React from "react";

interface Event {
  id: string;
  title: string;
  displayDate: string;
  start: string;
  end: string;
}

interface DisplayUpcomingEventsProps {
  loadingEvents: boolean;
  errorFetchingEvents: string | null;
  upcomingEventsList: Event[];
}

const DisplayUpcomingEvents: React.FC<DisplayUpcomingEventsProps> = ({
  loadingEvents,
  errorFetchingEvents,
  upcomingEventsList,
}) => (
  <div className="mt-8 p-6 bg-neutral-700 rounded-lg border border-neutral-700">
    <h2 className="text-lg font-semibold text-neutral-200 mb-4">
      Upcoming Events
    </h2>
    {loadingEvents ? (
      <p className="text-neutral-400">Loading upcoming events...</p>
    ) : errorFetchingEvents ? (
      <p className="text-red-400">{errorFetchingEvents}</p>
    ) : upcomingEventsList.length === 0 ? (
      <p className="text-neutral-400">
        No upcoming events found for this period.
      </p>
    ) : (
      <ul className="space-y-4">
        {upcomingEventsList.map((event) => (
          <li
            key={event.id}
            className="bg-neutral-600 p-4 rounded-md border border-neutral-500"
          >
            <h3 className="text-lg font-semibold text-neutral-100">
              {event.title}
            </h3>
            <p className="text-sm text-neutral-300">{event.displayDate}</p>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default DisplayUpcomingEvents;
