import type { Request, Response } from "express";
import { schedule_db_surface } from "../db/schedule_db_surface.js";

import { pool } from "../db/db.js";

// for request validation
class BadInputError extends Error {
  constructor(msg: string, public field?: string) {
    super(msg);
    this.name = 'BadInputError';
    Object.setPrototypeOf(this, BadInputError.prototype);
  }
}
function isBadInputError(error: unknown): error is BadInputError {
  return error instanceof BadInputError;
}
//

export async function fetch_schedule(req: Request, res: Response) {
  const me = await pool.connect()
  try {
    if (req.session.userId === undefined) { throw new BadInputError('unauthorised') }
    let user_id = Number(req.session.userId)
    let str_year = String(req.params.year)
    let int_year = Number(str_year)
    let semester = String(req.params.semester)

    // checks
    // assert that the session userID is the userID of the signed in user
    if (req.session.userId === undefined) { throw new BadInputError('unauthorised') }
    if (!/^\d+$/.test(str_year)) { throw new BadInputError(`invalid year: ${str_year}`) }
    if (semester != 'fall' && semester != 'summer' && semester != 'spring') { throw new BadInputError(`invalid semester: ${semester}`) }

    // read
    const {taken, campus_schedule} = await schedule_db_surface.fetch_schedule({user_id, int_year, semester, me})

    // share
    return res.status(200).json({ taking: taken, campus_schedule: campus_schedule })
  } catch (e) {
    if (isBadInputError(e)) {
      return res.status(400).json({ message: e.message })
    } else {
      console.log(e)
      return res.status(500).json({ message: 'failed' })
    }
  } finally {
    me.release()
  }
}

export async function upload_schedule(req: Request, res: Response) {
  const me = await pool.connect()
  try {
    await me.query('BEGIN TRANSACTION')
    let user_id = Number(req.session.userId)
    let str_year = String(req.params.year)
    let int_year = Number(str_year)
    let semester = String(req.params.semester).toLowerCase()
    let courses: { department: string, course_number: string, section: string }[] = req.body.courses ?? []
    let availability: string = String(req.body.availability)
    // checks
    // assert that the session userID is the userID of the signed in user to prevent editing cookies allowing you to set anyones schedule
    if (req.session.userId === undefined) { throw new BadInputError('unauthorised') }
    if (!/^\d+$/.test(str_year)) { throw new BadInputError(`invalid year: ${str_year}`) }
    if (semester != 'fall' && semester != 'summer' && semester != 'spring') { throw new BadInputError(`invalid semester: ${semester}`) }
    if (availability.length != 7 * 48) { throw new BadInputError(`availability must be 336 = 7 * 48 characters`) }
    if (!/^[01]+$/.test(availability)) { throw new BadInputError(`availability must be only '0's and '1's`) }
    
    courses.forEach(x => {
      if (x.department.length > 10) { throw new BadInputError(`department: ${x.department}, data to big to fit in schema`) }
      if (x.course_number.length > 10) { throw new BadInputError(`course number: ${x.course_number}, data to big to fit in schema`) }
      if (x.section.length > 10) { throw new BadInputError(`section: ${x.section}, data to big to fit in schema`) }
    })

    // create an entry in the saved_courses table for any new_course
    // get the id of each passed course (get course_id_i for each course_i of request) 
    let course_ids: number[] = []
    for (let x of courses) {
      let clean_x = {
        department: x.department.trim().toUpperCase(),
        course_number: x.course_number.trim().toUpperCase(),
        section: x.section.trim().toUpperCase()} 
      let {course_id} = await schedule_db_surface.saved_courses_checked_insert({...clean_x, me}) // my brain only now has made the connection that i could use the spread operator like this
      course_ids.push(course_id)
    }

    // mutate db state
    await schedule_db_surface.set_course_schedule({course_ids, user_id, int_year, semester, me})
    await schedule_db_surface.set_availability({availability, user_id, int_year, semester, me})

    // yippee
    await me.query('COMMIT TRANSACTION')

    // read
    const {taken, campus_schedule} = await schedule_db_surface.fetch_schedule({user_id, int_year, semester, me})

    // share
    return res.status(201).json({ taking: taken, campus_schedule: campus_schedule })
  } catch (e) {
    await me.query('ROLLBACK TRANSACTION')
    if (isBadInputError(e)) {
      return res.status(400).json({ message: e.message })
    } else {
      console.log(e)
      return res.status(500).json({ message: 'failed' })
    }
  } finally {
    me.release()
  }
}