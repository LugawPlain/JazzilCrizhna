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
  happeningNowEvents: Event[];
  soonEvents: Event[];
  futureEvents: Event[];
}

const DisplayUpcomingEvents: React.FC<DisplayUpcomingEventsProps> = ({
  loadingEvents,
  errorFetchingEvents,
  happeningNowEvents,
  soonEvents,
  futureEvents,
}) => {
  return (
    <div className="mt-8 p-6 bg-neutral-700 rounded-lg border border-neutral-700">
      <h2 className="text-lg font-semibold text-neutral-200 mb-4">
        Upcoming Events
      </h2>
      {loadingEvents ? (
        <p className="text-neutral-400">Loading upcoming events...</p>
      ) : errorFetchingEvents ? (
        <p className="text-red-400">{errorFetchingEvents}</p>
      ) : happeningNowEvents.length === 0 &&
        soonEvents.length === 0 &&
        futureEvents.length === 0 ? (
        <p className="text-neutral-400">
          No upcoming events found for this period.
        </p>
      ) : (
        <>
          <>
            <div className="mb-2 text-blue-400 font-semibold text-sm uppercase tracking-wide">
              Happening Now
            </div>
            <ul className="space-y-4 mb-6">
              {happeningNowEvents.map((event) => (
                <li
                  key={event.id}
                  className="bg-neutral-600 p-4 rounded-md border border-neutral-500"
                >
                  <h3 className="text-lg font-semibold text-neutral-100">
                    {event.title}
                  </h3>
                  <p className="text-sm text-neutral-200">
                    {event.displayDate}
                  </p>
                </li>
              ))}
            </ul>
          </>
          {happeningNowEvents.length > 0 && (
            <div className="border-t border-neutral-500 my-4" />
          )}
          <>
            <div className="mb-2 text-amber-400 font-semibold text-sm uppercase tracking-wide">
              Happening Soon&nbsp;
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

          {soonEvents.length > 0 && futureEvents.length > 0 && (
            <div className="border-t border-neutral-500 my-4" />
          )}
          {futureEvents.length > 0 && (
            <>
              <div className="mb-2 text-red-400 font-semibold text-sm uppercase tracking-wide">
                Future Events&nbsp;
                <span className="text-neutral-400 text-xs font-normal normal-case">
                  (subject to change, details hidden for privacy purposes)
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
