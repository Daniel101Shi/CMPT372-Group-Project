import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRow, SavedCourseRow, CourseCollectionRow, CourseCollectionItemRow } from "../types/db_rows.js";
import express, { response } from "express";
import session from "express-session";
import { scheduleRoutes } from "../routes/scheduleRoutes.js";
import { schedule_db_surface } from "../db/schedule_db_surface.js";
import type { PoolClient } from "pg";

interface apiresult {
  taking: { department: string, course_number: string, section: string }[],
  campus_schedule: string
}

interface badapiresult {
  message?: string
}

function sorted_res(x: apiresult): apiresult {
  return {
    taking: x.taking.toSorted((a, b) => (a.department + a.course_number + a.section).localeCompare(b.department + b.course_number + b.section)),
    campus_schedule: x.campus_schedule
  }
}

const testApp = express();
const MYID = 2
testApp.use(express.json());

testApp.use(
  session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
  })
);

testApp.use((req, _res, next) => {
  req.session.userId = MYID;
  next();
});

testApp.use('/api', scheduleRoutes);

// pretend database to play with
const init_mock_course_collections: CourseCollectionRow[] = [
  {
    user_id: MYID,
    year: 2025,
    semester: 'fall'
  },
  {
    user_id: MYID,
    year: 2025,
    semester: 'summer'
  },
  {
    user_id: MYID,
    year: 2024,
    semester: 'summer'
  },
  {
    user_id: MYID,
    year: 2024,
    semester: 'spring'
  },
  {
    user_id: MYID + 1,
    year: 2025,
    semester: 'fall'
  },
  {
    user_id: MYID + 1,
    year: 2025,
    semester: 'summer'
  },
  {
    user_id: MYID - 1,
    year: 2024,
    semester: 'spring'
  },
];

const init_mock_saved_courses: SavedCourseRow[] = [
  {
    course_id: 1,
    department: 'CMPT',
    course_number: '120',
    section: 'D100'
  },
  {
    course_id: 2,
    department: 'CMPT',
    course_number: '372',
    section: 'D100'
  },
  {
    course_id: 3,
    department: 'MACM',
    course_number: '372',
    section: 'D100'
  },
  {
    course_id: 4,
    department: 'MACM',
    course_number: '372',
    section: 'T101'
  },
  {
    course_id: 5,
    department: 'HELL',
    course_number: '240', // MATH 240 ;-;
    section: 'D200'
  },
  {
    course_id: 6,
    department: 'HELL',
    course_number: '240',
    section: 'D201'
  },
  {
    course_id: 7,
    department: 'HELL',
    course_number: '240',
    section: 'T203',
  }
]

const init_mock_users: UserRow[] = [
  {
    user_id: MYID,
    username: "me",
    contact_info: "me@example.com",
    campus_schedule: "0".repeat(336),
    password_hash: "0".repeat(255),
    created_at: new Date().toISOString()
  },
  {
    user_id: MYID - 1,
    username: "not_me",
    contact_info: "not_me@example.com",
    campus_schedule: "0".repeat(336),
    password_hash: "0".repeat(255),
    created_at: new Date().toISOString()
  },
  {
    user_id: MYID + 1,
    username: "other_name",
    contact_info: "",
    campus_schedule: "0".repeat(336),
    password_hash: "0".repeat(255),
    created_at: new Date().toISOString()
  }
];

const init_mock_course_collection_items: CourseCollectionItemRow[] = [
  {
    user_id: MYID,
    year: 2025,
    semester: 'summer',
    course_id: 1
  },
  {
    user_id: MYID,
    year: 2025,
    semester: 'summer',
    course_id: 2
  },
  {
    user_id: MYID,
    year: 2025,
    semester: 'summer',
    course_id: 3
  },
  {
    user_id: MYID,
    year: 2025,
    semester: 'summer',
    course_id: 4
  },
  {
    user_id: MYID,
    year: 2025,
    semester: 'fall',
    course_id: 5
  },
  {
    user_id: MYID,
    year: 2025,
    semester: 'fall',
    course_id: 6
  },
  {
    user_id: MYID,
    year: 2025,
    semester: 'fall',
    course_id: 7
  },
  {
    user_id: MYID + 1,
    year: 2025,
    semester: 'summer',
    course_id: 5
  },
  {
    user_id: MYID + 1,
    year: 2025,
    semester: 'summer',
    course_id: 6
  },
  {
    user_id: MYID + 1,
    year: 2025,
    semester: 'summer',
    course_id: 7
  },
  {
    user_id: MYID - 1,
    year: 2024,
    semester: 'spring',
    course_id: 1
  }
]

const init_db = {
  users: init_mock_users,
  course_collections: init_mock_course_collections,
  course_collection_items: init_mock_course_collection_items,
  saved_courses: init_mock_saved_courses
}

//
let db: {
  users: UserRow[];
  course_collections: CourseCollectionRow[];
  course_collection_items: CourseCollectionItemRow[];
  saved_courses: SavedCourseRow[];
}

