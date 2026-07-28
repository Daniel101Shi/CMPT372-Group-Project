import type { Course } from "./types";

// Fixed-order categorical palette (light, contrasted, colorblind-safe hues).
// Assign in this order only - never re-sort or cycle arbitrarily.
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
];

export function getCourseKey(course: Course): string {
  return `${course.department} ${course.courseNumber}`;
}

export function buildCourseColorMap(courses: Course[]): Map<string, string> {
  const colorMap = new Map<string, string>();

  for (const course of courses) {
    const key = getCourseKey(course);

    if (!colorMap.has(key)) {
      const slot = colorMap.size % CATEGORICAL_PALETTE.length;
      colorMap.set(key, CATEGORICAL_PALETTE[slot]);
    }
  }

  return colorMap;
}