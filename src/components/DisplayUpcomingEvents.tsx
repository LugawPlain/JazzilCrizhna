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
}) => {
  // Split events into 'Happening Soon' (within 3 days) and 'Future Events'
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const soonEvents: Event[] = [];
  const futureEvents: Event[] = [];
  upcomingEventsList.forEach((event) => {
    const startDate = new Date(event.start);
    if (startDate <= threeDaysFromNow) {
      soonEvents.push(event);
    } else {
      futureEvents.push(event);
    }
  });

  return (
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
        <>
          {soonEvents.length > 0 && (
            <>
              <div className="mb-2 text-amber-300 font-semibold text-sm uppercase tracking-wide">
                Happening Soon{" "}
                <span className="text-neutral-400 text-xs font-normal normal-case">
                  (3 days from now)
                </span>
              </div>
              <ul className="space-y-4 mb-6">
                {soonEvents.map((event) => (
                  <li
                    key={event.id}
                    className="bg-neutral-600 p-4 rounded-md border border-neutral-500"
                  >
                    <h3 className="text-lg font-semibold text-neutral-100">
                      {event.title}
                    </h3>
                    <p className="text-sm text-neutral-300">
                      {event.displayDate}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {soonEvents.length > 0 && futureEvents.length > 0 && (
            <div className="border-t border-neutral-500 my-4" />
          )}
          {futureEvents.length > 0 && (
            <>
              <div className="mb-2 text-blue-300 font-semibold text-sm uppercase tracking-wide">
                Future Events{" "}
                <span className="text-neutral-400 text-xs font-normal normal-case">
                  (subject to change)
                </span>
              </div>
              <ul className="space-y-4">
                {futureEvents.map((event) => (
                  <li
                    key={event.id}
                    className="bg-neutral-600 p-4 rounded-md border border-neutral-500"
                  >
                    <h3 className="text-lg font-semibold text-neutral-100">
                      {event.title}
                    </h3>
                    <p className="text-sm text-neutral-300">
                      {event.displayDate}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DisplayUpcomingEvents;
