type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

type TimeRange = {
  start: string;
  end: string;
};

type WeeklySchedule = Partial<Record<Day, TimeRange[]>>;

const days: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SLOTS_PER_DAY = 48;
const SLOTS_PER_WEEK = 336;

function timeToSlot(time: string): number {
  const parts = time.split(":");

  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    ![0, 30].includes(minutes)
  ) {
    throw new Error(`Invalid time: ${time}`);
  }

  return hours * 2 + minutes / 30;
}

function createCampusSchedule(schedule: WeeklySchedule): string {
  const slots = Array<string>(SLOTS_PER_WEEK).fill("0");

  for (const day of days) {
    const ranges = schedule[day];

    if (!ranges) {
      continue;
    }

    const dayIndex = days.indexOf(day);

    for (const range of ranges) {
      const startSlot = timeToSlot(range.start);
      const endSlot = timeToSlot(range.end);

      if (endSlot <= startSlot) {
        throw new Error(
          `End time must be after start time: ${range.start}-${range.end}`,
        );
      }

      for (let slot = startSlot; slot < endSlot; slot++) {
        const weeklyIndex = dayIndex * SLOTS_PER_DAY + slot;
        slots[weeklyIndex] = "1";
      }
    }
  }

  return slots.join("");
}

export const mockCampusSchedules: string[] = [
    createCampusSchedule({
      Monday: [{ start: "09:00", end: "13:00" }],
      Wednesday: [{ start: "09:00", end: "13:00" }],
      Friday: [{ start: "10:00", end: "12:00" }],
    }),
  
    createCampusSchedule({
      Tuesday: [{ start: "12:30", end: "17:30" }],
      Thursday: [{ start: "12:30", end: "17:30" }],
    }),
  
    createCampusSchedule({
      Monday: [{ start: "10:30", end: "14:30" }],
      Tuesday: [{ start: "09:30", end: "11:30" }],
      Wednesday: [{ start: "10:30", end: "14:30" }],
      Thursday: [{ start: "09:30", end: "11:30" }],
    }),
  
    createCampusSchedule({
      Monday: [{ start: "17:30", end: "21:30" }],
      Wednesday: [{ start: "17:30", end: "21:30" }],
      Thursday: [{ start: "18:30", end: "20:30" }],
    }),
  
    createCampusSchedule({
      Monday: [{ start: "08:30", end: "17:00" }],
      Wednesday: [{ start: "08:30", end: "17:00" }],
    }),
  
    createCampusSchedule({
      Tuesday: [{ start: "11:30", end: "15:30" }],
      Wednesday: [{ start: "13:30", end: "16:30" }],
      Thursday: [{ start: "11:30", end: "15:30" }],
      Friday: [{ start: "09:30", end: "12:30" }],
    }),
  
    createCampusSchedule({
      Monday: [
        { start: "08:30", end: "10:30" },
        { start: "14:30", end: "17:30" },
      ],
      Thursday: [
        { start: "09:30", end: "12:30" },
        { start: "15:30", end: "18:30" },
      ],
    }),
  
    createCampusSchedule({
      Monday: [{ start: "13:00", end: "16:00" }],
      Tuesday: [{ start: "14:00", end: "18:00" }],
      Wednesday: [{ start: "13:00", end: "16:00" }],
      Friday: [{ start: "12:00", end: "15:00" }],
    }),
  
    createCampusSchedule({
      Monday: [{ start: "10:00", end: "12:00" }],
      Tuesday: [{ start: "10:00", end: "13:00" }],
      Wednesday: [{ start: "10:00", end: "12:00" }],
      Thursday: [{ start: "10:00", end: "13:00" }],
      Friday: [{ start: "09:00", end: "11:00" }],
    }),
  
    createCampusSchedule({
      Tuesday: [{ start: "16:00", end: "20:00" }],
      Thursday: [{ start: "16:00", end: "20:00" }],
      Saturday: [{ start: "10:00", end: "15:00" }],
    }),
  
    // Schedule 11
    createCampusSchedule({
      Monday: [{ start: "07:30", end: "10:00" }],
      Tuesday: [{ start: "13:30", end: "16:00" }],
      Friday: [{ start: "15:00", end: "18:00" }],
    }),
  
    // Schedule 12
    createCampusSchedule({
      Monday: [{ start: "11:00", end: "14:00" }],
      Wednesday: [{ start: "15:00", end: "18:30" }],
      Thursday: [{ start: "08:00", end: "11:00" }],
    }),
  
    // Schedule 13
    createCampusSchedule({
      Tuesday: [
        { start: "08:30", end: "10:00" },
        { start: "17:00", end: "19:30" },
      ],
      Friday: [
        { start: "11:30", end: "13:30" },
        { start: "16:00", end: "18:00" },
      ],
    }),
  
    // Schedule 14
    createCampusSchedule({
      Monday: [{ start: "12:00", end: "15:30" }],
      Wednesday: [{ start: "12:00", end: "15:30" }],
      Saturday: [{ start: "09:00", end: "12:00" }],
    }),
  
    // Schedule 15
    createCampusSchedule({
      Tuesday: [{ start: "07:30", end: "12:00" }],
      Thursday: [{ start: "07:30", end: "12:00" }],
      Friday: [{ start: "13:00", end: "16:30" }],
    }),
  
    // Schedule 16
    createCampusSchedule({
      Monday: [{ start: "16:30", end: "19:00" }],
      Tuesday: [{ start: "18:00", end: "21:00" }],
      Wednesday: [{ start: "16:30", end: "19:00" }],
      Thursday: [{ start: "18:00", end: "21:00" }],
    }),
  
    // Schedule 17
    createCampusSchedule({
      Wednesday: [
        { start: "08:00", end: "11:00" },
        { start: "14:00", end: "17:00" },
      ],
      Friday: [{ start: "08:30", end: "14:00" }],
    }),
  
    // Schedule 18
    createCampusSchedule({
      Monday: [{ start: "09:30", end: "11:00" }],
      Tuesday: [{ start: "13:00", end: "15:00" }],
      Thursday: [{ start: "14:30", end: "17:00" }],
      Sunday: [{ start: "10:00", end: "13:00" }],
    }),
  
    // Schedule 19
    createCampusSchedule({
      Monday: [{ start: "07:00", end: "09:00" }],
      Wednesday: [{ start: "07:00", end: "09:00" }],
      Thursday: [{ start: "12:00", end: "16:00" }],
      Friday: [{ start: "17:30", end: "20:30" }],
    }),
  
    // Schedule 20
    createCampusSchedule({
      Tuesday: [{ start: "10:30", end: "14:00" }],
      Wednesday: [{ start: "18:30", end: "22:00" }],
      Thursday: [{ start: "10:30", end: "14:00" }],
      Saturday: [{ start: "13:00", end: "17:30" }],
    }),
  ];

