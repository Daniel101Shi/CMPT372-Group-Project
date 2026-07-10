import { ScheduleBuilder } from "./ScheduleBuilder/ScheduleBuilder";
import { CoursesContextProvider } from "./SFUCoursesAPISurface/coursesContext";
import { SemestersContextProvider } from "./SFUCoursesAPISurface/semestersContext";
import { YearsContextProvider } from "./SFUCoursesAPISurface/yearsContext";

export function ScheduleBuilderComponent() {
    return(
        <YearsContextProvider>
            <SemestersContextProvider>
                <CoursesContextProvider>
                    <ScheduleBuilder />
                </CoursesContextProvider>
            </SemestersContextProvider>
        </YearsContextProvider>
    )
}