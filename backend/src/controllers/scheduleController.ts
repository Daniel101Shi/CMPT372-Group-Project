import type { Request, Response } from "express";

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

// queries
const insert_into_course_collections = `
INSERT INTO course_collections (user_id, semester, year)
SELECT $1, $2::VARCHAR, $3
WHERE 0 = (
    SELECT COUNT(user_id)
    FROM course_collections
    WHERE user_id = $1 AND semester = $2 AND year = $3
)`

const insert_into_saved_courses = `
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

export async function fetch_schedule(req: Request, res: Response) {
    const me = await pool.connect()
    try {
        let user_id = Number(req.session.userId)
        let str_year = String(req.params.year)
        let int_year = Number(str_year)
        let semester = String(req.params.semester)

        // checks
        // TODO assert that the session userID is the userID of the signed in user
        if (!/^\d+$/.test(str_year)) { throw new BadInputError(`invalid year: ${str_year}`) }
        if (semester != 'fall' && semester != 'summer' && semester != 'spring') { throw new BadInputError(`invalid semester: ${semester}`)}
        if (req.session.userId === undefined) { throw new BadInputError('request missing target user') }
        
        // read
        const taken = (await me.query(show_taken, [user_id, int_year, semester])).rows
        const campus_schedule = (await me.query(show_availability, [user_id])).rows[0]

        // share
        return res.status(200).json({taking: taken, campus_schedule: campus_schedule})
    } catch (e) {
        if (isBadInputError(e)) {
            return res.status(400).json({message: e.message})
        } else {
            return res.status(500).json({message: 'failed'})
        }
    } finally {
        me.release()
    }
}

// export async function upload_availability(req: Request, res: Response) {
//     const me = await pool.connect()
//     try {
//         await me.query('BEGIN TRANSACTION')
//         let user_id = Number(req.session.userId)
//         let availability = String(req.body)
//         // checks
//         // TODO assert that the session userID is the userID of the signed in user to prevent editing cookies allowing you to set anyones schedule
//         if (availability.length != 7 * 48) { throw new BadInputError(`availability must be 336 characters`) }
//         if (!/^[01]+$/.test(availability)) { throw new BadInputError(`availability must be a string of '0's and '1's`) }
//         if (req.session.userId === undefined) { throw new BadInputError('request missing target user') }

//         // update availability to provided
//         await me.query(update_availability, [user_id, availability])

//         // yippee
//         await me.query('COMMIT TRANSACTION')
        
//         return res.status(201).json({new_availability: availability})
//     } catch (e) {
//         await me.query('ROLLBACK TRANSACTION')
//         if (isBadInputError(e)) {
//             return res.status(400).json({message: e.message})
//         } else {
//             return res.status(500).json({message: 'failed'})
//         }
//     } finally {
//         me.release()
//     }
// }

export async function upload_schedule(req: Request, res: Response) {
    const me = await pool.connect()
    try{
        await me.query('BEGIN TRANSACTION')
        let user_id = Number(req.session.userId)
        let str_year = String(req.params.year)
        let int_year = Number(str_year)
        let semester = String(req.params.semester)
        let courses: {department: string, c_number: string, section: string}[] = req.body.courses
        let availability: string = req.body.availability
        // checks
        // TODO assert that the session userID is the userID of the signed in user to prevent editing cookies allowing you to set anyones schedule
        if (!/^\d+$/.test(str_year)) { throw new BadInputError(`invalid year: ${str_year}`) }
        if (semester != 'fall' && semester != 'summer' && semester != 'spring') { throw new BadInputError(`invalid semester: ${semester}`)}
        if (req.session.userId === undefined) { throw new BadInputError('request missing target user') }
        if (availability.length != 7 * 48) { throw new BadInputError(`availability must be 336 characters`) }
        courses.forEach(x => {
            if (x.department.length > 10) { throw new BadInputError(`department: ${x.department}, data to big to fit in schema`) }
            if (x.c_number.length > 10) { throw new BadInputError(`course number: ${x.c_number}, data to big to fit in schema`) }
            if (x.section.length > 10) { throw new BadInputError(`section: ${x.section}, data to big to fit in schema`) }
        })
        
        // create an entry in the course_collections table signifying user X has a schedule for semester S and year Y
        await me.query(insert_into_course_collections, [user_id, semester, int_year])

        // create an entry in the saved_courses table for any new_course
        // get the id of each passed course (get course_id_i for each course_i of request) 
        let course_ids = []
        for (let x of courses) {
            const get_course_id_args = [String(x.department.toUpperCase()), String(x.c_number.toUpperCase()), String(x.section.toUpperCase())]
            await me.query(insert_into_saved_courses, get_course_id_args)
            const my_course_id = await me.query(fetch_course_id, get_course_id_args)
            course_ids.push(my_course_id.rows[0])
        }

        // clear current db copy of schedule
        await me.query(clear_course_collection_items, [user_id, semester, int_year])
        // save new schedule to db
        for (let i of course_ids) {
            me.query(insert_into_course_collection_items, [user_id, semester, int_year, i.course_id])
        }

        // update availability
        await me.query(update_availability, [user_id, availability])

        // yippee
        await me.query('COMMIT TRANSACTION')

        const taken = (await me.query(show_taken, [user_id, int_year, semester])).rows
        const campus_schedule = (await me.query(show_availability, [user_id])).rows[0]

        return res.status(201).json({int_year, semester, taking: taken, campus_schedule: campus_schedule})
    } catch (e) {
        await me.query('ROLLBACK TRANSACTION')
        if (isBadInputError(e)) {
            return res.status(400).json({message: e.message})
        } else {
            return res.status(500).json({message: 'failed'})
        }
    } finally {
        console.log('hello')
        me.release()
    }
    
}