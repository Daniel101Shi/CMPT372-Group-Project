export type ScheduleItem = {
  startTime: string;
  endTime: string;
  days: string;
  sectionCode: string;
  campus: string;
  roomCode?: string;
};

export type Course = {
  department: string;
  courseNumber: string;
  section: string;
  title: string | null;
  schedule: ScheduleItem[];
};