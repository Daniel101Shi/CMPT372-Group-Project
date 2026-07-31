// demo data for marking + poking at things locally.
//   npm run seed        (from ./backend)
// re-running is fine, it wipes these four accounts first and the cascades handle the rest.
// anything you made by hand is left alone.
import bcrypt from "bcrypt";

import { pool } from "./db/db.js";

const PASSWORD = "password123";
const SEMESTER = "fall";
const YEAR = 2026;

const USERS = [
  { username: "admin", contact: "admin@sfu.ca", role: "admin" },
  { username: "daniel", contact: "daniel@sfu.ca", role: "user" },
  { username: "priya", contact: "priya@sfu.ca", role: "user" },
  { username: "marcus", contact: "marcus@sfu.ca", role: "user" },
  { username: "ellie", contact: "ellie@sfu.ca", role: "user" },
];

// deliberately overlapping so the pack heatmap has something to show.
// these are all actually offered in fall 2026, otherwise the sfu api gives back nothing and
// the calendar renders an empty week. if you change the term above check them against
// https://www.sfu.ca/bin/wcm/course-outlines?2026/fall/cmpt first.
const COURSES: Record<string, string[][]> = {
  daniel: [["CMPT", "354", "D100"], ["CMPT", "276", "D100"], ["MACM", "201", "D100"]],
  priya: [["CMPT", "354", "D100"], ["CMPT", "225", "D100"]],
  marcus: [["CMPT", "276", "D100"], ["STAT", "270", "D100"]],
  ellie: [["CMPT", "354", "D100"], ["CMPT", "213", "D100"], ["MACM", "201", "D100"]],
};

const ids: Record<string, number> = {};

// 336 chars, day major (day * 48 + slot) which is what PackSchedule reads.
// weekday mornings free, shifted a bit per user so the heatmap isn't a flat colour.
function mornings(offset: number) {
  const slots = Array.from({ length: 7 * 48 }, () => "0");
  for (const day of [0, 1, 2, 3, 4]) {
    for (let slot = 16 + offset; slot < 24 + offset; slot++) {
      slots[day * 48 + slot] = "1";
    }
  }
  return slots.join("");
}

async function addUsers() {
  // cascades take their friendships, packs and course collections with them
  await pool.query(`DELETE FROM users WHERE username = ANY($1)`, [USERS.map((u) => u.username)]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const [i, user] of USERS.entries()) {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, contact_info, campus_schedule, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id`,
      [user.username, passwordHash, user.contact, mornings(i * 2), user.role],
    );
    ids[user.username] = rows[0].user_id;
  }

  console.log("Users added.");
}

async function addFriendships() {
  // one of each state the dashboard shows. order matters here, user_id_1 asked user_id_2.
  await pool.query(
    `INSERT INTO friendships (user_id_1, user_id_2, pending) VALUES
       ($1, $2, FALSE),
       ($1, $5, FALSE),
       ($3, $1, TRUE),
       ($1, $4, TRUE)`,
    [ids.daniel, ids.priya, ids.marcus, ids.admin, ids.ellie],
  );

  console.log("Friendships added.");
}

async function addCourses(userId: number, semester: string, year: number, courses: string[][]) {
  await pool.query(`INSERT INTO course_collections (user_id, semester, year) VALUES ($1, $2, $3)`, [
    userId,
    semester,
    year,
  ]);

  for (const [department, courseNumber, section] of courses) {
    const { rows } = await pool.query(
      `INSERT INTO saved_courses (department, course_number, section)
       VALUES ($1, $2, $3)
       ON CONFLICT (department, course_number, section) DO UPDATE SET department = EXCLUDED.department
       RETURNING course_id`,
      [department, courseNumber, section],
    );

    await pool.query(
      `INSERT INTO course_collection_items (user_id, semester, year, course_id) VALUES ($1, $2, $3, $4)`,
      [userId, semester, year, rows[0].course_id],
    );
  }

  console.log("Courses added.");
}

async function addPack() {
  // heads up: packs only show up for whoever made them, so this is daniel's alone
  const { rows } = await pool.query(
    `INSERT INTO packs (owner_id, group_name, semester, year) VALUES ($1, $2, $3, $4) RETURNING pack_id`,
    [ids.daniel, "Study Crew", SEMESTER, YEAR],
  );

  await pool.query(
    `INSERT INTO pack_members (pack_id, user_id) VALUES ($1, $2), ($1, $3), ($1, $4)`,
    [rows[0].pack_id, ids.priya, ids.ellie, ids.marcus],
  );

  console.log("Pack added.");
}

await addUsers();
await addFriendships();
for (const [username, courses] of Object.entries(COURSES)) {
  await addCourses(ids[username] as number, SEMESTER, YEAR, courses);
}
await addPack();

console.log(`\nEvery account uses the password: ${PASSWORD}`);
console.table(USERS.map((u) => ({ username: u.username, role: u.role, user_id: ids[u.username] })));

await pool.end();
