import type { PoolClient } from "pg";
  
// queries
const checked_insert_into_course_collections = `
INSERT INTO course_collections (user_id, semester, year)
SELECT $1, $2::VARCHAR, $3
WHERE 0 = (
    SELECT COUNT(user_id)
    FROM course_collections
    WHERE user_id = $1 AND semester = $2 AND year = $3
)`

const checked_insert_into_saved_courses = `
INSERT INTO saved_courses (department, course_number, section)
SELECT $1::VARCHAR, $2::VARCHAR, $3::VARCHAR
WHERE 0 = (
    SELECT COUNT(course_id)
    FROM saved_courses
    WHERE department = $1 AND course_number = $2 AND section = $3
)`

const fetch_course_id = `
SELECT course_id
FROM saved_courses
WHERE department = $1 AND course_number = $2 AND section = $3
`

const clear_course_collection_items = `
DELETE FROM course_collection_items
WHERE user_id = $1 AND semester = $2 AND year = $3
`

const insert_into_course_collection_items = `
INSERT INTO course_collection_items (user_id, semester, year, course_id)
VALUES ($1, $2, $3, $4)
`

const update_availability = `
UPDATE users
SET campus_schedule = $2
WHERE user_id = $1
`

const show_taken = `
SELECT department, course_number, section
FROM course_collection_items JOIN saved_courses
ON course_collection_items.course_id = saved_courses.course_id
WHERE user_id = $1 AND year = $2 AND semester = $3
`

const show_availability = `
SELECT campus_schedule
FROM users
WHERE user_id = $1
`
//

export const schedule_db_surface = {
  fetch_schedule: async (
    {user_id, int_year, semester, me}:
    {user_id: number, int_year: number, semester: string, me: PoolClient}
  ): Promise<{taken: {department: string, course_number: string, section: string}[], campus_schedule: string}> => {
    return {
      taken: (await me.query(show_taken, [user_id, int_year, semester])).rows,
      campus_schedule: (await me.query(show_availability, [user_id])).rows[0].campus_schedule
    }
  },

  saved_courses_checked_insert: async (
    {department, course_number, section, me}:
    {department: string, course_number: string, section: string, me: PoolClient}
  ): Promise<{course_id: number}> => {
    // if not exists add this course to saved courses
    await me.query(checked_insert_into_saved_courses, [department, course_number, section])
    // supply its course_id from db
    return {course_id: (await me.query(fetch_course_id, [department, course_number, section])).rows[0].course_id}
  },

  set_course_schedule: async (
  {course_ids, user_id, int_year, semester, me}:
  {course_ids: number[], user_id: number, int_year: number, semester: string, me: PoolClient}  
  ): Promise<void> => {
    // create an entry in the course_collections table signifying user X has a schedule for semester S and year Y
    await me.query(checked_insert_into_course_collections, [user_id, semester, int_year])
    // clear current db copy of schedule
    await me.query(clear_course_collection_items, [user_id, semester, int_year])
    // populate with new schedule
    for (let course_id of course_ids) { // save new schedule to db
      await me.query(insert_into_course_collection_items, [user_id, semester, int_year, course_id]) 
    }
  },

  set_availability: async (
    {user_id, int_year, semester, availability, me}:
    {user_id: number, int_year: number, semester: string, availability: string, me: PoolClient}
  ): Promise<void> => {
    // update availability
    await me.query(update_availability, [user_id, availability])
  }
}