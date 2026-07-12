import { createContext, useContext, useEffect, useState } from "react";
import type {YearsDat} from '../internal-types/models' 

interface apiResult {
    text:string,
    value:string
}

function sleep(ms: number) { return (new Promise(resolve => setTimeout(resolve, ms))); }

let YearsContext = createContext<YearsDat>({data: [], isloading: false, selected: {year: ""}, selected_setter: _ => {}})

export function YearsContextProvider({ children }: { children: React.ReactNode }) {
    let [selected, selected_setter] = useState({year: ""})
    let [years, years_setter] = useState<string[]>([]);
    let [loading, load_state_setter] = useState(true);

    async function fetch_years(): Promise<string[]> {
        let endpoint = `http://www.sfu.ca/bin/wcm/course-outlines`
        const res = await fetch(endpoint, {
            method: "GET",
        });
        if (!res.ok) {
            console.error(`courses api call failed: ${res.status}`);
            return []    
        }
        const json: apiResult[] = await res.json();
        const res_years = json.map(x => x.value)
        return res_years
    }

    useEffect(() => {
        async function intitialise() {
            load_state_setter(true)
            while (1) {
                try {
                    let init_data = await fetch_years()
                    years_setter(init_data);
                    selected_setter({year: new Date().getFullYear().toString() ?? ""})
                    break;
                } catch (e) {
                    console.log(`failed to fetch years: ${e}`);
                    await sleep(5000);
                }
            }
            load_state_setter(false);
        }
        intitialise();
    }, []) // years will update only on mount

    return (
        <YearsContext.Provider value={{ data: years, isloading: loading, selected, selected_setter}}>
            {children}
        </YearsContext.Provider>
    );
}

export function useYearsContext(): YearsDat {
    return useContext(YearsContext);
}