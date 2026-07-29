import type { courseOfferings } from "./internal-types/models"

export function trivial_offering_selection(crs: number, associated: number, offerings: courseOfferings[][]) {
    if (crs > offerings.length) {
        return {associated: null, lec: null, tut: null, lab: null, sem: null}
    }
    let target = offerings[crs].at(associated)
    if (target === undefined) {
        return {associated: null, lec: null, tut: null, lab: null, sem: null}
    }
    return {
        associated,
        lec: target.classes.lecs.at(0) ?? null,
        tut: target.classes.tuts.at(0) ?? null,
        lab: target.classes.labs.at(0) ?? null,
        sem: target.classes.sems.at(0) ?? null
    } 
}