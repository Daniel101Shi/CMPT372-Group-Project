// used to reflect the data type of:
// (await pool.query('SELECT ... FROM {X}')).rows[{i}]
// for some (X, i)

import { type Role } from "./User.js";

export interface UserRow {
  user_id: number, // unique
  username: string, // upto 50 characters
  password_hash: string, // 255 bytes
  contact_info: string, // upto 50 characters, nullable
  campus_schedule: string, // 336 characters only '0' and '1's // suggested_change: should be stored in course_collection
  created_at: string // in the datetime string format, meaning it can be immediately passed to Date() to get a Date object
  role: Role // 'user' | 'admin', constrained by chk_valid_role
  // key: (user_id)
}

// what the admin user list returns. no password_hash, plus a couple of counts.
export interface AdminUserRow {
  user_id: number,
  username: string,
  contact_info: string | null,
  role: Role,
  created_at: string,
  pack_count: number,
  friend_count: number
}

export interface SavedCourseRow {
  course_id: number, // unique
  department: string, // upto 10 characters
  course_number: string, // upto 10 characters
  section: string // upto 10 characters
  // key (course_id)
  // (department, course_number, section) is unique
}

export interface CourseCollectionRow {
  user_id: number, // unique 
  semester: string // 'summer' | 'spring' | 'fall'
  year: number // e.g. 2026
  // key: (user_id, semester, year)
}

export interface CourseCollectionItemRow {
  user_id: number, // unique
  semester: string // 'summer' | 'spring' | 'fall'
  year: number // e.g. 2026
  course_id: number // used to join with saved_courses
  // key: (user_id, semester, year, course_id),
}