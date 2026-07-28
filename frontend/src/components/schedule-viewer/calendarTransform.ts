import { addDays, setHours, setMinutes, startOfWeek } from "date-fns";

import { getCourseKey } from "./courseColors";
import type { Course } from "./types";

// SFU course outline API day abbreviations -> JS Date.getDay() weekday index.
const DAY_ABBREVIATION_TO_WEEKDAY: Record<string, number> = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};

export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: {
    courseKey: string;
    section: string;
    sectionCode: string;
    campus: string;
    roomCode?: string;
  };
};

export function parseDaysString(days: string): string[] {
  return days
    .split(",")
    .map((day) => day.trim())
    .filter((day) => day.length > 0);
}

export function resolveWeekdayDate(weekdayIndex: number, referenceDate: Date): Date {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 });
  return addDays(weekStart, weekdayIndex);
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return setMinutes(setHours(date, hours), minutes);
}

export function courseToEvents(course: Course, referenceDate: Date): CalendarEvent[] {
  const courseKey = getCourseKey(course);
  const events: CalendarEvent[] = [];

  for (const item of course.schedule) {
    const dayAbbreviations = parseDaysString(item.days);

    for (const dayAbbreviation of dayAbbreviations) {
      const weekdayIndex = DAY_ABBREVIATION_TO_WEEKDAY[dayAbbreviation];

      if (weekdayIndex === undefined) {
        continue;
      }

      const dayDate = resolveWeekdayDate(weekdayIndex, referenceDate);

      events.push({
        title: courseKey,
        start: combineDateAndTime(dayDate, item.startTime),
        end: combineDateAndTime(dayDate, item.endTime),
        resource: {
          courseKey,
          section: course.section,
          sectionCode: item.sectionCode,
          campus: item.campus,
          roomCode: item.roomCode,
        },
      });
    }
  }

  return events;
}

export function coursesToEvents(courses: Course[], referenceDate: Date): CalendarEvent[] {
  return courses.flatMap((course) => courseToEvents(course, referenceDate));
}