// the controller still grabs pool.connect() itself for the transaction, so this needs
// mocking too or the tests open a real db connection and 500 on any machine that can't
// reach ours. it only ever does BEGIN/COMMIT/ROLLBACK and release with the client.
vi.mock('../db/db.js', () => ({
  pool: {
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    }),
  },
}));

// MOCKS DATABASE SURFACE
// i needed to rewrite all my query logic for these, cringe.
vi.mock('../db/schedule_db_surface.js', () => ({
  schedule_db_surface: {
    fetch_schedule: vi.fn().mockImplementation(async (
      { user_id, int_year, semester, me }: { user_id: number, int_year: number, semester: string, me: PoolClient }): Promise<{ taken: { department: string, course_number: string, section: string }[], campus_schedule: string }> => {
      return {
        taken: db.course_collection_items
          .filter(x => x.user_id == user_id && x.semester == semester && x.year == int_year)
          .map(x => (db.saved_courses.filter(z => z.course_id == x.course_id)).at(0))
          .map(x => ({ department: x?.department ?? '', course_number: x?.course_number ?? '', section: x?.section ?? '' })),
        campus_schedule: db.users.filter(x => x.user_id == user_id).at(0)?.campus_schedule ?? ''
      }
    }),
    saved_courses_checked_insert: vi.fn().mockImplementation(async (
      { department, course_number, section, me }: { department: string, course_number: string, section: string, me: PoolClient }): Promise<{ course_id: number }> => {
      let temp = db.saved_courses.filter(x => x.department == department && x.course_number == course_number && x.section == section)
      let top = (db.saved_courses.at(-1)?.course_id ?? { department, course_number, section, course_id: 0 }.course_id) + 1
      if (temp.length == 0) { db.saved_courses.push({ department, course_number, section, course_id: top }) }
      return {
        course_id: temp.at(0)?.course_id ?? top
      }
    }),
    set_course_schedule: vi.fn().mockImplementation(async (
      { course_ids, user_id, int_year, semester, me }: { course_ids: number[], user_id: number, int_year: number, semester: string, me: PoolClient }): Promise<void> => {
      let temp = db.course_collections.filter(x => x.user_id == user_id && x.year == int_year && x.semester == semester)
      if (temp.length == 0) { db.course_collections.push({ user_id, year: int_year, semester }) }
      db.course_collection_items = db.course_collection_items.filter(x => !(x.user_id == user_id && x.year == int_year, x.semester == semester))
      for (let course_id of course_ids) {
        db.course_collection_items.push({ user_id, year: int_year, semester, course_id })
      }
      return
    }),
    set_availability: vi.fn().mockImplementation(async (
      { user_id, int_year, semester, availability, me }: { user_id: number, int_year: number, semester: string, availability: string, me: PoolClient }): Promise<void> => {
      db.users = db.users.filter(x => x.user_id == user_id).map(x => ({ ...x, campus_schedule: availability }))
      return
    },
    )
  }
}));

