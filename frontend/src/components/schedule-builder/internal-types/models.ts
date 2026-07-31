export interface YearsDat {
    data: string[],
    isloading: boolean
    selected: {year: string},
    selected_setter: ({year}: {year: string}) => void
}

export interface SemsDat {
    data: string[],
    isloading: boolean,
    selected: {semester: string},
    selected_setter: ({semester}: {semester: string}) => void
}

export interface deptCourses {
    department: string,
    courses: {
        course_number: string,
        course_title: string
    }[]   
}

export interface CoursesDat {
    data: deptCourses[],
    isloading: boolean
}

export interface courseOfferings {
    classes: {
        lecs: string[],
        labs: string[],
        tuts: string[],
        sems: string[]
    }
}

export interface SelectedDat {
    selected: {
        department: string,
        course_number: string,
        course_title: string,
    }[]
    add_course: ({department, course_number, course_title}: {department: string, course_number: string, course_title: string}) => void,
    remove_course: ({department, course_number, course_title}: {department: string, course_number: string, course_title: string}) => void,
    clear: () => void,
    loading: boolean,
    offerings: courseOfferings[][],
    selected_offerings: {associated: number | null, lec: string | null, tut: string | null, lab: string | null, sem: string | null}[],
    selected_offerings_setter: 
        (value: React.SetStateAction<{
            associated: number | null;
            lec: string | null;
            tut: string | null;
            lab: string | null;
            sem: string | null;
        }[]>) => void
}

export interface CurrentDat {
  isloading: boolean,
  taking: {department: string, course_number: string, section: string }[],
  campus_schedule: string,
  update_current_courses: ({courses}: 
    {
      courses: {department: string, course_number: string, section: string}[],
    }
  ) => void,
  update_current_availability: ({availability}: 
    {
      availability: string
    }
  ) => void
}