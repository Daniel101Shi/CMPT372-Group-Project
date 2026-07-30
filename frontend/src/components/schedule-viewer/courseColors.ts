import type { Course } from "./types";

// Fixed-order categorical palette (light, contrasted, colorblind-safe hues).
// Assign in this order only - never re-sort or cycle arbitrarily.

export const EVENT_COLOR = [
  "#5e9be6", // 1 blue
  "#e69576", // 2 orange
  "#5ecaa4", // 3 aqua
  "#d6b56f", // 4 yellow
  "#e795b5", // 5 magenta
  "#72d472", // 6 green
  "#614ed1", // 7 violet
  "#e45656", // 8 red
];

export function getCourseKey(course: Course): string {
  return `${course.department} ${course.courseNumber}`;
}

export function buildCourseColorMap(courses: Course[]): Map<string, string> {
  const colorMap = new Map<string, string>();

  for (const course of courses) {

    // make sure the multiple independent events of the same course have the same color
    const key = getCourseKey(course);

    if (!colorMap.has(key)) {
      const slot = colorMap.size % EVENT_COLOR.length;
      colorMap.set(key, EVENT_COLOR[slot]);
    }
  }
  // course key + color
  return colorMap;
}