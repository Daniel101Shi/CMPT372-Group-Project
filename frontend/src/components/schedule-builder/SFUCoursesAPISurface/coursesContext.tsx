import { createContext, useContext, useEffect, useState } from "react";
import type {CoursesDat} from '../internal-types/models' 
import { useSemestersContext } from "./semestersContext";
import { useYearsContext } from "./yearsContext";

interface apiResult1 {
    text:string,
    value:string,
    name:string
}

interface apiResult2 {
    text:string,
    value:string,
    title:string
}

function sleep(ms: number) { return (new Promise(resolve => setTimeout(resolve, ms))); }

let CoursesContext = createContext<CoursesDat>({data: [], isloading: false});

export function CoursesContextProvider({ children }: { children: React.ReactNode }) {
    let semester_interface = useSemestersContext();
    let year_interface = useYearsContext();
    let [courses, courses_setter] = useState<{department: string, courses: {course_number: string, course_title: string}[]}[]>([]);
    let [loading, load_state_setter] = useState(true);

    async function fetch_depts(year: string, semester: string): Promise<string[]> {
        if (year.length == 0 || semester.length == 0) {return []}
        let endpoint = `http://www.sfu.ca/bin/wcm/course-outlines?${year}/${semester}`
        const res = await fetch(endpoint, {
            method: "GET",
        });
        if (!res.ok) {
            return []
        }
        const json: apiResult1[] = await res.json();
        const res_depts = json.map(x => (x.value))
        return res_depts
    }

    // WHEN A DEPARTMENT HAS NO OFFERINGS BUT STILL HAS COURSE LISTINGS FOR SOME SEMESTER THIS WILL 404 EXPECTEDLY
    // where a department has courses in the course calander for some year and semester but no offerings for those courses
    // that department, x, will be returned by {year}/{semester}
    // but {year}/{semester}/x will result in a 404
    // see 2025/summer and 2025/summer/punj
    async function fetch_dept_courses(deptartment: string, year: string, semester: string): Promise<{department: string, courses: {course_number: string, course_title: string}[]}> {
        if (year.length == 0 || semester.length == 0 || deptartment.length == 0) {return {department: "", courses: []}}
        let endpoint = `http://www.sfu.ca/bin/wcm/course-outlines?${year}/${semester}/${deptartment}`
        const res = await fetch(endpoint, {
            method: "GET",
        });
        if (!res.ok) {
            return {
                department: deptartment,
                courses: []
            }
        }
        const json: apiResult2[] = await res.json();
        const res_courses = json.map(x => ({course_number: x.value, course_title: x.title}))
        return {
            department: deptartment,
            courses: res_courses
        }
    }

    async function fetch_courses(depts: string[], year: string, semester: string): Promise<{department: string, courses: {course_number: string, course_title: string}[]}[]> {
        if (year.length == 0 || semester.length == 0 || depts.length == 0) {return []}
        const courses = await Promise.all(depts.map(x => fetch_dept_courses(x, year, semester)))
        return courses
    }

    useEffect(() => {
        async function intitialise() {
            load_state_setter(true)
            if (semester_interface.isloading || year_interface.isloading) {return}
            while (1) {
                try {
                    let depts = await fetch_depts(year_interface.selected.year, semester_interface.selected.semester)
                    let init_data = await fetch_courses(depts, year_interface.selected.year, semester_interface.selected.semester)
                    courses_setter(init_data);
                    break;
                } catch (e) {
                    console.log(`failed to fetch courses: ${e}`);
                    await sleep(5000);
                }
            }
            load_state_setter(false);
        }
        intitialise();
    }, [semester_interface.selected]) // courses will update whenever semester changes

    return (
        <CoursesContext.Provider value={{data: courses, isloading: loading}}>
            {children}
        </CoursesContext.Provider>
    );
}

export function useCoursesContext(): CoursesDat {
    return useContext(CoursesContext);
}