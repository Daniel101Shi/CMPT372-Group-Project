import { pool } from "./db/db.js";

// await pool.query(`INSERT INTO users (username, password_hash) VALUES ($1, $2)`, [
//   "testuser",
//   "testpass",
// ]);
// console.log("User added.");

async function addCourses() {
  const userId = 1;
  const semester = "summer";
  const year = 2026;
  const courses = [
    ["CMPT", "120", "D100"],
    ["CMPT", "225", "D100"],
  ];

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

await addCourses();
await pool.end();
