import { createContext, useContext, useEffect, useState } from "react";
import type {courseOfferings, SelectedDat} from '../internal-types/models' 
import { useYearsContext } from "./yearsContext";
import { useSemestersContext } from "./semestersContext";
import { trivial_offering_selection } from "../helpers";

interface apiResult {
    text:string,
    value:string,
    title:string,
    classType:string,
    sectionCode:string,
    associatedClass:string,
}

function sleep(ms: number) { return (new Promise(resolve => setTimeout(resolve, ms))); }

let SelectedContext = createContext<SelectedDat | null>(null);

// TODO:
// should rewrite to store offerings and course in the same object
// then we can...
//  reduce number of api calls
//  preserve selected offering between mutating selected
//  offer an isloading boolean for each courses offerings for more responsiveness
// but until then minimal viable product
export function SelectedContextProvider({ children }: { children: React.ReactNode }) {
    let year_interface = useYearsContext();
    let semester_interface = useSemestersContext();
    let [selected, selected_setter] = useState<{ department: string, course_number: string, course_title: string}[]>([])
    let [offerings, offerings_setter] = useState<courseOfferings[][]>([])
    let [selected_offerings, selected_offerings_setter] = useState<{associated: number | null, lec: string | null, tut: string | null, lab: string | null, sem: string | null}[]>([]) 
    let [loading, load_state_setter] = useState(true);

    async function fetch_course_offerings(year: string, semester: string, department: string, course_number: string): Promise<courseOfferings[]>{
        if (year.length == 0 || semester.length == 0 || department.length == 0 || course_number.length == 0) {return []}
        let endpoint = `http://www.sfu.ca/bin/wcm/course-outlines?${year}/${semester}/${department}/${course_number}`
        const res = await fetch(endpoint, {
            method: "GET",
        });
        if (!res.ok) {
            return []
        }
        const json: apiResult[] = await res.json();
        const sorted_json = json.sort((a, b) => Number(a.associatedClass) - Number(b.associatedClass))
        let res_offerings: courseOfferings[] = []
        let dictionary:number[] = [] // I NEED TO MAP ARBITRARY ASSOCIATION NUMBERS WHY IS IT SO CRUEL
        sorted_json.forEach((x) => {
            if (dictionary.at(Number(x.associatedClass)) === undefined) {
                dictionary[Number(x.associatedClass)] = res_offerings.length
                res_offerings.push({
                    classes: {
                        lecs: [],
                        labs: [],
                        tuts: [],
                        sems: []
                    }
                })
            }
            let target = res_offerings.at(-1)
            if (target === undefined) {
                // unreachable
            } else {
                switch (x.sectionCode) {
                    case 'LEC':
                        target.classes.lecs.push(x.value)
                        break;
                    case 'LAB':
                        target.classes.labs.push(x.value)
                        break;
                    case 'TUT':
                        target.classes.tuts.push(x.value)
                        break;
                    case 'SEM':
                        target.classes.sems.push(x.value)
                        break;
                    default:
                        target.classes.lecs.push(x.value) // for dealing with opl and similar garbage while i prototype
                        break;
            }}
        })
        return res_offerings
    }

    async function fetch_offerings(year: string, semester: string, courses: {department: string, course_number: string}[]): Promise<courseOfferings[][]> {
        if (year.length == 0 || semester.length == 0) {return []}
        const offerings = await Promise.all(courses.map(x => fetch_course_offerings(year, semester, x.department, x.course_number)))
        return offerings
    }

    useEffect(() => {
        async function intitialise() {
            if (selected.length == 0) {
                load_state_setter(false)
                return
            }
            while (1) {
                try {
                    let init_data = await fetch_offerings(year_interface.selected.year, semester_interface.selected.semester, selected)
                    offerings_setter(init_data)
                    selected_offerings_setter(init_data.map((_, i) => trivial_offering_selection(i, 0, init_data)))
                    break;
                } catch (e) {
                    console.log(`failed to fetch offerings: ${e}`);
                    await sleep(5000);
                }
            }
            load_state_setter(false);
        }
        intitialise();
    }, [selected]) // offerings of selected will update whenever selected changes

    function clear() {
        load_state_setter(true)
        selected_setter([])
    }

    function remove_course({department, course_number, course_title}: {department: string, course_number: string, course_title: string}) {
        load_state_setter(true)
        selected_setter(prev => prev.filter(x => x.department != department || x.course_number != course_number || x.course_title != course_title))
    }

    function add_course({department, course_number, course_title}: {department: string, course_number: string, course_title: string}) {
        load_state_setter(true)
        selected_setter(prev => prev.concat([{department, course_number, course_title}]).toSorted((a, b) => a.department.localeCompare(b.department) * 2 + parseInt(a.course_number) - parseInt(b.course_number)))
    }

    return (
        <SelectedContext.Provider value={{selected, clear, add_course, remove_course, loading, offerings, selected_offerings, selected_offerings_setter}}>
            {children}
        </SelectedContext.Provider>
    );
}

export function useSelectedContext(): SelectedDat {
    let x = useContext(SelectedContext);
    if (x === null) {
        throw new Error('useSelectedContext used out of a provider')
    } else {
        return x
    }
}