describe("schedule routes", () => {
  const base_url = '/api/schedule'
  beforeEach(() => {
      db = JSON.parse(JSON.stringify(init_db))
      vi.clearAllMocks();
    });

  describe("GET /api/schedule/:year/:semester", () => {
    
    it("fetches the signed in users schedule for the given semester,  does not mutate db", async () => {
      const res1 = await request(testApp).get(`${base_url}/2025/summer`)
      const res2 = await request(testApp).get(`${base_url}/2024/spring`)
      const res1_body: apiresult = res1.body
      const res2_body: apiresult = res2.body
      // well formatted request succeeds
      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)

      // touches db
      expect(schedule_db_surface.fetch_schedule).toHaveBeenCalledTimes(2)
      // does not mutate db
      expect(init_db).toEqual(db)
      // is correct
      expect(sorted_res(res1_body).taking).toEqual([
        {
          department: 'CMPT',
          course_number: '120',
          section: 'D100'
        },
        {
          department: 'CMPT',
          course_number: '372',
          section: 'D100'
        },
        {
          department: 'MACM',
          course_number: '372',
          section: 'D100'
        },
        {
          department: 'MACM',
          course_number: '372',
          section: 'T101'
        }].toSorted()
      )
      expect(sorted_res(res2_body).taking).toEqual([])
      expect(res1_body.campus_schedule).toEqual('0'.repeat(336))
      expect(res2_body.campus_schedule).toEqual('0'.repeat(336))
    });

    it("returns error response for invalid year or semester and provides a tailored error message", async () => {
      let bad_semester = 'winter'
      let bad_year1 = 'Nan'
      let bad_year2 = '-2026'

      const res1 = await request(testApp).get(`${base_url}/${bad_year1}/fall`)
      const res2 = await request(testApp).get(`${base_url}/${bad_year2}/fall`)
      const res3 = await request(testApp).get(`${base_url}/2025/${bad_semester}`)

      expect(res1.status).toBe(400)
      expect(res2.status).toBe(400)
      expect(res3.status).toBe(400)

      expect(res1.body).toEqual({ message: `invalid year: ${bad_year1}` })
      expect(res2.body).toEqual({ message: `invalid year: ${bad_year2}` })
      expect(res3.body).toEqual({ message: `invalid semester: ${bad_semester}` })
    })

    describe("Post /api/schedule/:year/:semester", () => {

      it("it returns the resulting schedule in the same structure as fetch", async () => {
        const courses_in = [{
          department: 'CMPT',
          course_number: '120',
          section: 'D100'
        },
        {
          department: 'CMPT',
          course_number: '372',
          section: 'D100'
        },
        {
          department: 'MACM',
          course_number: '372',
          section: 'D100'
        },
        {
          department: 'MACM',
          course_number: '372',
          section: 'T101'
        }]
        const availability_in = '01'.repeat(336 / 2)
        const post_res = await request(testApp).post(`${base_url}/2025/summer`).send({ courses: courses_in, availability: '0'.repeat(336) })
        const get_res = await request(testApp).get(`${base_url}/2025/summer`)
        expect(post_res.body).toEqual(get_res.body)
      })

      it("updates or creates the schedule and availability for the given year and semester", async () => {
        const schedule_in = {courses: [{
          department: 'CMPT',
          course_number: '120',
          section: 'D100'
        },
        {
          department: 'CMPT',
          course_number: '372',
          section: 'D100'
        },
        {
          department: 'MACM',
          course_number: '372',
          section: 'D100'
        },
        {
          department: 'MACM',
          course_number: '372',
          section: 'T101'
        },
        {
          department: 'HELL',
          course_number: '240', // MATH 240 ;-;
          section: 'D200'
        },
        {
          department: 'HELL',
          course_number: '240',
          section: 'D201'
        },
        {
          department: 'HELL',
          course_number: '240',
          section: 'T203',
        }],
        availability: '01'.repeat(336 / 2)
      }
      const creation_res = await request(testApp).post(`${base_url}/2020/summer`).send(schedule_in)
      const update_res = await request(testApp).post(`${base_url}/2025/summer`).send(schedule_in)
      
      expect(creation_res.status).toBe(201)
      expect(update_res.status).toBe(201)
      expect(creation_res.body).toEqual({taking: schedule_in.courses, campus_schedule: schedule_in.availability})
      expect(update_res.body).toEqual({taking: schedule_in.courses, campus_schedule: schedule_in.availability})
      })

      it("appends to saved_courses table every time it discovers a new course", async () => {
        const new_courses = [
          { department: 'NEW', course_number: 'NOVEL', section: 'SHINY' },
          {department: 'NEW', course_number: '101', section: 'D100' }
        ]
        const res = await request(testApp).post(`${base_url}/2023/fall`).send({ courses: new_courses, availability: '0'.repeat(336) })

        expect(res.status).toBe(201)
        expect(init_db.saved_courses).not.toEqual(db.saved_courses)
        expect(init_db.saved_courses.filter(x => x.department == 'NEW')).toEqual([])
        expect(db.saved_courses.filter(x => x.department == 'NEW').map(x => ({...x, course_id: undefined}))).toEqual(new_courses)
      })

      it("returns 400 error and error response for invalid year or semester and provides a tailored error message, does not mutate data", async () => {
      let schedule_in = {courses: [], availability: '0'.repeat(336)}
      let bad_semester = 'winter'
      let bad_year1 = 'Nan'
      let bad_year2 = '-2026'

      const res1 = await request(testApp).post(`${base_url}/${bad_year1}/fall`).send(schedule_in)
      const res2 = await request(testApp).post(`${base_url}/${bad_year2}/fall`).send(schedule_in)
      const res3 = await request(testApp).post(`${base_url}/2025/${bad_semester}`).send(schedule_in)

      expect(res1.status).toBe(400)
      expect(res2.status).toBe(400)
      expect(res3.status).toBe(400)

      expect(res1.body).toEqual({ message: `invalid year: ${bad_year1}` })
      expect(res2.body).toEqual({ message: `invalid year: ${bad_year2}` })
      expect(res3.body).toEqual({ message: `invalid semester: ${bad_semester}` })

      expect(db).toEqual(init_db)
    })

    it("returns 400 error with error message for ill formatted availability, does not mutate data", async () => {
      const bad_availability1 = '01'.repeat(335)
      const bad_availability2 = '123456789010'.repeat(336/12)
      const res1 = await request(testApp).post(`${base_url}/2025/summer`).send({availability: bad_availability1, courses: []})
      const res2 = await request(testApp).post(`${base_url}/2025/summer`).send({availability: bad_availability2, courses: []})

      expect(res1.status).toBe(400)
      expect(res2.status).toBe(400)

      expect(res1.body).toEqual({ message: `availability must be 336 = 7 * 48 characters` })
      expect(res2.body).toEqual({ message: `availability must be only '0's and '1's` })

      expect(db).toEqual(init_db)
    })
    })
  });
})