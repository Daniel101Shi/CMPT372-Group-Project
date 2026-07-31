import { createContext, useContext, useEffect, useState } from "react";
import type { CurrentDat } from '../internal-types/models'
import { useYearsContext } from "../SFUCoursesAPISurface/yearsContext";
import { useSemestersContext } from "../SFUCoursesAPISurface/semestersContext";

interface apiResult {
  taking: { department: string, course_number: string, section: string }[]
  campus_schedule: string
}

function sleep(ms: number) { return (new Promise(resolve => setTimeout(resolve, ms))); }

let CurrentScheduleContext = createContext<null | CurrentDat>(null)

export function CurrentScheduleContextProvider({ children }: { children: React.ReactNode }) {
  let year_interface = useYearsContext();
  let semesters_interface = useSemestersContext();
  let [course_schedule, course_schedule_setter] = useState<{department: string, course_number: string, section: string}[]>([])
  let [campus_schedule, campus_schedule_setter] = useState<string>('')
  let [isloading, load_state_setter] = useState(true);

  async function handle_get({year, semester}: {year: string, semester: string}) {
    const origin = new URL(window.location.href).origin
    const res = await fetch(`${origin}/api/schedule/${year}/${semester}`, {
      method: "GET",
      credentials: "include",
    })
    const json: apiResult = await res.json()
    return json
  }

  async function handle_post({courses, availability}: {courses: {department: string, course_number: string, section: string}[], availability: string}) {
    const origin = new URL(window.location.href).origin
    const res = await fetch(`${origin}/api/schedule/${year_interface.selected.year}/${semesters_interface.selected.semester}`, {
      method: "POST",
      credentials: "include",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(
        {
          courses: courses,
          availability: availability
        }
      )})
      const json: apiResult = await res.json()
      return json
  }

  async function update_current_courses({courses}: {courses: {department: string, course_number: string, section: string}[]}) {
    if (isloading) {return}
    load_state_setter(true)
    let new_data = await handle_post({courses, availability: campus_schedule})
    course_schedule_setter(new_data.taking ?? [])
    load_state_setter(false)
  }

  async function update_current_availability({availability}: {availability: string}) {
    if (isloading) {return}
    load_state_setter(true)
    let new_data = await handle_post({courses: course_schedule, availability})
    campus_schedule_setter(new_data.campus_schedule)
    load_state_setter(false)
  }

  useEffect(() => {
    async function intitialise() {
      load_state_setter(true)
      if (year_interface.selected.year.length == 0 || semesters_interface.selected.semester.length == 0) {return}
      while (1) {
        try {
          let init_data = await handle_get({year: year_interface.selected.year, semester: semesters_interface.selected.semester})
          course_schedule_setter(init_data.taking)
          campus_schedule_setter(init_data.campus_schedule)
          break;
        } catch (e) {
          console.log(`failed to fetch current: ${e}`);
          await sleep(5000);
        }
      }
      load_state_setter(false);
    }
    intitialise();
  }, [year_interface.selected, semesters_interface.selected]) // years will update only on mount

  return (
    <CurrentScheduleContext.Provider value={{isloading, taking: course_schedule, campus_schedule: campus_schedule, update_current_courses, update_current_availability }}>
      {children}
    </CurrentScheduleContext.Provider>
  );
}

export function useCurrentScheduleContext(): CurrentDat {
  let x = useContext(CurrentScheduleContext);
  if (x === null) { throw new Error('useCurrentScheduleContext outside of a provider') }
  return x
}