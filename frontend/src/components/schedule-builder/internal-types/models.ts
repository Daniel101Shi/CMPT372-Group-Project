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

export interface CoursesDat {
    data: {
        department: string,
        courses: {
            c_number: string,
            c_title: string
        }[]   
    }[],
    isloading: boolean
}