import { createContext, useContext, useEffect, useState } from "react";
import type {SemsDat} from '../internal-types/models' 
import { useYearsContext } from "./yearsContext";

interface apiResult {
    text:string,
    value:string
}

function sleep(ms: number) { return (new Promise(resolve => setTimeout(resolve, ms))); }

let SemestersContext = createContext<SemsDat>({data: [], isloading: false, selected: {semester: ""}, selected_setter: _ => {}});

export function SemestersContextProvider({ children }: { children: React.ReactNode }) {
    let year_interface = useYearsContext();
    let [selected, selected_setter] = useState({semester: ""});
    let [semesters, semesters_setter] = useState<string[]>([]);
    let [loading, load_state_setter] = useState(true);


    async function fetch_sems(year: string): Promise<string[]> {
        if (year.length == 0) {return []}
        let endpoint = `http://www.sfu.ca/bin/wcm/course-outlines?${year}`
        const res = await fetch(endpoint, {
            method: "GET",
        });
        if (!res.ok) {
            console.error(`courses api call failed: ${res.status}`);
            return []    
        }
        const json: apiResult[] = await res.json();
        const res_semesters = json.map(x => x.value)
        return res_semesters;
    }

    useEffect(() => {
        async function intitialise() {
            load_state_setter(true)
            if (year_interface.isloading) {return}
            while (1) {
                try {
                    let init_data = await fetch_sems(year_interface.selected.year)
                    semesters_setter(init_data);
                    selected_setter(prev => 
                        init_data.includes(prev.semester) ? {semester: prev.semester} :
                        init_data.includes("fall") ? {semester: "fall"} :
                        init_data.includes("summer") ? {semester: "summer"} :
                        {semester: "spring"});
                    break;
                } catch (e) {
                    console.log(`failed to fetch semesters: ${e}`);
                    await sleep(5000);
                }
            }
            load_state_setter(false);
        }
        intitialise();
    }, [year_interface.selected]) // sems will update whenever selected year changes

    return (
        <SemestersContext.Provider value={{data: semesters, isloading: loading, selected, selected_setter}}>
            {children}
        </SemestersContext.Provider>
    );
}

export function useSemestersContext(): SemsDat {
    return useContext(SemestersContext);
}