import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { coursesToEvents } from "./calendarTransform";
import type { CalendarEvent } from "./calendarTransform";
import type { Course } from "./types";


// used AI for matching CSS with the home screen
// used AI for make calendar looks like a calendar with colored events.


const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// date don't matter
const MIN_TIME = new Date(1970, 0, 1, 8, 0, 0);
const MAX_TIME = new Date(1970, 0, 1, 19, 0, 0);

// hides the today-column highlight and the live current-time indicator line,
const HIDE_TODAY_AND_NOW_CSS = `
  .schedule-calendar .rbc-today { background-color: inherit; }
  .schedule-calendar .rbc-current-time-indicator { display: none; }
`;

type CalendarViewProps = {
  courses: Course[];
  colorMap: Map<string, string>;
};

export const CalendarView: React.FC<CalendarViewProps> = ({ courses, colorMap }) => {
  const referenceDate = useMemo(() => new Date(), []);
  const events = useMemo(
    () => coursesToEvents(courses, referenceDate),
    [courses, referenceDate],
  );

  return (
    <div className="schedule-calendar" style={{ height: "100%" }}>
      <style>{HIDE_TODAY_AND_NOW_CSS}</style>

      <Calendar<CalendarEvent>
        localizer={localizer}
        events={events}
        defaultView={Views.WORK_WEEK}
        views={[Views.WORK_WEEK]}
        toolbar={false}
        min={MIN_TIME}
        max={MAX_TIME}
        formats={{ dayFormat: "EEEE" }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: colorMap.get(event.resource.courseKey),
            color: "#0b0b0b",
          },
        })}
      />
    </div>
  );
};