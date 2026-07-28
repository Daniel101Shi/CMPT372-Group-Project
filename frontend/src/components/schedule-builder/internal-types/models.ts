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
        c_number: string,
        c_title: string
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
        c_number: string,
        c_title: string,
    }[]
    add_course: ({department, c_number, c_title}: {department: string, c_number: string, c_title:string}) => void,
    remove_course: ({department, c_number, c_title}: {department: string, c_number: string, c_title:string}) => void,
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