export function getRandomCampusSchedule() : string{
  if (mockCampusSchedules.length === 0) {
    throw new Error("No mock campus schedules are available.");
  }

  const randomIndex = Math.floor(
    Math.random() * mockCampusSchedules.length,
  );

  const schedule = mockCampusSchedules[randomIndex];

  if (schedule === undefined) {
    throw new Error("Failed to select a mock campus schedule.");
  }

  return schedule;
}

export function printCampusScheduleGrid(schedule: string): void {
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const SLOTS_PER_DAY = 48;
    const EXPECTED_LENGTH = DAYS.length * SLOTS_PER_DAY;
  
    if (schedule.length !== EXPECTED_LENGTH) {
      throw new Error(
        `Expected a ${EXPECTED_LENGTH}-character schedule, but received ${schedule.length}.`,
      );
    }
  
    console.log(`Time     | ${DAYS.join(" | ")}`);
    console.log("-".repeat(48));
  
    for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
      const time = slotToTime(slot);
  
      const values = DAYS.map((_, dayIndex) => {
        const scheduleIndex = dayIndex * SLOTS_PER_DAY + slot;
        return schedule[scheduleIndex];
      });
  
      console.log(`${time.padEnd(8)} | ${values.join("   | ")}`);
    }
}
  
function slotToTime(slot: number): string {
    const totalMinutes = slot * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
}
